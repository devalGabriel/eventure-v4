// exemplu minimal jwks (RS256) – in auth-service
import { createPublicKey } from 'crypto';
import express from 'express';
const app = express();

// cheia privată RSA (PEM) e în env; derivăm cheia publică
const PRIVATE_PEM = process.env.AUTH_RSA_PRIVATE_PEM;

// dacă folosești jose pentru semnare cu RS256, păstrează KID-ul consistent
const KID = process.env.AUTH_JWT_KID || 'evt-key-1';
const PUB_PEM = createPublicKey(PRIVATE_PEM).export({ type: 'spki', format: 'pem' });

// expune in format JWKS
app.get('/auth/jwks.json', (req, res) => {
  // convertește PEM la JWK; poți folosi jose pentru `exportJWK`
  // sau păstrezi JWK direct în env. Pentru simplitate, recomand jose.
  res.json({ keys: [ /* JWK RS256 cu kid=KID */ ] });
});
