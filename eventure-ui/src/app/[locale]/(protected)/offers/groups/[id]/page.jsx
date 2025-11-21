'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, LinearProgress, MenuItem, Stack, TextField, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';

function currencyList() {
  return ['RON','EUR','USD','GBP'];
}
function statusList() {
  return ['ACTIVE','INACTIVE'];
}

export default function ProviderGroupDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [g, setG] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', currency:'RON', status:'ACTIVE' });

  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({ userId:'', role:'', note:'' });

  async function load() {
    if (!id) return;
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/groups/${id}`, { cache: 'no-store' });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'failed');
      const data = JSON.parse(t);
      setG(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        price: data.price ?? '',
        currency: data.currency || 'RON',
        status: data.status || 'ACTIVE'
      });
    } catch (e) {
      setErr(String(e));
      setG(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [id]);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'save failed');
      setG(JSON.parse(t));
    } catch (e) {
      alert('Save failed: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeGroup() {
    if (!confirm('Ștergi definitiv acest grup?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      router.push('../../groups');
    } catch (e) {
      alert('Delete failed: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function addMember() {
    if (!addForm.userId) {
      alert('userId este obligatoriu (provider user)');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/groups/${id}/members`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify(addForm)
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'add failed');
      setOpenAdd(false);
      setAddForm({ userId:'', role:'', note:'' });
      await load();
    } catch (e) {
      alert('Add member failed: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId) {
    if (!confirm('Elimini membrul din grup?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/groups/${id}/members/${memberId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      alert('Remove failed: ' + String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LinearProgress />;

  if (err) return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button component={Link} href="../.." startIcon={<ArrowBackIcon/>}>Înapoi</Button>
        <IconButton onClick={load}><RefreshIcon/></IconButton>
      </Stack>
      <Alert severity="error">Eroare la încărcare: {String(err)}</Alert>
    </Stack>
  );

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} href="../.." startIcon={<ArrowBackIcon/>}>Înapoi</Button>
          <Typography variant="h5">{g?.name || 'Grup'}</Typography>
          <Chip label={g?.status || 'ACTIVE'} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button color="error" onClick={removeGroup} startIcon={<DeleteIcon/>} disabled={busy}>Șterge</Button>
          <Button variant="contained" onClick={save} startIcon={<SaveIcon/>} disabled={busy}>Salvează</Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6">Detalii grup</Typography>
          <Divider sx={{ my:1 }}/>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nume" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Status" value={form.status} onChange={e=>setForm(f=>({...f, status:e.target.value}))}>
                {statusList().map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Descriere" value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Preț" value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Monedă" value={form.currency} onChange={e=>setForm(f=>({...f, currency:e.target.value}))}>
                {currencyList().map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:1 }}>
            <Typography variant="h6">Membri</Typography>
            <Button variant="outlined" startIcon={<AddIcon/>} onClick={()=>setOpenAdd(true)}>Adaugă membru</Button>
          </Stack>
          <Divider sx={{ mb:2 }}/>
          <Stack spacing={1}>
            {g?.members?.map(m => (
              <Card key={m.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1">UserID: {m.userId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {m.role ? `Rol: ${m.role}` : 'Rol nesetat'} {m.note ? `• Note: ${m.note}` : ''}
                      </Typography>
                    </Stack>
                    <IconButton onClick={()=>removeMember(m.id)}><DeleteIcon/></IconButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {(!g?.members || g.members.length===0) && (
              <Box sx={{ p:2, color:'text.secondary' }}>Nu sunt membri în acest grup.</Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={openAdd} onClose={()=>setOpenAdd(false)}>
        <DialogTitle>Adaugă membru</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="User ID (provider)" value={addForm.userId} onChange={e=>setAddForm(f=>({...f, userId:e.target.value}))} />
            <TextField label="Rol în grup (opțional)" value={addForm.role} onChange={e=>setAddForm(f=>({...f, role:e.target.value}))} />
            <TextField label="Note (opțional)" value={addForm.note} onChange={e=>setAddForm(f=>({...f, note:e.target.value}))} multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenAdd(false)}>Anulează</Button>
          <Button variant="contained" onClick={addMember} disabled={busy}>Adaugă</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
