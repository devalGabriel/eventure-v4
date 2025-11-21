'use client';
import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Divider, Chip, LinearProgress } from '@mui/material';

export default function EventsStatsCard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/events/stats', { cache: 'no-store' });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'failed');
      setData(JSON.parse(t));
    } catch (e) {
      setErr(String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); }, []);

  if (loading) return <LinearProgress />;
  if (err) return <Typography color="error">Failed to load stats: {err}</Typography>;
  if (!data) return <Typography color="text.secondary">No data.</Typography>;

  const total = (data.byStatus || []).reduce((s, r) => s + (r.count || 0), 0);

  return (
    <Stack spacing={1}>
      <Typography variant="h6">Events Stats</Typography>
      <Typography variant="body2" color="text.secondary">Total: {total} • This month: {data.thisMonth}</Typography>
      <Divider/>
      <Box>
        <Typography variant="subtitle2">By status</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
          {data.byStatus?.map(s => (
            <Chip key={s.status} label={`${s.status} • ${s.count}`} />
          ))}
        </Stack>
      </Box>
      <Box>
        <Typography variant="subtitle2">By type</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
          {data.byType?.map(t => (
            <Chip key={t.type} label={`${t.type} • ${t.count}`} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
