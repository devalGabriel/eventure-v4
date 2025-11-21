'use client';
import { useEffect } from 'react';

const API_USERS = (process.env.NEXT_PUBLIC_USERS_URL || 'http://localhost:4102').replace(/\/$/, '');

export default function AppBootstrap({ authed }) {
  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!authed) {
        window.__evt_roles = [];
        window.dispatchEvent(new Event('evt:roles-set'));
        return;
      }
      try {
        const res = await fetch(`${API_USERS}/v1/users/me`, { credentials: 'include' });
        if (!res.ok) throw new Error(`users/me ${res.status}`);
        const data = await res.json();
        if (ignore) return;

        window.__evt_profile = data;
        window.__evt_roles = Array.isArray(data.roles) ? data.roles : [];
        window.dispatchEvent(new Event('evt:roles-set'));
      } catch {
        // dacă e 401 temporar la boot, evităm „roșu” în consolă
        window.__evt_roles = [];
        window.dispatchEvent(new Event('evt:roles-set'));
      }
    }

    loadProfile();
    return () => { ignore = true; };
  }, [authed]);

  return null;
}
