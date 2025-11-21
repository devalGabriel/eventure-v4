// src/i18n/request.js
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Uneori, pentru rute statice (ex: favicon), locale poate fi undefined sau chiar 'favicon.ico'
  const loc = !locale || locale === 'favicon.ico' ? 'ro' : locale;
  const messages = (await import(`./messages/${loc}.json`)).default;
  return { locale: loc, messages };
});
