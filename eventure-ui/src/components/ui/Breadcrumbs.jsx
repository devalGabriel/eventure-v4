'use client';
import { Breadcrumbs as MUIBreadcrumbs, Link as MUILink, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

function labelFor(seg) {
  if (!seg) return '';
  try {
    return decodeURIComponent(seg).replace(/-/g, ' ');
  } catch {
    return seg.replace(/-/g, ' ');
  }
}

export default function Breadcrumbs({ sx }) {
  const pathname = usePathname() || '/';
  const locale = useLocale() || 'ro';
  const parts = pathname.split('/').filter(Boolean).slice(1); // scoate [locale]

  return (
    <MUIBreadcrumbs aria-label="breadcrumbs" sx={sx}>
      <MUILink component={Link} href={`/${locale}`} underline="hover" color="inherit">
        Acasă
      </MUILink>
      {parts.map((seg, idx) => {
        const href = `/${locale}/${parts.slice(0, idx + 1).join('/')}`;
        const isLast = idx === parts.length - 1;
        const lbl = labelFor(seg);
        if (isLast) {
          return (
            <Typography
              key={href}
              color="primary"
              fontWeight={600}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                '&::after': {
                  content: '""',
                  display: 'block',
                  width: 4, height: 4, borderRadius: '50%',
                  bgcolor: 'primary.main', ml: 0.8,
                },
              }}
            >
              {lbl}
            </Typography>
          );
        }
        return (
          <MUILink key={href} component={Link} href={href} underline="hover" color="inherit">
            {lbl}
          </MUILink>
        );
      })}
    </MUIBreadcrumbs>
  );
}
