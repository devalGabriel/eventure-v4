// src/app/[locale]/layout.jsx
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import ColorModeProvider from '@/components/providers/ColorModeProvider';
import NotificationProvider from '@/components/providers/NotificationProvider';
import AppShell from '@/components/ui/AppShell';
import './globals.scss';
import {cookies} from 'next/headers';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'; // 👈
const USERS_BASE = (process.env.NEXT_PUBLIC_USERS_URL || 'http://localhost:4102').replace(/\/$/, '');
import { getProfileRSC } from '@/lib/server-auth';
import AppBootstrap from '@/components/providers/AppBootstrap';

export default async function RootLayout(props) {
  const { children } = props;
  const { locale } = await props.params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const cookieStore = await cookies();
  const hasSession = !!(cookieStore.get('evt_session') || cookieStore.get('accessToken'));
  const profile = await getProfileRSC().catch(() => null);
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const avatarUrl = profile?.avatarUrl || '';
  const fullName = profile?.name || '';

  // 🧠 luăm user-ul din USERS /v1/users/me ca să-l afișăm în header
  let initialUser = null;
  if (hasSession) {
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
    try {
      const res = await fetch(`${USERS_BASE}/v1/users/me`, {
        method: 'GET',
        headers: { Accept: 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
        cache: 'no-store',
      });
      if (res.ok) initialUser = await res.json(); // { id,email,name,avatarUrl,roles[] }
    } catch {}
  }

  return (
    <html lang={locale} data-theme="light">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ColorModeProvider>
              <NotificationProvider>
                <AppBootstrap authed={hasSession} />

                <AppShell authed={hasSession} initialUser={initialUser}>{children}</AppShell>
              </NotificationProvider>
            </ColorModeProvider>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );

}

export const revalidate = 0;