// src/app/[locale]/(public)/page.jsx  (SERVER COMPONENT)
import {Typography, Stack, Button, Paper} from '@mui/material';
import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import '@/styles/landing.scss';

// Evităm stabilizarea pe un singur locale în dev
export const dynamic = 'force-dynamic';
// (sau: export const revalidate = 0;)

export default async function Landing(props) {
  const { locale } = await props.params;       // ✅ ia locale-ul din rută
  const t = await getTranslations({ locale });  // ✅ cere traducerile fix pt. acest locale
  
  return (
    <Stack spacing={6}>
      <section className="landing-hero">
        <Typography variant="h1">{t('landing.hero.title')}</Typography>
        <Typography variant="body1">{t('landing.hero.subtitle')}</Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{mt:2}}>
          <Link href={`/${locale}/register`} prefetch>
            <Button variant="contained" size="large">
              {t('nav.register')}
            </Button>
          </Link>
          <Link href={`/${locale}/login`} prefetch>
            <Button size="large">
              {t('nav.login')}
            </Button>
          </Link>
        </Stack>
      </section>

      {/* restul conținutului rămâne la fel */}
      <section>
        <Typography variant="h5" sx={{mb:2, fontWeight:800, textAlign:'center'}}>Cum funcționează</Typography>
        <div className="landing-steps">
          <div className="landing-step">
            <Typography variant="h6">1. Creezi evenimentul</Typography>
            <Typography color="text.secondary">Definești tipul, data, bugetul, locația dorită.</Typography>
          </div>
          <div className="landing-step">
            <Typography variant="h6">2. Primești sugestii</Typography>
            <Typography color="text.secondary">AI și marketplace-ul propun furnizori și taskuri.</Typography>
          </div>
          <div className="landing-step">
            <Typography variant="h6">3. Contractezi</Typography>
            <Typography color="text.secondary">Gestionare contracte, plăți și documente în aplicație.</Typography>
          </div>
        </div>
      </section>
    </Stack>
  );
}
