// src/app/[locale]/(protected)/dashboard/page.jsx
import { Typography, Button } from '@mui/material';
import PageHeader from '@/components/design/PageHeader';
import Section from '@/components/design/Section';
import Card from '@/components/design/Card';
import EmptyState from '@/components/design/EmptyState';
import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import ProviderStatsCard from '@/components/admin/cards/ProviderStatsCard';
import '@/styles/design.scss';

import EventsStatsCard from '@/components/admin/cards/EventsStatsCard';
import ClientEventsWidget from '@/components/dashboard/ClientEventsWidget';
import ProviderQuickActions from '@/components/dashboard/ProviderQuickActions';
import AdminKpiCard from '@/components/dashboard/AdminKpiCard';
import { getRoleServer } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const t = await getTranslations();
  const showAI = getFlag('AI_SUGGESTIONS');
  const role = await getRoleServer();

  const isAdmin = role === 'admin';
  const isClient = role === 'client';
  const isProvider = role === 'provider';
  const isClientLike = isClient || isProvider;

  const bc = [
    { label: 'Home', href: '../' },
    { label: t('dashboard.title') }
  ];

  const headerRight = isAdmin
    ? <Button href="admin/events" variant="contained">Manage events</Button>
    : (
      <Button href="events/new" variant="contained">
        New event
      </Button>
    );

  return (
    <>
      <PageHeader items={bc} title={t('dashboard.title')} right={headerRight} />

      <Section title="Overview" subtitle="Key metrics & recent activity">
        <div className="section-grid">
          {/* ADMIN */}
          {isAdmin && (
            <>
              <Card className="card-span-4">
                <Typography component="div">
                  <AdminKpiCard />
                </Typography>
              </Card>
              <Card className="card-span-4">
                <Typography component="div">
                  <EventsStatsCard />
                </Typography>
              </Card>
              <Card className="card-span-4">
                <Typography component="div">
                  <ProviderStatsCard/>
                </Typography>
              </Card>
            </>
          )}

          {/* CLIENT + PROVIDER (ca și client) */}
          {isClientLike && (
            <>
              <Card className="card-span-4">
                <Typography component="div">
                  <ClientEventsWidget />
                </Typography>
              </Card>
              <Card className="card-span-4">
                <Typography variant="body1" color="text.secondary">
                  Buget (soon) — integrare modul buget/cheltuieli.
                </Typography>
              </Card>
              <Card className="card-span-4">
                <Typography variant="body1" color="text.secondary">
                  Timeline (soon) — următoarele taskuri cu deadline.
                </Typography>
              </Card>
            </>
          )}

          {/* PROVIDER – extra carduri specifice */}
          {isProvider && (
            <>
              <Card className="card-span-4">
                <Typography component="div">
                  <ProviderQuickActions />
                </Typography>
              </Card>

              <Card className="card-span-4">
                <Typography variant="h6" gutterBottom>
                  Profil & configurări provider
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Actualizează-ți profilul business, serviciile și disponibilitatea
                  pentru a apărea corect în căutări și oferte.
                </Typography>
                <Button href="provider" variant="outlined" size="small">
                  Deschide zona de provider
                </Button>
              </Card>

              <Card className="card-span-4">
                <Typography variant="h6" gutterBottom>
                  Activitate furnizor (soon)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aici vei vedea pe scurt câte oferte ai trimis, acceptate,
                  evenimente în lucru și review-uri primite.
                </Typography>
              </Card>
            </>
          )}

          {showAI && (
            <Card className="card-span-12">
              <Typography variant="body1" color="text.secondary">
                AI Suggestions (enable component when ready)
              </Typography>
            </Card>
          )}

          {isClientLike && (
            <Card className="card-span-12">
              <EmptyState
                title="No events yet"
                description="Start by creating your first event."
                action="Create event"
              />
            </Card>
          )}
        </div>
      </Section>
    </>
  );
}
