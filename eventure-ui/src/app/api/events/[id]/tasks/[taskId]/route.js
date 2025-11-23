// src/app/api/events/[id]/tasks/[taskId]/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const p = await params;
  return proxyRequest(
    req,
    process.env.EVENTS_INTERNAL_URL,
    `/events/${p.id}/tasks/${p.taskId}`
  );
}

export async function DELETE(req, { params }) {
  const p = await params;
  console.log("delete link: ",    `/events/${p.id}/tasks/${p.taskId}`
)
  return proxyRequest(
    req,
    process.env.EVENTS_INTERNAL_URL,
    `/events/${p.id}/tasks/${p.taskId}`
  );
}
