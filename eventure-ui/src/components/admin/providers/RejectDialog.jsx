// eventure-ui/src/components/admin/providers/RejectDialog.jsx
'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, RadioGroup, FormControlLabel,
  Radio, TextField, Stack, Typography
} from '@mui/material';
import { PROVIDER_REJECT_REASONS } from '@/config/providerReasons';
import { httpFetch } from '@/lib/api';

export default function RejectDialog({ open, onClose, application, locale = 'ro', onDone }) {
  const [reasonCode, setReasonCode] = useState('PROFILE_INCOMPLETE');
  const [reasonText, setReasonText]   = useState('');
  const [loading, setLoading]         = useState(false);

const handleSubmit = async () => { 
  if (!application?.id) return;
  if (reasonCode === 'OTHER' && !reasonText.trim()) {
    alert('Te rog completează motivul.');
    return;
  }
  setLoading(true);
  try {
    await httpFetch(
      `/api/admin/provider-applications/${application.id}/decision`,
      {
        method: 'PATCH',
        // 🔑 trimitem obiect, nu string – httpFetch se ocupă de JSON.stringify
        body: {
          status: 'REJECTED',              // clar, uppercase
          reasonCode,
          reasonText: reasonText.trim() || null,
        },
        locale,
      }
    );
    onDone?.();      // refresh listă / refetch
    onClose?.();
  } catch (e) {
    console.error(e);
    alert('Eroare la salvarea deciziei.');
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Respinge aplicația de provider</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="subtitle2">
            Pentru transparență, utilizatorul va vedea motivul refuzului.
          </Typography>

          <FormControl>
            <RadioGroup
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
            >
              {PROVIDER_REJECT_REASONS.map((r) => (
                <FormControlLabel
                  key={r.code}
                  value={r.code}
                  control={<Radio />}
                  label={r.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <TextField
            label="Detalii (opțional, obligatoriu la 'Alt motiv')"
            multiline
            minRows={3}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Anulează</Button>
        <Button color="error" onClick={handleSubmit} disabled={loading}>
          Confirmă refuzul
        </Button>
      </DialogActions>
    </Dialog>
  );
}
