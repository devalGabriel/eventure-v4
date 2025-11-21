import getRequestConfig from '@/i18n/request';

test('loads messages for locale=ro', async () => {
  const conf = await getRequestConfig({ locale: 'ro' });
  expect(conf.locale).toBe('ro');
  expect(conf.messages.app.title).toBeDefined();
});

test('loads messages for locale=en', async () => {
  const conf = await getRequestConfig({ locale: 'en' });
  expect(conf.locale).toBe('en');
  expect(conf.messages.app.title).toBeDefined();
});
