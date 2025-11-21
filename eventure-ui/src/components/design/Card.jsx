// src/components/design/Card.jsx
'use client';
import { Paper } from '@mui/material';

export default function Card({children, sx, ...rest}) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,.06)', borderRadius: 2, ...sx }} {...rest}>
      {children}
    </Paper>
  );
}
