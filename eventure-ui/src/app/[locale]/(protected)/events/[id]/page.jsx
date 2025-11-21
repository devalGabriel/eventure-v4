'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Divider, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getRoleServer } from '@/lib/utils';
import { useNotify } from '@/components/providers/NotificationProvider';

const statusOptions = ['DRAFT','PLANNING','ACTIVE','COMPLETED','CANCELED'];

function useEvent(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/events/${id}`, { cache: 'no-store' });
      const d = await r.json();
      setData(d);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ if(id) load(); }, [id]);
  return { data, loading, reload: load };
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const { data: event, loading, reload } = useEvent(id);
  const [tab, setTab] = useState(0);
  const [role, setRole] = useState('client');
  useEffect(() => {
    async function fetchRole() {
      const r = await getRoleServer();
      setRole(r);
    }
    fetchRole();
  }, []);

  if (!event) return <Box sx={{ p:2 }}>{loading ? 'Se încarcă…' : 'Eveniment inexistent.'}</Box>;

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack>
          <Typography variant="h5">{event.name}</Typography>
          <Typography variant="body2" color="text.secondary">{event.type} • {event.date ? new Date(event.date).toLocaleString() : 'fără dată'} • {event.location || '-'}</Typography>
        </Stack>
        <Chip label={event.status} />
      </Stack>

      <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Overview" />
        <Tab label="Tasks" />
        <Tab label="Invitations" />
        <Tab label="Messages" />
        <Tab label="Files" />
        <Tab label="Offers" />
      </Tabs>

      <Divider/>

      {tab === 0 && <OverviewTab event={event} onSaved={reload} />}
      {tab === 1 && <TasksTab eventId={event.id} />}
      {tab === 2 && <InvitationsTab eventId={event.id} />}
      {tab === 3 && <MessagesTab eventId={event.id} />}
      {tab === 4 && <FilesTab eventId={event.id} />}
      {tab === 5 && <OffersTab eventId={event.id} role={role} />}
    </Stack>
  );
}

function OverviewTab({ event, onSaved }) {
  const [name, setName] = useState(event.name || '');
  const [status, setStatus] = useState(event.status || 'DRAFT');
  const [location, setLocation] = useState(event.location || '');
  const [date, setDate] = useState(event.date ? new Date(event.date).toISOString().slice(0,16) : '');
  const [availableStatuses, setAvailableStatuses] = useState([]);
    const { notify } = useNotify();
  useEffect(() => {
    async function fetchStatuses() {
      const r = await fetch(`/api/events/${event.id}/available-status`, { cache: 'no-store' });
      const d = await r.json();
      setAvailableStatuses(d.allowed || []);
    }
    fetchStatuses();
  }, [event.id]);
  async function save() {
    const payload = {
      name: name || undefined,
      location: location || undefined,
      date: date ? new Date(date).toISOString() : null,
      status
    };
    const r = await fetch(`/api/events/${event.id}`, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    if (r.ok) {
      notify('Salvat cu succes.', "success");
      onSaved();
    }
    else notify('Nu s-a putut salva (verifică tranziția de status).', 'error');
  }

  return (
    <Card><CardContent>
      <Stack spacing={2} maxWidth={600}>
        <TextField label="Nume" value={name} onChange={e=>setName(e.target.value)} />
        <Select label="Status" value={status} onChange={e=>setStatus(e.target.value)}>
          {statusOptions.map(s => <MenuItem disabled={!availableStatuses.includes(s)} key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <TextField type="datetime-local" label="Data & ora" value={date} onChange={e=>setDate(e.target.value)} />
        <TextField label="Locație" value={location} onChange={e=>setLocation(e.target.value)} />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<SaveIcon/>} onClick={save}>Salvează</Button>
          <Button component={Link} href="../events" variant="outlined">Înapoi</Button>
        </Stack>
      </Stack>
    </CardContent></Card>
  );
}

function TasksTab({ eventId }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  
  async function load() {
    const r = await fetch(`/api/events/${eventId}/tasks`);
    const d = await r.json();
    console.log(d);
    setItems(d || []);
  }
  async function add() {
    if (!title.trim()) return;
    await fetch(`/api/events/${eventId}/tasks`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ title })});
    setTitle(''); await load();
  }
  async function toggle(it) {
    const next = it.status === 'DONE' ? 'TODO' : 'DONE';
    await fetch(`/api/events/${eventId}/tasks/${it.id}`, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ status: next })});
    await load();
  }
  useEffect(()=>{ load(); }, [eventId]);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField label="Task nou" value={title} onChange={e=>setTitle(e.target.value)} />
        <Button variant="contained" onClick={add}>Adaugă</Button>
      </Stack>
      {items.map(it=>(
        <Card key={it.id} sx={{ p:1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{it.title}</Typography>
            <Button size="small" onClick={()=>toggle(it)}>{it.status === 'DONE' ? 'Marchează TODO' : 'Marchează DONE'}</Button>
          </Stack>
        </Card>
      ))}
      {!items.length && <Box sx={{ p:2, color:'text.secondary' }}>Fără taskuri.</Box>}
    </Stack>
  );
}

function InvitationsTab({ eventId }) {
  const [items, setItems] = useState([]);
  const [invitedId, setInvitedId] = useState('');
  const [role, setRole] = useState('PROVIDER');
  async function load() {
    const r = await fetch(`/api/events/${eventId}/invitations`);
    const d = await r.json();
    setItems(d || []);
  }
  async function invite() {
    if (!invitedId.trim()) return;
    await fetch(`/api/events/${eventId}/invitations`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ invitedId: invitedId.trim(), role })});
    setInvitedId(''); await load();
  }
  useEffect(()=>{ load(); }, [eventId]);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField label="User ID provider" value={invitedId} onChange={e=>setInvitedId(e.target.value)} />
        <TextField label="Rol" value={role} onChange={e=>setRole(e.target.value)} />
        <Button variant="contained" onClick={invite}>Invită</Button>
      </Stack>
      {items.map(inv=>(
        <Card key={inv.id} sx={{ p:1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{inv.invitedId} • {inv.role}</Typography>
            <Chip label={inv.status} />
          </Stack>
        </Card>
      ))}
      {!items.length && <Box sx={{ p:2, color:'text.secondary' }}>Fără invitații.</Box>}
    </Stack>
  );
}

function MessagesTab({ eventId }) {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState('');
  async function load() {
    const r = await fetch(`/api/events/${eventId}/messages`);
    const d = await r.json();
    setItems(d || []);
  }
  async function post() {
    if (!body.trim()) return;
    await fetch(`/api/events/${eventId}/messages`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ body })});
    setBody(''); await load();
  }
  useEffect(()=>{ load(); }, [eventId]);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField label="Mesaj" value={body} onChange={e=>setBody(e.target.value)} fullWidth />
        <Button variant="contained" onClick={post}>Trimite</Button>
      </Stack>
      {items.map(m=>(
        <Card key={m.id} sx={{ p:1 }}>
          <Typography variant="body2" color="text.secondary">{new Date(m.createdAt).toLocaleString()}</Typography>
          <Typography>{m.body}</Typography>
        </Card>
      ))}
      {!items.length && <Box sx={{ p:2, color:'text.secondary' }}>Fără mesaje.</Box>}
    </Stack>
  );
}

function FilesTab({ eventId }) {
  const [list, setList] = useState([]);
  const [file, setFile] = useState(null);

  async function load() {
    const r = await fetch(`/api/events/${eventId}/attachments`);
    const d = await r.json();
    setList(d || []);
  }
  useEffect(()=>{ load(); }, [eventId]);

  async function upload() {
    if (!file) return;
    const body = { name: file.name, url: `/uploads/${file.name}`, mime: file.type, size: file.size }; // MVP: metadate; integrarea upload-ului real o faci în files-service
    await fetch(`/api/events/${eventId}/attachments`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    setFile(null); await load();
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <Button variant="contained" onClick={upload} disabled={!file}>Încarcă</Button>
      </Stack>
      {list.map(a=>(
        <Card key={a.id} sx={{ p:1 }}>
          <Typography>{a.name} • {a.mime || '-'} • {a.size ? `${a.size}B` : ''}</Typography>
        </Card>
      ))}
      {!list.length && <Box sx={{ p:2, color:'text.secondary' }}>Fără fișiere.</Box>}
    </Stack>
  );
}

function OffersTab({ eventId, role }) {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState({ startsAt:'', endsAt:'', totalCost:'', currency:'RON', notes:'' });

  async function load() {
    const r = await fetch(`/api/events/${eventId}/offers`);
    const d = await r.json();
    setList(d || []);
  }
  useEffect(()=>{ load(); }, [eventId]);

  async function saveOffer() {
    const payload = {
      startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null,
      endsAt: editing.endsAt ? new Date(editing.endsAt).toISOString() : null,
      totalCost: editing.totalCost ? Number(editing.totalCost) : null,
      currency: editing.currency,
      notes: editing.notes || null
    };
    await fetch(`/api/events/${eventId}/offers`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    setEditing({ startsAt:'', endsAt:'', totalCost:'', currency:'RON', notes:'' });
    await load();
  }

  async function setStatus(offerId, status) {
    await fetch(`/api/events/${eventId}/offers/${offerId}`, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ status })});
    await load();
  }

  return (
    <Stack spacing={2}>
      {role === 'provider' && (
        <Card><CardContent>
          <Typography variant="subtitle1" sx={{ mb:1 }}>Propune ofertă</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField type="datetime-local" label="Start" value={editing.startsAt} onChange={e=>setEditing(s=>({...s, startsAt:e.target.value}))} />
            <TextField type="datetime-local" label="Sfârșit" value={editing.endsAt} onChange={e=>setEditing(s=>({...s, endsAt:e.target.value}))} />
            <TextField label="Cost total" value={editing.totalCost} onChange={e=>setEditing(s=>({...s, totalCost:e.target.value}))} />
            <TextField label="Valută" value={editing.currency} onChange={e=>setEditing(s=>({...s, currency:e.target.value}))} />
            <TextField label="Note" value={editing.notes} onChange={e=>setEditing(s=>({...s, notes:e.target.value}))} />
            <Button variant="contained" onClick={saveOffer}>Trimite</Button>
          </Stack>
        </CardContent></Card>
      )}

      {list.map(o=>(
        <Card key={o.id}><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">{o.totalCost ? `${o.totalCost} ${o.currency || 'RON'}` : 'fără preț'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {o.startsAt ? new Date(o.startsAt).toLocaleString() : '-'} → {o.endsAt ? new Date(o.endsAt).toLocaleString() : '-'}
              </Typography>
              {o.notes && <Typography variant="body2">{o.notes}</Typography>}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip label={o.status} />
              {role === 'provider' && (o.status === 'DRAFT' || o.status === 'SENT') && (
                <>
                  {o.status === 'DRAFT' && <Button size="small" onClick={()=>setStatus(o.id,'SENT')}>Trimite</Button>}
                  <Button size="small" onClick={()=>setStatus(o.id,'WITHDRAWN')}>Retrage</Button>
                </>
              )}
              {role === 'client' && o.status === 'SENT' && (
                <>
                  <Button size="small" color="success" onClick={()=>setStatus(o.id,'ACCEPTED')}>Acceptă</Button>
                  <Button size="small" color="error" onClick={()=>setStatus(o.id,'REJECTED')}>Respinge</Button>
                </>
              )}
            </Stack>
          </Stack>
        </CardContent></Card>
      ))}
      {!list.length && <Box sx={{ p:2, color:'text.secondary' }}>Nu există oferte încă.</Box>}
    </Stack>
  );
}
