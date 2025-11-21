// src/app/[locale]/(protected)/dashboard/provider/availability/page.jsx
'use client';

import { Box, Typography } from '@mui/material';
import ProviderAvailabilitySection from '@/components/provider/ProviderAvailabilitySection';

export default function ProviderAvailabilityPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Disponibilitate
      </Typography>
      <ProviderAvailabilitySection />
    </Box>
  );
}
