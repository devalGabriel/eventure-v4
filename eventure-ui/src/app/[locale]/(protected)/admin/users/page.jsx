// src/app/[locale]/(protected)/admin/users/page.jsx
'use client';

import { Box, Typography } from '@mui/material';
import AdminUsersList from '@/components/admin/users/AdminUsersList';

export default function AdminUsersPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestionare utilizatori
      </Typography>
      <AdminUsersList />
    </Box>
  );
}
