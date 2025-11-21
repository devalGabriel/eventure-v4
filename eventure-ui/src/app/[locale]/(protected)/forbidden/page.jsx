import { Typography, Stack, Button } from '@mui/material';
import Link from 'next/link';

export default function ForbiddenPage({ params }) {
  const locale = params.locale || 'ro';
  return (
    <Stack spacing={2} sx={{ py: 10, textAlign:'center', alignItems:'center' }}>
      <Typography variant="h3">403</Typography>
      <Typography color="text.secondary">Access denied</Typography>
      <Button component={Link} href={`/${locale}/(protected)/dashboard`} variant="contained">
        Înapoi la dashboard
      </Button>
    </Stack>
  );
}
