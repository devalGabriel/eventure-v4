// src/app/[locale]/(protected)/dashboard/provider/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';

import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';

import Card from '@/components/design/Card';

export default function ProviderOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ro';

  const base = `/${locale}/dashboard/provider`;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- fetch profil provider self ---
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔴 IMPORTANT: API-urile sunt fără /{locale} în față
        const res = await fetch(`/api/providers/me/profile`, {
          method: 'GET',
          credentials: 'include',
        });

        const contentType = res.headers.get('content-type') || '';

        if (!res.ok) {
          const text = await res.text();
          console.error('Error loading provider profile:', res.status, text);
          throw new Error('Nu s-a putut încărca profilul provider.');
        }

        let data;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch {
            console.error('Unexpected non-JSON response for profile:', text);
            throw new Error('Răspuns invalid de la serverul de provideri.');
          }
        }

        if (alive) setProfile(data);
      } catch (err) {
        console.error(err);
        if (alive) setError(err.message || 'Eroare la încărcarea profilului provider.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // --- derivăm statistici & progres din profil ---
  const stats = useMemo(() => {
    if (!profile) {
      return {
        offersCount: 0,
        packagesCount: 0,
        availabilityCount: 0,
        groupsCount: 0,
        completeness: 0,
        completedSteps: 0,
        totalSteps: 4,
      };
    }

    const offersCount =
      profile._count?.offers ??
      (Array.isArray(profile.offers) ? profile.offers.length : 0);

    const packagesCount =
      profile._count?.packages ??
      (Array.isArray(profile.packages) ? profile.packages.length : 0);

    const availabilityCount = Array.isArray(profile.availability)
      ? profile.availability.length
      : 0;

    const groupsCount = Array.isArray(profile.groups)
      ? profile.groups.length
      : 0;

    const steps = {
      profileCore: Boolean(profile.displayName && profile.city && profile.description),
      services: offersCount > 0,
      packages: packagesCount > 0,
      availability: availabilityCount > 0,
    };

    const allSteps = Object.values(steps);
    const completedSteps = allSteps.filter(Boolean).length;
    const totalSteps = allSteps.length;
    const completeness = Math.round((completedSteps / totalSteps) * 100);

    return {
      offersCount,
      packagesCount,
      availabilityCount,
      groupsCount,
      completeness: Number.isFinite(completeness) ? completeness : 0,
      completedSteps,
      totalSteps,
    };
  }, [profile]);

  const status = profile?.status || 'INCOMPLETE';

  const goTo = (sub) => () => {
    router.push(sub ? `${base}/${sub}` : base);
  };

  const cards = [
    {
      icon: <BusinessCenterIcon />,
      title: 'Profil business',
      description:
        'Date legale, descriere, locație și domenii de activitate pentru listare corectă în marketplace.',
      extra: profile
        ? `${profile.displayName || 'Profil fără nume afișat'} • ${profile.city || 'Oraș necunoscut'}`
        : 'Încarc profilul...',
      action: 'Editează profilul',
      onClick: goTo('profile'),
    },
    {
      icon: <DesignServicesIcon />,
      title: 'Servicii & pachete',
      description:
        'Servicii individuale (DJ, formație, cabină foto etc.) combinate în pachete gata de ofertat.',
      extra: `${stats.offersCount} servicii • ${stats.packagesCount} pachete`,
      action:
        stats.offersCount === 0 && stats.packagesCount === 0
          ? 'Adaugă primul serviciu'
          : 'Gestionează servicii',
      onClick: goTo('services'),
    },
    {
      icon: <CalendarMonthIcon />,
      title: 'Disponibilitate',
      description:
        'Blocaje de zile/intervale și sincronizare ulterioară cu evenimentele confirmate.',
      extra:
        stats.availabilityCount === 0
          ? 'Nicio perioadă configurată'
          : `${stats.availabilityCount} intervale definite`,
      action: 'Configurează calendarul',
      onClick: goTo('availability'),
    },
    {
      icon: <GroupIcon />,
      title: 'Grupuri & echipe',
      description:
        'Formații sau echipe mixte, cu împărțirea veniturilor între membri în pașii următori.',
      extra:
        stats.groupsCount === 0
          ? 'Niciun grup creat'
          : `${stats.groupsCount} grupuri definite`,
      action:
        stats.groupsCount === 0 ? 'Creează primul grup' : 'Gestionează grupurile',
      onClick: goTo('groups'),
    },
  ];

  const statusColor = (() => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_REVIEW':
        return 'warning';
      case 'SUSPENDED':
      case 'DELISTED':
        return 'error';
      default:
        return 'default';
    }
  })();

  return (
    <Box>
      {/* STATUS STRIP */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            Profil provider
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Status profil:
            </Typography>
            <Chip size="small" label={status} color={statusColor} />
          </Stack>

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box sx={{ minWidth: 220 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Completare profil: {stats.completedSteps}/{stats.totalSteps} pași (
            {stats.completeness}%)
          </Typography>
          <LinearProgress variant="determinate" value={stats.completeness} />
        </Box>
      </Box>

      {/* CARDURI PRINCIPALE */}
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} item xs={12} md={6}>
            <Card className="card-span-6">
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {card.description}
                  </Typography>
                  {card.extra && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.extra}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={card.onClick}
                    disabled={loading && !profile}
                  >
                    {card.action}
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
