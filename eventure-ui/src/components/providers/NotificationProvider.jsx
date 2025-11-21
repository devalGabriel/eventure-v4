// src/components/providers/NotificationProvider.jsx
'use client';
import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const Ctx = createContext(null);
export function useNotify(){ return useContext(Ctx); }

export default function NotificationProvider({children}) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState({ message:'', severity:'info' });

  const notify = useCallback((message, severity='info')=>{
    setPayload({message, severity});
    setOpen(true);
  },[]);

  const value = useMemo(()=>({ notify }),[notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={3000} onClose={()=>setOpen(false)} anchorOrigin={{vertical:'bottom', horizontal:'right'}}>
        <Alert onClose={()=>setOpen(false)} severity={payload.severity} variant="filled" sx={{ width: '100%' }}>
          {payload.message}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}
