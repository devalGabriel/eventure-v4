'use client';
import { useEffect, useState } from 'react';

export default function ClientRoleGate({ roles=[], fallback=null, children }) {
  const [ok, setOk] = useState(false);
  useEffect(()=>{
    // Simplu: rolurile pot fi expuse de backend și salvate în window.__evt_roles (ex. injectate după login)
    const userRoles = (window.__evt_roles || []);
    setOk(userRoles.some(r => roles.includes(r)));
  },[roles]);
  if (!ok) return fallback;
  return children;
}
