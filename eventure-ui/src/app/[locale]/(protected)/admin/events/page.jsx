'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, IconButton, Pagination, Stack, TextField, Typography, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from 'next/link';

const statusColor = (s) => ({
  DRAFT: 'default',
  PLANNING: 'info',
  ACTIVE: 'success',
  COMPLETED: 'secondary',
  CANCELED: 'error'
}[s] || 'default');

export default function AdminEventsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const buildQS = (withAll = true) => {
    const p = new URLSearchParams();
    if (withAll) p.set('all','true');
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (type) p.set('type', type);
    return `?${p.toString()}`;
  };

  async function fetchAdmin(withAll = true) {
    const qs = buildQS(withAll);
    const r = await fetch(`/api/events${qs}`, { cache: 'no-store' });
    const text = await r.text();
    if (!r.ok) {
      // încercăm să interpretăm error payload-ul proxy-ului
      let j;
      try { j = JSON.parse(text); } catch {}
      throw {
        status: r.status,
        body: j || text || 'Unknown error'
      };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { rows: [], total: 0 };
    }
  }

  async function load() {
    setLoading(true); setErr(null);
    try {
      // 1) încearcă cu all=true (global)
      let data = await fetchAdmin(true);
      setRows(data.rows || []); setTotal(data.total || 0);
    } catch (e1) {
      // 2) fallback fără all (ca să nu blocheze UI)
      try {
        const data = await fetchAdmin(false);
        setRows(data.rows || []); setTotal(data.total || 0);
        setErr({
          title: 'Admin "all=true" failed',
          detail: e1
        });
      } catch (e2) {
        setErr({ title: 'Failed to load events', detail: e2 });
        setRows([]); setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [page, q, status, type]);

  return (
    <Stack spacing={2} sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Administrare evenimente</Typography>
        <IconButton onClick={load} disabled={loading}><RefreshIcon/></IconButton>
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField placeholder="Caută..." value={q} onChange={e=>setQ(e.target.value)} />
        <TextField label="Status" value={status} onChange={e=>setStatus(e.target.value)} />
        <TextField label="Tip" value={type} onChange={e=>setType(e.target.value)} />
      </Stack>

      <Divider/>

      {err && (
        <Alert severity="warning" sx={{ mb:1 }}>
          {err.title}. {typeof err.detail === 'object' ? JSON.stringify(err.detail) : String(err.detail)}
        </Alert>
      )}

      <Stack spacing={1}>
        {rows.map(r=>(
          <Card key={r.id} component={Link} href={`../../events/${r.id}`} sx={{ textDecoration:'none' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="h6">{r.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.type} • {r.date ? new Date(r.date).toLocaleString() : 'fără dată'}</Typography>
                </Stack>
                <Chip label={r.status} color={statusColor(r.status)} />
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!rows.length && (
          <Box sx={{ p:2, color:'text.secondary' }}>
            {loading ? 'Se încarcă…' : 'Nu există înregistrări.'}
          </Box>
        )}
      </Stack>

      <Stack direction="row" justifyContent="center">
        <Pagination count={Math.max(1, Math.ceil(total / pageSize))} page={page} onChange={(_,p)=>setPage(p)} />
      </Stack>
    </Stack>
  );
}
