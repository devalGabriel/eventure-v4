'use client';
import { useEffect, useState } from 'react';
import { Stack, Typography, Button, CircularProgress } from '@mui/material';
import Card from '@/components/design/Card';
import { getFlag } from '@/lib/flags';

export default function AiSuggestionsCard() {
  const enabled = getFlag('AI_SUGGESTIONS');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  if (!enabled) return null;

  async function fetchData(){
    try{
      setLoading(true);
      // TODO: real call la API gateway (ex: http://localhost:400X/ai/suggestions)
      // simulare:
      await new Promise(r=>setTimeout(r, 500));
      setData({
        title: 'Sugestii pentru evenimentul tău',
        items: [
          'Adaugă un task de follow-up pentru furnizorii de muzică (7 zile)',
          'Rezervă oferta foto-video până pe 15 noiembrie',
          'Propunere buget: +10% pe decorațiuni pentru impact vizual'
        ]
      });
    } finally { setLoading(false); }
  }

  useEffect(()=>{ fetchData(); },[]);

  return (
    <Card sx={{ minHeight: 140 }}>
      <Stack spacing={1}>
        <Typography variant="h6">{data?.title || 'AI Suggestions'}</Typography>
        {loading && <CircularProgress size={18} />}
        {!loading && data?.items?.map((it, i)=>(
          <Typography key={i} variant="body2" color="text.secondary">• {it}</Typography>
        ))}
        <Stack direction="row" spacing={1} sx={{mt:1}}>
          <Button size="small" onClick={fetchData}>Refresh</Button>
          <Button size="small" variant="outlined">Aplică în taskuri</Button>
        </Stack>
      </Stack>
    </Card>
  );
}
