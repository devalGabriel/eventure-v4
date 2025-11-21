// src/lib/notificationsApi.js
import { httpFetch } from './api';

const API_NOTIF = (process.env.NEXT_PUBLIC_NOTIF_URL || 'http://localhost:4105')
  .replace(/\/$/, '');

// ======================================================================
// GET notifications list
// ======================================================================
export async function getNotifications(locale = 'ro') {
  return httpFetch(`${API_NOTIF}/v1/notifications`, {
    method: 'GET',
    locale,
    retries: 0
  });
}

// ======================================================================
// Mark ONE notification as read
// ======================================================================
export async function markNotificationRead(id) {
  const res = await fetch(`/api/notifications/mark-read/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Failed to mark notification read: ${res.status} ${txt}`);
  }

  // nu avem nevoie de body aici; important e să nu pice
  return;
}

// ======================================================================
// Mark ALL as read
// ======================================================================
export async function markAllNotificationsRead(locale = 'ro') {
  return httpFetch(`${API_NOTIF}/v1/notifications/read-all`, {
    method: 'POST',
    locale,
    retries: 0
  });
}
