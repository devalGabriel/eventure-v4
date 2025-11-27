// eventure-ui/src/components/notifications/NotificationItem.jsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import {
  MenuItem,
  Box,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import { notificationTarget } from '@/lib/notificationRoutes';
import { markNotificationRead } from '@/lib/notificationsApi';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

export default function NotificationItem({ notification, onMarkedRead, handleClose }) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ro';

  const isRead = !!(notification.read || notification.readAt);

  const handleClick = async () => {
    const target = notificationTarget(notification, locale);
    console.log("notification: ", notification)
    if (!isRead) {
      try {
        await markNotificationRead(notification.id);
        onMarkedRead?.(notification.id);
      } catch (e) {
        console.error('Failed to mark as read', e);
      }
    }

    if (target) {
      router.push(target);
      handleClose()
    }
  };

  return (
    <MenuItem
      onClick={handleClick}
      sx={{
        alignItems: 'flex-start',
        whiteSpace: 'normal',
        bgcolor: isRead ? 'inherit' : 'action.hover',
        py: 1,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        {!isRead && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              mt: 0.8,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            spacing={1}
          >
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: isRead ? 500 : 700 }}
            >
              {notification.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, flexShrink: 0 }}
            >
              {formatDate(notification.createdAt)}
            </Typography>
          </Stack>
          {notification.message && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {notification.message}
            </Typography>
          )}
          {notification.type && (
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={notification.type}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}
              />
            </Box>
          )}
        </Box>
      </Stack>
    </MenuItem>
  );
}
