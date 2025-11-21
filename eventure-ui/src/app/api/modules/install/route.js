import { MODULES_SERVICE_URL } from "@/lib/services";
export async function POST(req) {
  try {
    const form = await req.formData(); // păstrăm boundary-ul intact
    const upstream = await fetch('http://localhost:4007/modules/install', {
      method: 'POST',
      body: form, // forward direct FormData
      // NU seta manual Content-Type; fetch îl pune cu boundary corect
    });

    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}