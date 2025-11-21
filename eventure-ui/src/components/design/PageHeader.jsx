// src/components/design/PageHeader.jsx
'use client';
import { Box, Breadcrumbs, Link as MLink, Typography } from '@mui/material';
import Link from 'next/link';

export default function PageHeader({items=[], title, right}) {
  return (
    <Box sx={{ mb: 3, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <Box>
        {items.length > 0 && (
          <Breadcrumbs sx={{ mb: 1 }}>
            {items.map((it, i) => it.href ? (
              <MLink key={i} component={Link} href={it.href}>{it.label}</MLink>
            ) : (
              <Typography key={i} color="text.secondary">{it.label}</Typography>
            ))}
          </Breadcrumbs>
        )}
        {title && <Typography variant="h4" sx={{ fontWeight: 800 }}>{title}</Typography>}
      </Box>
      <Box>{right}</Box>
    </Box>
  );
}
