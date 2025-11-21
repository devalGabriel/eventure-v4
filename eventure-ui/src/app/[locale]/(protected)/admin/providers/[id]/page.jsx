// src/app/[locale]/(protected)/dashboard/admin/providers/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import AdminProviderDetail from '@/components/admin/providers/AdminProviderDetail';

export default function AdminProviderDetailPage() {
  const params = useParams();
  const { id } = params;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Detaliu provider
      </Typography>
      <AdminProviderDetail providerId={Number(id)} />
    </Box>
  );
}
