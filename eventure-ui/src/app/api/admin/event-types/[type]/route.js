// src/app/api/admin/event-types/[type]/route.js
import { proxyRequest } from '@/lib/bff/proxy';

export async function GET(req, { params }) {
    const p = await params;
    const base = process.env.EVENTS_INTERNAL_URL;
    return proxyRequest(
        req,
        base,
        `/admin/event-types/${encodeURIComponent(p.type)}`
    );
}

export async function PUT(req, { params }) {
    const p = await params;
    const base = process.env.EVENTS_INTERNAL_URL;

    return proxyRequest(
        req,
        base,
        `/admin/event-types/${encodeURIComponent(p.type)}`
    );
}
