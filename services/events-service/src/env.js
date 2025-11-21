import 'dotenv/config';

const required = (k, fb) => {
  const v = process.env[k] ?? fb;
  if (v === undefined || v === null || v === '') {
    throw new Error(`Missing env ${k}`);
  }
  return v;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4003', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ALG: required('JWT_ALG', 'HS256'),
  JWT_SHARED_SECRET: process.env.JWT_SHARED_SECRET,
  JWT_PUBLIC_KEY_BASE64: process.env.JWT_PUBLIC_KEY_BASE64,

  NATS_URL: process.env.NATS_URL ?? 'nats://localhost:4222',
  NATS_USER: process.env.NATS_USER ?? '',
  NATS_PASS: process.env.NATS_PASS ?? '',
  NATS_PREFIX: process.env.NATS_PREFIX ?? 'events'
};
