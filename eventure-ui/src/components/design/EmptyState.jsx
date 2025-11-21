// src/components/design/EmptyState.jsx
'use client';
import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({title, description, action, onAction}) {
  return (
    <Box sx={{ textAlign:'center', border:'1px dashed rgba(0,0,0,.15)', borderRadius: 2, p: 6, background:'#fafafa' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>{title}</Typography>
      {description && <Typography sx={{ color:'#6b7280', mb: 2 }}>{description}</Typography>}
      {action && <Button variant="contained" onClick={onAction}>{action}</Button>}
    </Box>
  );
}
