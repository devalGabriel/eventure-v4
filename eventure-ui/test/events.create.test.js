import { createEvent } from '@/lib/events';
global.fetch = jest.fn();

test('POST payload', async () => {
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: '1' }), { status:200 }));
  const payload = { title:'Test', date:new Date().toISOString(), type:'wedding', budget:1000, currency:'RON' };
  await createEvent(payload);
  const args = fetch.mock.calls[0][1];
  expect(args.method).toBe('POST');
  expect(JSON.parse(args.body).title).toBe('Test');
});
