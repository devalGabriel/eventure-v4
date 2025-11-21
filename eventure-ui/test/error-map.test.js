import { mapErrorMessage } from '@/lib/contracts/auth.contract';

test('map invalid credentials (RO)', ()=>{
  expect(mapErrorMessage('ERR_INVALID_CREDENTIALS','ro')).toMatch(/incorecte/i);
});

test('map email exists (EN)', ()=>{
  expect(mapErrorMessage('ERR_EMAIL_EXISTS','en')).toMatch(/already/i);
});

test('map default', ()=>{
  expect(mapErrorMessage('SOMETHING_ELSE','ro')).toMatch(/Eroare|Unexpected/i);
});
