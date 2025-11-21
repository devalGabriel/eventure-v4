// node scripts/gen-dev-jwt.js role=userRole userId=123 email=you@example.com [expSeconds=86400]
import { SignJWT } from 'jose';
import 'dotenv/config';

async function run() {
  const args = Object.fromEntries(process.argv.slice(2).map(s => s.split('=')));
  const role = args.role || 'client';
  const userId = args.userId || 'u_dev_123';
  const email = args.email || 'dev@example.com';
  const expSeconds = parseInt(args.expSeconds || '86400', 10);

  if (process.env.JWT_ALG !== 'HS256' || !process.env.JWT_SHARED_SECRET) {
    console.error('Set HS256 and JWT_SHARED_SECRET in .env');
    process.exit(1);
  }

  const key = new TextEncoder().encode(process.env.JWT_SHARED_SECRET);
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({ role, email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + expSeconds)
    .sign(key);

  console.log(`JWT (${role}):\n${jwt}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
