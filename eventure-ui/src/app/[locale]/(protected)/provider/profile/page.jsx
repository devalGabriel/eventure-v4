'use client';
import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Grid, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';

export default function ProviderProfilePage() {
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ displayName:'', description:'', phone:'', location:'', mediaUrl:'', status:'ACTIVE' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/providers/me', { cache: 'no-store' });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'failed');
      const st = JSON.parse(t);
      setState(st);
      const p = st.profile || {};
      setForm({
        displayName: p.displayName || '',
        description: p.description || '',
        phone: p.phone || '',
        location: p.location || '',
        mediaUrl: p.mediaUrl || '',
        status: p.status || 'ACTIVE'
      });
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch('/api/providers/me', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'save failed');
      await load();
    } catch (e) {
      alert('Save failed: ' + String(e));
    } finally {
      setSaving(false);
    }
  }

  useEffect(()=>{ load(); }, []);

  if (loading) return <LinearProgress/>;

  if (!state?.approved) {
    return (
      <Stack spacing={2} sx={{ p:2 }}>
        <Alert severity="info">Nu ești încă aprobat ca furnizor. Mergi la pagina „Aplică” pentru a începe.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Typography variant="h5">Profil furnizor</Typography>
      {err && <Alert severity="error">{String(err)}</Alert>}
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Nume afișat" fullWidth value={form.displayName} onChange={e=>setForm(f=>({...f, displayName:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Status" fullWidth value={form.status} onChange={e=>setForm(f=>({...f, status:e.target.value}))}>
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descriere" fullWidth multiline rows={4} value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Telefon" fullWidth value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Locație" fullWidth value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))}/>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Media URL (site/portofoliu)" fullWidth value={form.mediaUrl} onChange={e=>setForm(f=>({...f, mediaUrl:e.target.value}))}/>
            </Grid>
          </Grid>
          <Box sx={{ mt:2 }}>
            <Button variant="contained" onClick={save} disabled={saving}>Salvează</Button>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
