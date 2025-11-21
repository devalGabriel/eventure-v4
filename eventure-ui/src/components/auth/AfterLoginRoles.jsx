'use client';
import { useEffect } from 'react';
import { currentUserAuth } from '@/lib/auth';

export default function AfterLoginRoles() {
  useEffect(()=>{
    (async ()=>{
      try {
               const me = await currentUserAuth();  // ← AUTH /me
       const roles = me?.role ? [String(me.role).toUpperCase()] : (me?.roles || []);
       window.__evt_roles = roles;
        // trigger un eveniment pt. componente care vor să se re-randeze
        window.dispatchEvent(new CustomEvent('evt:roles-set'));
      } catch(e) {
        // ignore; rămâne fallback
      }
    })();
  },[]);
  return null;
}
