// services/events-service/src/middlewares/auth.js
/**
 * Factory ce creează metoda app.verifyAuth(req)
 * - citește token din Cookie / Authorization
 * - apelează AUTH_URL/auth/me pentru validare
 * - întoarce payload-ul userului
 */
export function verifyAuthFactory({ prisma }) {
  const AUTH_URL = process.env.AUTH_URL?.replace(/\/$/, '');

  return async function verifyAuth(req) {
    console.log('auth_url', AUTH_URL )
    if (!AUTH_URL) {
      console.log('in auth_url, so true')
      // fallback: în lipsă de auth-service, tratăm ca „client”
      return { role: 'client', userId: null };
    }

    const cookieHeader = req.headers.cookie || '';
    const authHeader = req.headers.authorization || '';

    // extragem tokenul din cookie sau header
    let bearer = null;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      bearer = authHeader;
    } else if (cookieHeader.includes('evt_jwt') || cookieHeader.includes('evt_token')) {
      const match = cookieHeader.match(/(evt_jwt|evt_token)=([^;]+)/);
      if (match) bearer = `Bearer ${match[2]}`;
    }

    const headers = {
      Accept: 'application/json',
      ...(bearer ? { Authorization: bearer } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };
    
    try {
      const r = await fetch(`${AUTH_URL}/auth/me`, {
        method: 'GET',
        headers,
      });

      if (!r.ok) {
        // 401 → considerăm client anonim
        return { role: 'client', userId: null };
      }

      const data = await r.json().catch(() => ({}));
      if (!data || !data.id) {
        return { role: 'client', userId: null };
      }

      return data; // { userId, email, role, ... }
    } catch (e) {
      console.warn('verifyAuth error:', e?.message || e);
      return { role: 'client', userId: null };
    }
  };
}
