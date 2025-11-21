'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, Pagination, Stack, TextField, Typography, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from 'next/link';

const statusColor = (s) => ({
  DRAFT: 'default',
  PLANNING: 'info',
  ACTIVE: 'success',
  COMPLETED: 'secondary',
  CANCELED: 'error'
}[s] || 'default');

export default function EventsListPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set('owner','me');
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (type) p.set('type', type);
    return `?${p.toString()}`;
  }, [q,status,type,page]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/events${qs}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('Failed');
      const data = await r.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Evenimentele mele</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={load} disabled={loading}><RefreshIcon/></IconButton>
          <Button component={Link} href="events/new" variant="contained" startIcon={<AddIcon/>}>Eveniment nou</Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          placeholder="Caută după nume..."
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment> }}
          fullWidth
        />
        <TextField label="Status" value={status} onChange={e=>setStatus(e.target.value)} placeholder="DRAFT/ACTIVE..." />
        <TextField label="Tip" value={type} onChange={e=>setType(e.target.value)} placeholder="wedding/corporate..." />
      </Stack>

      <Divider/>

      <Stack spacing={1}>
        {rows.map(r => (
          <Card key={r.id} component={Link} href={`events/${r.id}`} sx={{ textDecoration: 'none' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack>
                  <Typography variant="h6">{r.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.type} • {r.date ? new Date(r.date).toLocaleString() : 'fără dată'}</Typography>
                </Stack>
                <Chip label={r.status} color={statusColor(r.status)} />
                <Button size="small" variant="outlined" component={Link} href={`events/${r.id}`}>Vezi detalii</Button>
                <Button size="small" variant="outlined" component={Link} href={`events/${r.id}/invitations`}>Invitatii</Button>
                <Button size="small" variant="outlined" component={Link} href={`events/${r.id}/program`}>Program</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!rows.length && (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            {loading ? 'Se încarcă…' : 'Nu ai evenimente încă.'}
          </Box>
        )}
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
        <Pagination
          count={Math.max(1, Math.ceil(total / pageSize))}
          page={page}
          onChange={(_,p)=>setPage(p)}
        />
      </Stack>
    </Stack>
  );
}
