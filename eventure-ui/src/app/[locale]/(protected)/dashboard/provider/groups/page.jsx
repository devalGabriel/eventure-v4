'use client';

import ProviderGroupsSection from '@/components/provider/ProviderGroupsSection';
import { Box, Typography } from '@mui/material';

export default function ProviderServicesPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Servicii & Pachete
      </Typography>
      <ProviderGroupsSection />
    </Box>
  );
}
