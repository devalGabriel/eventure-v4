// src/components/shared/MessagesThread.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { markNotificationsReadContext } from '@/lib/api/eventsClient';

// helper: ia userul curent din auth-service
async function fetchCurrentUser() {
  try {
    const base = (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001').replace(/\/$/, '');
    const res = await fetch(`${base}/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const me = await res.json();
    return {
      id: me?.id ?? me?.user?.id ?? null,
      name: me?.name ?? me?.fullName ?? me?.user?.name ?? 'Tu',
    };
  } catch {
    return null;
  }
}

export default function MessagesThread({
  context = {},        // { eventId, offerId }
  fetchMessages,       // async () => []
  sendMessage,         // async (body) => {}
  title = 'Mesaje',
  autoMarkRead = true,
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);
  const bottomRef = useRef(null);

  // încarcă userul curent o singură dată
  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((u) => {
      if (mounted) setMe(u);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // --- încarcă mesaje ---
  async function load() {
    setLoading(true);
    try {
      const list = await fetchMessages();
      setRows(Array.isArray(list) ? list : []);
      if (autoMarkRead && context && (context.eventId || context.offerId)) {
        await markNotificationsReadContext(context);
      }
    } catch (e) {
      console.error(e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.eventId, context?.offerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows]);

  async function handleSend() {
    if (!body.trim()) return;
    try {
      await sendMessage(body.trim());
      setBody('');
      await load();
    } catch (e) {
      alert(`Eroare la trimitere: ${e.message}`);
    }
  }

  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto', mb: 2, px: 0.5 }}>
        {rows.map((m) => {
          const currentId = me?.id != null ? String(me.id) : null;
          const msgAuthorId = m.authorId != null ? String(m.authorId) : null;
          const isMine = currentId && msgAuthorId && currentId === msgAuthorId;

          return (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  bgcolor: isMine ? 'primary.main' : 'background.paper',
                  color: isMine ? 'primary.contrastText' : 'text.primary',
                  p: 1.2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isMine ? 'primary.dark' : 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 0.3,
                    fontWeight: 600,
                    opacity: 0.9,
                  }}
                >
                  {isMine ? 'Tu' : 'Celălalt'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {m.body}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.3,
                    textAlign: 'right',
                    opacity: 0.8,
                  }}
                >
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                </Typography>
              </Box>
            </Box>
          );
        })}
        {!rows.length && !loading && (
          <Typography variant="body2" color="text.secondary">
            Niciun mesaj încă.
          </Typography>
        )}
        <div ref={bottomRef} />
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Scrie un mesaj..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={handleSend}>
          Trimite
        </Button>
      </Stack>
    </Box>
  );
}
