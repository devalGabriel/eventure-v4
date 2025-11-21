// src/components/profile/PasswordForm.jsx
'use client';
import { useState } from 'react';
import { TextField, Button, Stack, Alert } from '@mui/material';
import { useNotify } from '@/components/providers/NotificationProvider';
import { changePassword } from '@/lib/auth';

export default function PasswordForm() {
  const [v, setV] = useState({ oldPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const { notify } = useNotify();

  function setField(k, val) { setV(s => ({ ...s, [k]: val })); }

  async function submit() {
    try {
      setErr('');
      setOk(false);
      if (v.newPassword.length < 6) throw new Error('Parola nouă trebuie să aibă minim 6 caractere.');
      await changePassword(v); // implementează endpoint-ul în users-service sau auth-service
      setOk(true);
      notify('Parola a fost schimbată', 'success');
    } catch(e) {
      setErr(e.message || 'Eroare');
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      {err && <Alert severity="error">{err}</Alert>}
      {ok && <Alert severity="success">Parola a fost schimbată.</Alert>}
      <TextField
        label="Parola curentă"
        type="password"
        value={v.oldPassword}
        onChange={(e)=>setField('oldPassword', e.target.value)}
      />
      <TextField
        label="Parola nouă"
        type="password"
        value={v.newPassword}
        onChange={(e)=>setField('newPassword', e.target.value)}
      />
      <Button variant="contained" onClick={submit}>Schimbă parola</Button>
    </Stack>
  );
}
