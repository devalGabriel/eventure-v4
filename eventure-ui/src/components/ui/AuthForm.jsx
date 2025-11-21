'use client';
import {useState} from 'react';
import {Box, Button, Stack, TextField, Alert} from '@mui/material';
import {useTranslations, useLocale} from 'next-intl';

export default function AuthForm({mode='login', onSubmit}) {
  const t = useTranslations();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [payload,setPayload]=useState({email:'', password:'', name:''});
  const locale = useLocale();

  async function handleSubmit(e){
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{maxWidth:420, mx:'auto'}}>
      <Stack spacing={2}>
        {mode==='register' && (
          <TextField label={t('auth.name')} value={payload.name}
            onChange={(e)=>setPayload({...payload, name:e.target.value})} required />
        )}
        <TextField type="email" label={t('auth.email')} value={payload.email}
          onChange={(e)=>setPayload({...payload, email:e.target.value})} required />
        {mode!=='forgot' && (
          <TextField type="password" label={t('auth.password')} value={payload.password}
            onChange={(e)=>setPayload({...payload, password:e.target.value})} required />
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" disabled={loading}>
          {mode==='login' ? t('auth.signin') : mode==='register' ? t('auth.signup') : t('auth.forgot')}
        </Button>
      </Stack>
    </Box>
  );
}
