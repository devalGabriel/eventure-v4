// src/app/[locale]/(protected)/admin/providers/page.jsx
'use client';

import { Box, Typography, Stack, Button } from '@mui/material';
import AdminProvidersList from '@/components/admin/providers/AdminProvidersList';
import { extractLocaleAndPath } from '@/lib/extractLocaleAndPath';
import { usePathname } from 'next/navigation';

export default function AdminProvidersPage() {
  const pathname = usePathname()
  const {locale, path} = extractLocaleAndPath(pathname)
  console.log("locale: ", locale)
  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Gestionare provideri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vizualizează, filtrează și gestionează profilurile furnizorilor activi
            din platformă.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            href={`/${locale}/admin/providers/applications`}
          >
            {/* Din /[locale]/admin/providers mergem în /[locale]/admin/providers/applications */}
            Aplicații furnizor
          </Button>
          <Button
            variant="outlined"
            size="small"
            href={`/${locale}/dashboard/admin/providers/catalog`}
          >
            Catalog servicii
          </Button>
        </Stack>
      </Stack>

      <AdminProvidersList />
    </Box>
  );
}
