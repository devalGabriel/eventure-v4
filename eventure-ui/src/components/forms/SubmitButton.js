'use client';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import '@mui/lab'; // asigurăm tree-shake corect la build

export default function SubmitButton({ loading, children, ...rest }) {
  // fallback dacă @mui/lab nu e prezent în setup (e în @mui/lab)
  const [ok, setOk] = useState(false);
  useEffect(()=>{ setOk(true); },[]);
  if (!ok) return null;

  return (
    <LoadingButton loading={loading} variant="contained" type="submit" {...rest}>
      {children}
    </LoadingButton>
  );
}
