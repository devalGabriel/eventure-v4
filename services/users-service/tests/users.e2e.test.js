require('dotenv').config({ path: '.env' });
const build = require('../src/server');

let app;

beforeAll(async () => {
  app = build();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

test('GET /health', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.ok).toBe(true);
});

test('List users empty', async () => {
  const res = await app.inject({ method: 'GET', url: '/v1/users' });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.count).toBeDefined();
});

test('GET /v1/users paginated', async () => {
  const res = await app.inject({ method: 'GET', url: '/v1/users?page=1&pageSize=5' });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body).toHaveProperty('page');
  expect(body).toHaveProperty('pageSize');
});

test('POST /v1/users/bulk (bad request)', async () => {
  const res = await app.inject({ method:'POST', url:'/v1/users/bulk', payload:{} });
  expect(res.statusCode).toBe(400);
});