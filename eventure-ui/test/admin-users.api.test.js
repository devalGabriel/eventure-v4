import { listAdminUsers } from '@/lib/admin';

global.fetch = jest.fn();

beforeEach(() => jest.resetAllMocks());

test('builds qs with sort/dir/query', async () => {
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ items:[] }), { status:200 }));
  await listAdminUsers({ limit:20, sort:'email', dir:'asc', query:'gabriel' });
  const called = fetch.mock.calls[0][0];
  expect(called).toMatch(/limit=20/);
  expect(called).toMatch(/sort=email/);
  expect(called).toMatch(/dir=asc/);
  expect(called).toMatch(/query=gabriel/);
});
