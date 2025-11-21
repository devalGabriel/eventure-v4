// src/components/design/Section.jsx
'use client';
import { Box, Typography } from '@mui/material';

export default function Section({title, subtitle, actions, children, sx}) {
  return (
    <Box sx={{ mb: 4, ...sx }}>
      {(title || actions) && (
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: 2 }}>
          {title && <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>}
          {actions}
        </Box>
      )}
      {subtitle && <Typography variant="body2" sx={{ color:'#6b7280', mb: 2 }}>{subtitle}</Typography>}
      {children}
    </Box>
  );
}
