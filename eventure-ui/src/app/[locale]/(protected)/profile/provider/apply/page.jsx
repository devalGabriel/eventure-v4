// eventure-ui/src/app/[locale]/(protected)/profile/provider/apply/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Divider,
  Chip,
} from '@mui/material';
import { useNotify } from '@/components/providers/NotificationProvider';
import { PROVIDER_REJECT_REASONS } from '@/config/providerReasons';

export default function ProviderApplyPage() {
  const [state, setState] = useState(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  const app = state?.application || null;
  const approved = state?.approved;

  const statusLabel = useMemo(() => {
    if (approved) return 'APROBAT';
    if (!app) return 'FĂRĂ CERERE';
    if (app.status === 'PENDING') return 'ÎN VERIFICARE';
    if (app.status === 'REJECTED') return 'RESPINS';
    return app.status || 'NECUNOSCUT';
  }, [approved, app]);

  const statusColor = useMemo(() => {
    if (approved) return 'success';
    if (!app) return 'default';
    if (app.status === 'PENDING') return 'info';
    if (app.status === 'REJECTED') return 'warning';
    return 'default';
  }, [approved, app]);

  const rejectReasonLabel = useMemo(() => {
    if (!app?.decisionReasonCode) return null;
    const found = PROVIDER_REJECT_REASONS.find(
      (r) => r.code === app.decisionReasonCode
    );
    return found?.label || app.decisionReasonCode;
  }, [app]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/providers/me', { cache: 'no-store' });
      const t = await r.text();
      if (!r.ok) throw new Error(t || 'failed');
      const j = JSON.parse(t);
      setState(j);

      // dacă ultima cerere a fost respinsă, pre-populează nota cu nota anterioară
      if (j?.application?.status === 'REJECTED' && j.application.note) {
        setNote(j.application.note);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/providers/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const data = await r.json().catch(() => ({}));

      if (r.ok && data?.state) {
        setState(data.state);
        notify('Solicitarea a fost trimisă', 'success');
      } else if (r.ok) {
        setState((prev) => ({
          ...(prev || {}),
          application: data,
        }));
        notify('Solicitarea a fost trimisă', 'success');
      } else {
        const msg = data?.error || 'Eroare la trimiterea solicitării';
        setErr(msg);
        notify(msg, 'error');
      }
    } catch (e) {
      const msg = String(e);
      setErr(msg);
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !state) return <LinearProgress />;

  return (
    <Stack spacing={3} sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={0.5}>
        <Typography variant="h5">Devino furnizor</Typography>
        <Typography variant="body2" color="text.secondary">
          Completează cererea pentru a primi acces la panoul de furnizor, servicii
          și gestionarea ofertelor.
        </Typography>
      </Stack>

      {err && <Alert severity="error">{String(err)}</Alert>}

      {/* Card status curent */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={1} flex={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">Status cerere</Typography>
                <Chip size="small" label={statusLabel} color={statusColor} />
              </Stack>

              {approved ? (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Ești aprobat ca furnizor. Poți completa <b>profilul</b> în secțiunea
                  „Profil furnizor”.
                </Alert>
              ) : app?.status === 'PENDING' ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Cererea ta este în curs de verificare de către un administrator.
                </Alert>
              ) : app?.status === 'REJECTED' ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Stack spacing={1}>
                    <Typography>
                      Cererea a fost respinsă. Poți re-aplica după ce corectezi sau
                      completezi informațiile necesare.
                    </Typography>

                    {(rejectReasonLabel || app.decisionReasonText) && (
                      <Box
                        sx={{
                          pl: 2,
                          borderLeft: (theme) => `3px solid ${theme.palette.warning.main}`,
                          bgcolor: 'warning.50',
                          borderRadius: 1,
                          py: 1,
                        }}
                      >
                        {rejectReasonLabel && (
                          <Typography variant="body2">
                            <b>Motiv principal:</b> {rejectReasonLabel}
                          </Typography>
                        )}
                        {app.decisionReasonText && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <b>Detalii:</b> {app.decisionReasonText}
                          </Typography>
                        )}
                        {app.decidedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Respins la: {new Date(app.decidedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Nu ai încă o cerere activă de furnizor.
                </Alert>
              )}

              {app?.createdAt && (
                <Typography variant="caption" color="text.secondary">
                  Ultima cerere trimisă la: {new Date(app.createdAt).toLocaleString()}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Formular de (re)aplicare */}
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1">Trimite / actualizează cererea</Typography>
            <Typography variant="body2" color="text.secondary">
              Poți adăuga câteva detalii despre experiența ta, tipurile de servicii
              oferite sau link-uri către portofoliu (site, social media etc.).
            </Typography>

            <Divider />

            <TextField
              label="Notă pentru administrator (opțional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={3}
              placeholder="Ex: Sunt fotograf cu experiență de 5 ani, am portofoliu online și echipament profesional..."
            />

            <Box>
              <Button
                variant="contained"
                onClick={apply}
                disabled={approved || loading}
              >
                {app?.status === 'REJECTED' ? 'Trimite din nou cererea' : 'Trimite cererea'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
