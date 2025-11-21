import { httpFetch } from '@/lib/api';

global.fetch = jest.fn();

beforeEach(()=> jest.resetAllMocks());

test('retries on 503 then succeeds', async ()=>{
  fetch
    .mockResolvedValueOnce(new Response(JSON.stringify({code:'X'}), { status:503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok:true }), { status:200 }));

  const res = await httpFetch('http://x', { method:'GET', retries:1 });
  expect(res.ok).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('maps backend error message', async ()=>{
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ code:'ERR_INVALID_CREDENTIALS' }), { status:401 }));
  await expect(httpFetch('http://x', { method:'POST', body:{} })).rejects.toThrow(/parolă|password/i);
});
