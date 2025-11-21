// src/components/provider/ProviderAvailabilitySection.jsx
'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import dayjs from 'dayjs';

import {
  getMyAvailability,
  updateMyAvailability
} from '@/lib/api/providersClient';

const statusOptions = [
  { value: 'AVAILABLE', label: 'Disponibil' },
  { value: 'LIMITED', label: 'Disponibil limitat' },
  { value: 'BOOKED', label: 'Rezervat' }
];

export default function ProviderAvailabilitySection() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'BOOKED',
    note: ''
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const items = await getMyAvailability();
        if (!mounted) return;
        setBlocks(items);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Eroare la încărcare disponibilitate');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addBlock = () => {
    if (!form.dateFrom || !form.dateTo) return;

    const newBlock = {
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      status: form.status,
      note: form.note
    };

    setBlocks((prev) => [...prev, newBlock]);
    setForm({
      dateFrom: '',
      dateTo: '',
      status: 'BOOKED',
      note: ''
    });
  };

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      // convert date strings to ISO
      const payload = blocks.map((b) => ({
        ...b,
        dateFrom: new Date(b.dateFrom).toISOString(),
        dateTo: new Date(b.dateTo).toISOString()
      }));
      const result = await updateMyAvailability(payload);
      setBlocks(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Eroare la salvare disponibilitate');
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <Typography>Se încarcă disponibilitatea...</Typography>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Disponibilitate & Blocări
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <TextField
            label="De la"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.dateFrom}
            onChange={handleChange('dateFrom')}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Până la"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.dateTo}
            onChange={handleChange('dateTo')}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Status"
            fullWidth
            margin="normal"
            value={form.status}
            onChange={handleChange('status')}
          >
            {statusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Notă (opțional)"
            fullWidth
            margin="normal"
            value={form.note}
            onChange={handleChange('note')}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="outlined" onClick={addBlock}>
            Adaugă blocare
          </Button>
        </Grid>
      </Grid>

      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>De la</TableCell>
            <TableCell>Până la</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Notă</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {blocks.map((b, idx) => (
            <TableRow key={idx}>
              <TableCell>{dayjs(b.dateFrom).format('YYYY-MM-DD')}</TableCell>
              <TableCell>{dayjs(b.dateTo).format('YYYY-MM-DD')}</TableCell>
              <TableCell>
                {statusOptions.find((s) => s.value === b.status)?.label || b.status}
              </TableCell>
              <TableCell>{b.note}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => removeBlock(idx)}>
                  Șterge
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {blocks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>Nu există blocări definite.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="contained" onClick={saveAll} disabled={saving}>
          {saving ? 'Se salvează...' : 'Salvează disponibilitatea'}
        </Button>
      </Stack>
    </Paper>
  );
}
