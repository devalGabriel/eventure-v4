// eventure-ui/src/components/ui/NotificationsBell.jsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Box,
  Typography,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationItem from '../notifications/NotificationItem';

const MAX_VISIBLE = 10;

export default function NotificationsBell({ userId }) {
  const [items, setItems] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const unread = useMemo(
    () => items.filter((i) => !i.readAt && !i.read).length,
    [items]
  );

  const visibleItems = useMemo(
    () => (showAll ? items : items.slice(0, MAX_VISIBLE)),
    [items, showAll]
  );

  // 1) încărcare inițială
  useEffect(() => {
    fetch('/api/notifications/history', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setItems(list))
      .catch(() => {});
  }, []);

  // 2) polling periodic – „live fără refresh”
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function fetchLatest() {
      try {
        const r = await fetch('/api/notifications/history', { cache: 'no-store' });
        if (!r.ok) return;
        const list = await r.json();
        if (cancelled) return;

        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          const merged = [
            ...list.filter((n) => !seen.has(n.id)),
            ...prev,
          ];
          return merged
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            )
            .slice(0, 50);
        });
      } catch {
        // ignorăm erori de rețea ocazionale
      }
    }

    fetchLatest();
    const id = setInterval(fetchLatest, 8000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });

      setItems((prev) =>
        prev.map((i) => ({
          ...i,
          read: true,
          readAt: i.readAt || new Date().toISOString(),
        }))
      );
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const handleItemMarked = (id) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, read: true, readAt: i.readAt || new Date().toISOString() }
          : i
      )
    );
  };

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    setShowAll(false); // resetăm la 10 la fiecare deschidere
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const hasMore = items.length > MAX_VISIBLE;

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label="Notifications"
        size="small"
      >
        <Badge badgeContent={unread} color="primary">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: '90vw',
            maxHeight: 440,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
              Notificări
            </Typography>
            {unread > 0 && (
              <Button size="small" onClick={markAllRead}>
                Marchează toate ca citite
              </Button>
            )}
          </Stack>
        </Box>
        <Divider />

        <Box
          sx={{
            py: 0.5,
            px: 0,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {visibleItems.length === 0 && (
            <MenuItem disabled>
              <ListItemText primary="Nu ai notificări." />
            </MenuItem>
          )}

          {visibleItems.map((n, idx) => (
            <Box key={n.id}>
              <NotificationItem notification={n} onMarkedRead={handleItemMarked} handleClose={handleClose}/>
              {idx < visibleItems.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </Box>

        {hasMore && !showAll && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Button
                size="small"
                fullWidth
                variant="text"
                onClick={() => setShowAll(true)}
              >
                Vezi mai multe ({items.length - MAX_VISIBLE} în plus)
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
