'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function EventProgramPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title:'', startsAt:'', endsAt:'', note:'' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/events/${eventId}/programs`, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setRows(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }


  async function add() {
    try {
      const r = await fetch(`/api/events/${eventId}/programs`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify(form)
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ title:'', startsAt:'', endsAt:'', note:'' });
      load();
    } catch (e) {
      alert('Add failed: ' + String(e));
    }
  }


  async function remove(id) {
    if (!confirm('Ștergi slotul?')) return;
    const r = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
    if (!r.ok) return alert('Delete failed: ' + (await r.text()));
    load();
  }

  useEffect(()=>{ if (eventId) load(); /* eslint-disable-next-line */ }, [eventId]);

  if (loading) return <LinearProgress/>;
  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Program eveniment</Typography>
        <IconButton onClick={load}><RefreshIcon/></IconButton>
      </Stack>
      {err && <Alert severity="error">{String(err)}</Alert>}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField label="Titlu" fullWidth value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Start (ISO)" placeholder="2025-11-11T17:00" fullWidth value={form.startsAt} onChange={e=>setForm(f=>({...f, startsAt:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="End (ISO, opțional)" fullWidth value={form.endsAt} onChange={e=>setForm(f=>({...f, endsAt:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" onClick={add} fullWidth sx={{ height: '100%' }}>Adaugă</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {rows.map(r => (
          <Card key={r.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="subtitle1">{r.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(r.startsAt).toLocaleString()} {r.endsAt ? `→ ${new Date(r.endsAt).toLocaleString()}` : ''}
                  </Typography>
                  {r.note && <Typography>{r.note}</Typography>}
                </Stack>
                <Button size="small" color="error" onClick={()=>remove(r.id)}>Șterge</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!rows.length && <Box sx={{ p:2, color:'text.secondary' }}>Nu sunt sloturi.</Box>}
      </Stack>
    </Stack>
  );
}
