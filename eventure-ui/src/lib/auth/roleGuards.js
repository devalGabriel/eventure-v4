// src/lib/auth/roleGuards.js
// server-only helpers (App Router)
import { cookies } from 'next/headers';

export function hasAnyRole(user, roles = []) {
  if (!user) return false;
  return roles.includes(user.role);
}

// NOTE: Provizoriu: extragem rolul/uid din cookie-uri până legăm AUTH real.
export async function getCurrentUserServer() {
  const sess = cookies().get('evt_session')?.value || null;
  if (!sess) return null;
  const role = cookies().get('evt_role')?.value || 'client';
  const uid = cookies().get('evt_uid')?.value || 'unknown';
  return { id: uid, role };
}

export async function assertRoleServer(roles) {
  const me = await getCurrentUserServer();
  if (!hasAnyRole(me, roles)) {
    throw new Error('FORBIDDEN_ROLE');
  }
  return me;
}
