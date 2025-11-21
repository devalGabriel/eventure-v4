// services/events-service/src/plugins/auth.js
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify } from 'jose';

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  return (v === undefined || v === null || v === '') ? fallback : v;
}

// Decode header fără verificare – ca să logăm alg/kid la erori
function decodeJwtHeader(token) {
  try {
    const [h] = token.split('.');
    const json = Buffer.from(h, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default fp(async function authPlugin(fastify) {
  // Acceptă și variabilele vechi ca fallback (utile în dev)
  const AUTH_JWT_ALG    = getEnv('AUTH_JWT_ALG', getEnv('JWT_ALG', 'RS256')); // RS256 | HS256
  const AUTH_ISS        = getEnv('AUTH_JWT_ISS', getEnv('JWT_ISS', undefined));
  const AUTH_AUD        = getEnv('AUTH_JWT_AUD', getEnv('JWT_AUD', undefined));
  const AUTH_JWKS_URL   = getEnv('AUTH_JWKS_URL', getEnv('JWT_JWKS_URL', undefined));
  const AUTH_JWT_SECRET = getEnv('AUTH_JWT_SECRET', getEnv('JWT_SHARED_SECRET', undefined));

  fastify.log.info({ AUTH_JWT_ALG, hasJWKS: !!AUTH_JWKS_URL, hasSecret: !!AUTH_JWT_SECRET }, '[auth] config');

  let verifyWith;

  if (AUTH_JWT_ALG === 'RS256') {
    if (!AUTH_JWKS_URL) {
      fastify.log.warn('[auth] RS256 selectat dar lipseste AUTH_JWKS_URL — configurează /auth/jwks.json in auth-service sau treci pe HS256 pentru dev');
    } else {
      const JWKS = createRemoteJWKSet(new URL(AUTH_JWKS_URL));
      verifyWith = async (token) => {
        const { payload } = await jwtVerify(token, JWKS, {
          ...(AUTH_ISS ? { issuer: AUTH_ISS } : {}),
          ...(AUTH_AUD ? { audience: AUTH_AUD } : {})
        });
        return payload;
      };
    }
  }

  if (!verifyWith && AUTH_JWT_ALG === 'HS256') {
    if (!AUTH_JWT_SECRET) {
      fastify.log.warn('[auth] HS256 selectat dar lipseste AUTH_JWT_SECRET — setează același secret ca în auth-service');
    } else {
      const secret = new TextEncoder().encode(AUTH_JWT_SECRET);
      verifyWith = async (token) => {
        const { payload } = await jwtVerify(token, secret, {
          ...(AUTH_ISS ? { issuer: AUTH_ISS } : {}),
          ...(AUTH_AUD ? { audience: AUTH_AUD } : {})
        });
        return payload;
      };
    }
  }

  if (!verifyWith) {
    throw new Error('[auth] Config invalid: nu s-a putut initializa verificatorul JWT (RS256 fara JWKS si fara HS256 valid).');
  }

  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (req, reply) => {
    const isPublic = req.routerPath?.startsWith('/health') || req.raw.url?.startsWith('/health');
    if (isPublic) return;

    const ah = req.headers['authorization'] || '';
    if (!ah.toLowerCase().startsWith('bearer ')) {
      return reply.code(401).send({ code:'ERR_UNAUTHORIZED', message:'Missing Bearer token' });
    }
    const token = ah.slice(7).trim();

    try {
      const payload = await verifyWith(token);
      req.user = {
        id: payload.sub,
        role: payload.role || payload['x-role'] || 'client',
        email: payload.email || payload['x-email'] || undefined,
        raw: payload
      };
    } catch (e) {
      const hdr = decodeJwtHeader(token);
      req.log.error({ err: e, jwtHeader: hdr, iss: AUTH_ISS, aud: AUTH_AUD, alg: AUTH_JWT_ALG }, 'JWT verify failed');
      return reply.code(401).send({ code:'ERR_JWT_INVALID', message:'signature verification failed' });
    }
  });
});
