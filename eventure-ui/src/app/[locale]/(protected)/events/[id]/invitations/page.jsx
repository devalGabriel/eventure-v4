'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function EventInvitationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [inv, setInv] = useState([]);
  const [offers, setOffers] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const [ri, ro] = await Promise.all([
        fetch(`/api/events/${eventId}/invitations`, { cache: 'no-store' }),
        fetch(`/api/events/${eventId}/offers`, { cache: 'no-store' })
      ]);
      const ti = await ri.text(); const to = await ro.text();
      if (!ri.ok) throw new Error(ti || 'inv failed');
      if (!ro.ok) throw new Error(to || 'offers failed');
      setInv(JSON.parse(ti)); setOffers(JSON.parse(to));
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function invite() {
    try {
      const r = await fetch(`/api/events/${eventId}/invitations`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ providerId, note })
      });
      if (!r.ok) throw new Error(await r.text());
      setProviderId(''); setNote('');
      load();
    } catch (e) {
      alert('Invite failed: ' + String(e));
    }
  }

  useEffect(()=>{ if (eventId) load(); /* eslint-disable-next-line */ }, [eventId]);

  if (loading) return <LinearProgress/>;
  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Invitații & Oferte</Typography>
        <IconButton onClick={load}><RefreshIcon/></IconButton>
      </Stack>
      {err && <Alert severity="error">{String(err)}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6">Trimite invitație</Typography>
          <Grid container spacing={2} sx={{ mt:1 }}>
            <Grid item xs={12} md={4}>
              <TextField label="Provider userId" fullWidth value={providerId} onChange={e=>setProviderId(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Notă (opțional)" fullWidth value={note} onChange={e=>setNote(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={invite} fullWidth sx={{ height: '100%' }}>Invită</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Invitații trimise</Typography>
          <Stack spacing={1} sx={{ mt:1 }}>
            {inv.map(i => (
              <Box key={i.id} sx={{ p:1, border:'1px solid', borderColor:'divider', borderRadius:1 }}>
                <Typography variant="subtitle2">Provider: {i.providerId}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {i.status}</Typography>
                {i.note && <Typography variant="body2">Note: {i.note}</Typography>}
              </Box>
            ))}
            {!inv.length && <Box sx={{ p:1, color:'text.secondary' }}>Nu există invitații.</Box>}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Oferte primite</Typography>
          <Stack spacing={1} sx={{ mt:1 }}>
            {offers.map(o => (
              <Box key={o.id} sx={{ p:1, border:'1px solid', borderColor:'divider', borderRadius:1 }}>
                <Typography variant="subtitle2">{o.title} — {o.currency}{o.price ?? ''}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {o.status}</Typography>
                {o.description && <Typography variant="body2">{o.description}</Typography>}
                {o.status === 'SENT' && (
                  <Stack direction="row" spacing={1} sx={{ mt:1 }}>
                    <Button size="small" variant="outlined" onClick={()=>decide(o.id,'ACCEPTED')}>Acceptă</Button>
                    <Button size="small" color="error" variant="outlined" onClick={()=>decide(o.id,'DECLINED')}>Respinge</Button>
                  </Stack>
                )}
              </Box>
            ))}
            {!offers.length && <Box sx={{ p:1, color:'text.secondary' }}>Nu există oferte.</Box>}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  async function decide(id, decision) {
    try {
      const r = await fetch(`/api/offers/${id}/decision`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ decision })
      });
      if (!r.ok) throw new Error(await r.text());
      load();
    } catch (e) {
      alert('Decision failed: ' + String(e));
    }
  }
}
