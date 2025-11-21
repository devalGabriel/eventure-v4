'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { signOut } from '@/lib/auth';
import NotificationsBell from './NotificationsBell';
import SettingsMenu from './SettingsMenu';

const API_USERS = (process.env.NEXT_PUBLIC_USERS_URL || 'http://localhost:4102').replace(/\/$/, '');

function toAbsoluteUrl(u) {
  if (!u) return '';
  return u.startsWith('/uploads/') ? `${API_USERS}${u}` : u;
}

export default function AppHeader({
  title = 'Eventure',
  locale: localeProp,
  authed = false,
  user,                 // { name, email, avatarUrl, roles[] }
  onToggleSidebar,      // mobil drawer
  right,                // 🔹 topbar contextual (acțiuni pagină)
}) {
  const l = useLocale();
  const locale = localeProp || l;

  const [anchorEl, setAnchorEl] = useState(null);
  const avatarUrl = useMemo(() => toAbsoluteUrl(user?.avatarUrl), [user?.avatarUrl]);
  const firstName = useMemo(() => (user?.name || user?.email || 'Utilizator').split(' ')[0], [user]);

  useEffect(() => {
    if (!authed) return;
    window.__evt_roles = Array.isArray(user?.roles) ? user.roles : [];
    window.dispatchEvent(new CustomEvent('evt:roles-set'));
  }, [authed, user?.roles]);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid rgba(0,0,0,.06)' }}>
      <Toolbar sx={{ gap: 1 }}>
        {authed && (
          <IconButton onClick={onToggleSidebar} sx={{ display: { md: 'none' } }} size="small" aria-label="Menu">
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          component={Link}
          href={`/${locale}`}
          variant="h6"
          sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit' }}
        >
          {title}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* 🔹 slot pentru acțiuni specifice paginii curente */}
        {right}

        {authed && (
          <>
            <h5>Bine ai venit, {firstName}!</h5>
            <NotificationsBell userId={user?.id} />

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account" size="small">
              <Avatar src={avatarUrl || undefined} sx={{ width: 30, height: 30 }}>
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); window.location.href = `/${locale}/profile`; }}>
                Profil
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); signOut(locale); }}>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}

        {/* 🔸 ultimul element din bar: SettingsMenu (theme + language) */}
        <SettingsMenu />
      </Toolbar>
    </AppBar>
  );
}
