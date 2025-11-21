'use client';
import { useEffect, useState } from 'react';
import { Box, Drawer, useMediaQuery } from '@mui/material';
import { useLocale } from 'next-intl';

import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import { ToolbarOffset } from './Toolbar';
import Breadcrumbs from './Breadcrumbs';
import { signOut } from '@/lib/auth';

export default function AppShell({ children, authed, initialUser, topbarRight }) {
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMdUp = useMediaQuery('(min-width:900px)');
  const [user, setUser] = useState(initialUser || null);

  useEffect(() => { setUser(initialUser || null); }, [initialUser]);
  if (!user && authed) {
    // în cazul în care initialUser nu e setat (ex: SSR fără sesiune, apoi login client-side)
    // încercăm să luăm user-ul din window.__evt_profile
    //logout('AppShell trying to get user from window.__evt_profile');
  
      signOut(); // reîncarcă pagina ca să seteze corect tot
      return null;
  }
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader
        authed={authed}
        locale={locale}
        user={user}
        onToggleSidebar={() => setMobileOpen(v => !v)}
        right={topbarRight}  // 🔹 aici injectăm acțiunile paginii
      />
      <ToolbarOffset />

      <Box sx={{ px: { xs: 2, md: 3 }, pt: 1, pb: 1 }}>
        <Breadcrumbs />
      </Box>

      <Box sx={{ display: 'flex', maxWidth: '100%', overflowX: 'hidden' }}>
        {!isMdUp && authed && (
          <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 260 } }}>
            <Sidebar locale={locale} onNavigate={() => setMobileOpen(false)} />
          </Drawer>
        )}

        {isMdUp && authed && <Sidebar locale={locale} />}

        <Box component="main" sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 3 }, pb: 6 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
