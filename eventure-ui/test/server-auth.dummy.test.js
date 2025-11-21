import { getUserRSC } from '@/lib/server-auth';

global.fetch = jest.fn();

test('getUserRSC returns null on 401', async ()=>{
  fetch.mockResolvedValueOnce(new Response('{}', { status:401 }));
  const res = await getUserRSC();
  expect(res).toBeNull();
});
