'use client';
import { Box, Skeleton, Stack } from '@mui/material';

export default function FormSkeleton({ fields = 4 }) {
  return (
    <Box>
      <Skeleton variant="text" width={280} height={32} sx={{ mb: 2 }} />
      <Stack spacing={2}>
        {[...Array(fields)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
        ))}
        <Skeleton variant="rectangular" height={40} width={160} sx={{ borderRadius: 2 }} />
      </Stack>
    </Box>
  );
}
