'use client';
import { Box, Skeleton } from '@mui/material';

export default function ListSkeleton({ rows = 6 }) {
  return (
    <Box>
      <Skeleton variant="text" width={220} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 1 }} />
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2, mb: 1 }} />
      ))}
    </Box>
  );
}
