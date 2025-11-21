import { ENV } from './env.js';
import { jwtVerify, importSPKI } from 'jose';

export async function verifyRequest(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) throw new Error('Missing Authorization');
  const token = auth.slice('Bearer '.length);
  let key;
  if (ENV.JWT_ALG === 'HS256') {
    key = new TextEncoder().encode(ENV.JWT_SHARED_SECRET);
  } else if (ENV.JWT_ALG === 'RS256') {
    if (!ENV.JWT_PUBLIC_KEY_BASE64) throw new Error('Missing JWT_PUBLIC_KEY_BASE64');
    const spki = Buffer.from(ENV.JWT_PUBLIC_KEY_BASE64, 'base64').toString('utf8');
    key = await importSPKI(spki, 'RS256');
  } else {
    throw new Error(`Unsupported JWT_ALG: ${ENV.JWT_ALG}`);
  }
  const { payload } = await jwtVerify(token, key, {
    algorithms: [ENV.JWT_ALG]
    // (opțional) poți adăuga issuer/audience când vei pune și în auth-service
    // issuer: ENV.JWT_ISS, audience: ENV.JWT_AUD
  });
  // ✅ acceptă și `id` din auth-service, nu doar `sub` / `userId`
  const userId = String(payload.sub ?? payload.userId ?? payload.id ?? '');
  const role = (payload.role ?? 'client');
  const email = payload.email;

  if (!userId) throw new Error('Invalid token payload');

  return { userId, role, email };
}
