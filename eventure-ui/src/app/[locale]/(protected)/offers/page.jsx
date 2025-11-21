'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function ProviderOffersPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillEvent = search.get('eventId') || '';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // form creare rapidă
  const [form, setForm] = useState({
    eventId: prefillEvent,
    title: '',
    description: '',
    price: '',
    currency: 'RON',
    serviceGroupId: ''
  });

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/offers', { cache: 'no-store' });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'failed');
      const j = JSON.parse(t);
      setRows(j.rows || []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!form.eventId || !form.title) {
      alert('EventId și Title sunt obligatorii');
      return;
    }
    try {
      const r = await fetch(`/api/events/${form.eventId}/offers`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify(form)
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ eventId: prefillEvent, title:'', description:'', price:'', currency:'RON', serviceGroupId:'' });
      load();
    } catch (e) {
      alert('Create failed: ' + String(e));
    }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);

  if (loading) return <LinearProgress/>;
  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Ofertele mele</Typography>
        <IconButton onClick={load}><RefreshIcon/></IconButton>
      </Stack>
      {err && <Alert severity="error">{String(err)}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6">Creează ofertă</Typography>
          <Grid container spacing={2} sx={{ mt:1 }}>
            <Grid item xs={12} md={3}>
              <TextField label="Event ID" fullWidth value={form.eventId} onChange={e=>setForm(f=>({...f, eventId:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Titlu" fullWidth value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Preț" fullWidth value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Monedă" value={form.currency} onChange={e=>setForm(f=>({...f, currency:e.target.value}))}>
                <MenuItem value="RON">RON</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descriere" fullWidth multiline rows={2} value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Service Group ID (opțional)" fullWidth value={form.serviceGroupId} onChange={e=>setForm(f=>({...f, serviceGroupId:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="contained" onClick={create} fullWidth sx={{ height: '100%' }}>Creează</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {rows.map(o => (
          <Card key={o.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="subtitle1">{o.title} — {o.currency}{o.price ?? ''}</Typography>
                  <Typography variant="body2" color="text.secondary">Status: {o.status} • Event: {o.eventId}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  {o.status === 'DRAFT' && (
                    <>
                      <Button size="small" onClick={()=>update(o.id,{ status:'SENT' })}>Trimite</Button>
                      <Button size="small" color="error" onClick={()=>update(o.id,{ status:'CANCELLED' })}>Anulează</Button>
                    </>
                  )}
                  {o.status === 'SENT' && (
                    <Button size="small" color="error" onClick={()=>update(o.id,{ status:'CANCELLED' })}>Retrage</Button>
                  )}
                </Stack>
              </Stack>
              {o.description && <Typography sx={{ mt:1 }}>{o.description}</Typography>}
            </CardContent>
          </Card>
        ))}
        {!rows.length && <Box sx={{ p:2, color:'text.secondary' }}>Nu există oferte.</Box>}
      </Stack>
    </Stack>
  );

  async function update(id, patch) {
    try {
      const r = await fetch(`/api/offers/${id}`, {
        method: 'PUT',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify(patch)
      });
      if (!r.ok) throw new Error(await r.text());
      load();
    } catch (e) {
      alert('Update failed: ' + String(e));
    }
  }
}
