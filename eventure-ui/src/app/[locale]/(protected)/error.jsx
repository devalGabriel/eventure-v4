'use client';
import { useEffect } from 'react';
import { Button, Typography, Stack } from '@mui/material';

export default function GlobalError({ error, reset }) {
  useEffect(()=>{
    (async ()=>{
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error);
      } catch (e) {
        console.error('Sentry not configured', e);
      }
    })();
    console.error(error);
  },[error]);

  return (
    <Stack spacing={2} sx={{ py: 8, textAlign:'center', alignItems:'center' }}>
      <Typography variant="h5">Something went wrong.</Typography>
      <Typography color="text.secondary">{error?.message || 'Unexpected error'}</Typography>
      <Button variant="contained" onClick={()=>reset()}>Try again</Button>
    </Stack>
  );
}
