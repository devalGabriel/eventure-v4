'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { extractLocaleAndPath } from '@/lib/extractLocaleAndPath';

const TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'baptism', label: 'Baptism' },
  { value: 'corporate', label: 'Corporate' },
];

const CURRENCIES = [
  { value: 'RON', label: 'RON (lei)' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

export default function NewEventPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = extractLocaleAndPath(pathname);
  const eventsBasePath = `/${locale}/events`;

  const [form, setForm] = useState({
    name: '',
    type: 'wedding',
    date: '',
    location: '',
    notes: '',
    budgetPlanned: '',
    currency: 'RON',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit() {
    setErr('');
    if (!form.name?.trim()) {
      setErr('Numele este obligatoriu');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        date: form.date ? new Date(form.date).toISOString() : null,
        location: form.location || null,
        notes: form.notes || null,
        currency: form.currency || 'RON',
        budgetPlanned: form.budgetPlanned
          ? Number(form.budgetPlanned)
          : null,
      };

      const r = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error('create_failed');
      const e = await r.json();
      router.replace(`${eventsBasePath}/${e.id}`);
    } catch (e) {
      console.error(e);
      setErr('Nu s-a putut crea evenimentul.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack sx={{ p: 2 }} spacing={2}>
      <Typography variant="h5">Eveniment nou</Typography>
      <Card>
        <CardContent>
          <Stack spacing={2} maxWidth={500}>
            <TextField
              label="Nume"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />

            <TextField
              select
              label="Tip"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
            >
              {TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="datetime-local"
              label="Data & ora"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Locație"
              value={form.location}
              onChange={(e) =>
                setField('location', e.target.value)
              }
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Buget estimat"
                type="number"
                value={form.budgetPlanned}
                onChange={(e) =>
                  setField('budgetPlanned', e.target.value)
                }
              />
              <TextField
                select
                label="Monedă"
                value={form.currency}
                onChange={(e) =>
                  setField('currency', e.target.value)
                }
                sx={{ minWidth: 120 }}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Notițe"
              multiline
              minRows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />

            {err && <Box sx={{ color: 'error.main' }}>{err}</Box>}

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={submit}
                disabled={loading}
              >
                Salvează
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={loading}
              >
                Renunță
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
