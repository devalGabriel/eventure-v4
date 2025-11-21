'use client';
import { useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';

const TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'baptism', label: 'Baptism' },
  { value: 'corporate', label: 'Corporate' }
];

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', type:'wedding', date:'', location:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function submit() {
    setErr('');
    if (!form.name?.trim()) { setErr('Numele este obligatoriu'); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        date: form.date ? new Date(form.date).toISOString() : null,
        location: form.location || null,
        status: 'DRAFT',
        notes: form.notes || null
      };
      const r = await fetch('/api/events', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('create_failed');
      const e = await r.json();
      router.replace(`../events/${e.id}`);
    } catch (e) {
      setErr('Nu s-a putut crea evenimentul.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Typography variant="h5">Creează eveniment</Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField label="Nume" value={form.name} onChange={e=>set('name', e.target.value)} />
            <TextField label="Tip" select value={form.type} onChange={e=>set('type', e.target.value)}>
              {TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField type="datetime-local" label="Data & ora" value={form.date} onChange={e=>set('date', e.target.value)} />
            <TextField label="Locație" value={form.location} onChange={e=>set('location', e.target.value)} />
            <TextField label="Notițe" multiline minRows={3} value={form.notes} onChange={e=>set('notes', e.target.value)} />
            {err && <Box sx={{ color:'error.main' }}>{err}</Box>}
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={submit} disabled={loading}>Salvează</Button>
              <Button variant="outlined" onClick={()=>history.back()} disabled={loading}>Renunță</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
