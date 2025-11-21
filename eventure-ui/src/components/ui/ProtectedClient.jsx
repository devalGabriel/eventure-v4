'use client';
import {useEffect, useState} from 'react';

export default function ProtectedClient({children}) {
  const [ok, setOk] = useState(false);
  useEffect(()=>{
    const has = document.cookie.split('; ').find(c=>c.startsWith('evt_session='));
    setOk(!!has);
  },[]);
  if(!ok) return null;
  return children;
}
