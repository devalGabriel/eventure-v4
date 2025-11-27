// src/components/provider/ProviderProfileForm.jsx
'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Paper,
  Typography,
  Button,
  MenuItem,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Alert
} from '@mui/material';
import {
  getMyProviderProfile,
  updateMyProviderProfile,
  getProviderCatalog
} from '@/lib/api/providersClient';
const statusLabels = {
  INCOMPLETE: 'INCOMPLET',
  PENDING_REVIEW: 'În așteptare revizuire',
  ACTIVE: 'ACTIV',
  SUSPENDED: 'SUSPENDAT',
  DELISTED: 'DELISTAT',
};
export default function ProviderProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [status, setStatus] = useState('INCOMPLETE');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, c] = await Promise.all([
          getMyProviderProfile(),
          getProviderCatalog()
        ]);
        if (!mounted) return;
        setProfile(p);
        setCatalog(c);
                setStatus(p.status || 'INCOMPLETE');

        setSubcategoryIds(
          (p.categories || []).map((c) => c.subcategoryId)
        );
        setTagIds(
          (p.tags || []).map((t) => t.tagId)
        );
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Eroare la încărcare profil');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleChangeField = (field) => (e) => {
    setProfile((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        displayName: profile.displayName,
        legalName: profile.legalName,
        taxId: profile.taxId,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        country: profile.country,
        city: profile.city,
        address: profile.address,
        description: profile.description,
        subcategoryIds,
        tagIds
      };
      const updated = await updateMyProviderProfile(payload);
      setProfile(updated);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };
const statusColor =
    status === 'ACTIVE'
      ? 'success'
      : status === 'PENDING_REVIEW'
        ? 'warning'
        : status === 'SUSPENDED' || status === 'DELISTED'
          ? 'error'
          : 'info';

  const statusLabelMap = {
    INCOMPLETE: 'Incomplet',
    PENDING_REVIEW: 'În așteptare review',
    ACTIVE: 'Activ',
    SUSPENDED: 'Suspendat',
    DELISTED: 'Delistat'
  };

  if (loading) {
    return <Typography>Se încarcă profilul...</Typography>;
  }

  if (!profile) {
    return <Typography>Eroare: profilul nu a putut fi încărcat.</Typography>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Profil Business
        </Typography>
        <Alert
            severity={statusColor}
            variant="outlined"
            sx={{ py: 0.5, px: 1.5, display: 'inline-flex', alignItems: 'center' }}
          >
            {statusLabels[status] || status}
          </Alert>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          Profil salvat cu succes.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <TextField
            label="Nume afișat"
            fullWidth
            margin="normal"
            value={profile.displayName || ''}
            onChange={handleChangeField('displayName')}
          />
          <TextField
            label="Denumire legală"
            fullWidth
            margin="normal"
            value={profile.legalName || ''}
            onChange={handleChangeField('legalName')}
          />
          <TextField
            label="CUI / CIF"
            fullWidth
            margin="normal"
            value={profile.taxId || ''}
            onChange={handleChangeField('taxId')}
          />
          <TextField
            label="Website"
            fullWidth
            margin="normal"
            value={profile.website || ''}
            onChange={handleChangeField('website')}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={profile.email || ''}
            onChange={handleChangeField('email')}
          />
          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={profile.phone || ''}
            onChange={handleChangeField('phone')}
          />
          <TextField
            label="Țara"
            fullWidth
            margin="normal"
            value={profile.country || ''}
            onChange={handleChangeField('country')}
          />
          <TextField
            label="Oraș"
            fullWidth
            margin="normal"
            value={profile.city || ''}
            onChange={handleChangeField('city')}
          />
          <TextField
            label="Adresă"
            fullWidth
            margin="normal"
            value={profile.address || ''}
            onChange={handleChangeField('address')}
          />
        </Grid>

        <Grid xs={12}>
          <TextField
            label="Descriere"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={profile.description || ''}
            onChange={handleChangeField('description')}
          />
        </Grid>

        {/* Categorii / subcategorii & tag-uri */}
        <Grid xs={12} md={6} minWidth={"200px"}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="subcategories-label">Subcategorii</InputLabel>
            <Select
              labelId="subcategories-label"
              multiple
              value={subcategoryIds}
              onChange={(e) => setSubcategoryIds(e.target.value)}
              input={<OutlinedInput label="Subcategorii" />}
              renderValue={(selected) => {
                const labels = [];
                catalog.forEach((cat) => {
                  cat.subcategories.forEach((sub) => {
                    if (selected.includes(sub.id)) {
                      labels.push(`${cat.name} / ${sub.name}`);
                    }
                  });
                });
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {labels.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                );
              }}
            >
              {catalog.map((cat) => (
                cat.subcategories.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {cat.name} / {sub.name}
                  </MenuItem>
                ))
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} md={6} minWidth={"200px"}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="tags-label">Tag-uri</InputLabel>
            <Select
              labelId="tags-label"
              multiple
              value={tagIds}
              onChange={(e) => setTagIds(e.target.value)}
              input={<OutlinedInput label="Tag-uri" />}
              renderValue={(selected) => {
                const labels = [];
                catalog.forEach((cat) => {
                  cat.subcategories.forEach((sub) => {
                    sub.tags.forEach((tag) => {
                      if (selected.includes(tag.id)) {
                        labels.push(`${sub.name} / ${tag.label}`);
                      }
                    });
                  });
                });
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {labels.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                );
              }}
            >
              {catalog.flatMap((cat) =>
                cat.subcategories.flatMap((sub) =>
                  sub.tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      {cat.name} / {sub.name} / {tag.label}
                    </MenuItem>
                  ))
                )
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Se salvează...' : 'Salvează profilul'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
