'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function ProviderGroupsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', currency: 'RON' });

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/groups?page=1&pageSize=50', { cache: 'no-store' });
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
    try {
      const r = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!r.ok) throw new Error(await r.text());
      setOpenNew(false);
      setForm({ name: '', description: '', price: '', currency: 'RON' });
      load();
    } catch (e) {
      alert('Create failed: ' + String(e));
    }
  }

  async function remove(id) {
    if (!confirm('Delete this group?')) return;
    const r = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    if (!r.ok) return alert('Delete failed: ' + (await r.text()));
    load();
  }

  useEffect(()=>{ load(); }, []);

  const filtered = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Grupuri servicii</Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Caută..." value={q} onChange={e=>setQ(e.target.value)} />
          <IconButton onClick={load} disabled={loading}><RefreshIcon/></IconButton>
          <Button variant="contained" startIcon={<AddIcon/>} onClick={()=>setOpenNew(true)}>Adaugă</Button>
        </Stack>
      </Stack>

      {err && <Typography color="error">{String(err)}</Typography>}
      {loading && <Typography color="text.secondary">Se încarcă…</Typography>}

      <Stack spacing={1}>
        {filtered.map(g => (
          <Card key={g.id} component={Link} href={`./groups/${g.id}`} sx={{ textDecoration:'none' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="h6">{g.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {g.currency || 'RON'}{g.price ?? ''} • {g.status}
                  </Typography>
                </Stack>
                <IconButton onClick={(e)=>{ e.preventDefault(); remove(g.id); }}><DeleteIcon/></IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && !loading && (
          <Box sx={{ p:2, color:'text.secondary' }}>Nu există grupuri.</Box>
        )}
      </Stack>

      <Dialog open={openNew} onClose={()=>setOpenNew(false)}>
        <DialogTitle>Adaugă grup</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Nume" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
            <TextField label="Descriere" value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} multiline rows={3} />
            <Stack direction="row" spacing={2}>
              <TextField label="Preț" value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} />
              <TextField label="Monedă" value={form.currency} onChange={e=>setForm(f=>({...f, currency:e.target.value}))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenNew(false)}>Anulează</Button>
          <Button variant="contained" onClick={create}>Salvează</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
