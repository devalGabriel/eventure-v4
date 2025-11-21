// src/components/ui/NotifyButton.jsx
'use client';
import { Button } from '@mui/material';
import { useNotify } from '@/components/providers/NotificationProvider';

export default function NotifyButton() {
  const { notify } = useNotify();
  return <Button onClick={()=>notify('Saved successfully','success')}>Test notify</Button>;
}
