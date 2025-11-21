import { getFlag } from '@/lib/flags';

process.env.NEXT_PUBLIC_FLAG_ANALYTICS = '1';
test('analytics flag on', ()=>{
  expect(getFlag('ANALYTICS')).toBe(true);
});