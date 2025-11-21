// src/app/[locale]/(protected)/dashboard/provider/profile/page.jsx
'use client';

import { Box, Typography } from '@mui/material';
import ProviderProfileForm from '@/components/provider/ProviderProfileForm';

export default function ProviderProfilePage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Profil Business
      </Typography>
      <ProviderProfileForm />
    </Box>
  );
}
