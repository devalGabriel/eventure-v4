"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { adminListProviders } from "@/lib/api/providersClient";

const metricBoxSx = {
  flex: 1,
  minWidth: 0,
  p: 1.5,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.default",
};

export default function AdminKpiCard() {
  // TAB ACTIV
  const [activeTab, setActiveTab] = useState("providers");

  // STATS PROVIDERI (tab Furnizori)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    incomplete: 0,
    watchlisted: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [all, active, pending, suspended, incomplete, watchlisted] =
          await Promise.all([
            adminListProviders({ page: 1, pageSize: 1 }),
            adminListProviders({ status: "ACTIVE", page: 1, pageSize: 1 }),
            adminListProviders({
              status: "PENDING_REVIEW",
              page: 1,
              pageSize: 1,
            }),
            adminListProviders({ status: "SUSPENDED", page: 1, pageSize: 1 }),
            adminListProviders({ status: "INCOMPLETE", page: 1, pageSize: 1 }),
            adminListProviders({
              watchlistOnly: "true",
              page: 1,
              pageSize: 1,
            }),
          ]);

        if (cancelled) return;

        setStats({
          total: all.total ?? 0,
          active: active.total ?? 0,
          pending: pending.total ?? 0,
          suspended: suspended.total ?? 0,
          incomplete: incomplete.total ?? 0,
          watchlisted: watchlisted.total ?? 0,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            e?.message ||
              "Eroare la încărcarea statisticilor pentru provideri."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const percent = (part, total) =>
    total ? Math.round((part / total) * 100) : 0;

  const activePercent = useMemo(
    () => percent(stats.active, stats.total),
    [stats.active, stats.total]
  );
  const pendingPercent = useMemo(
    () => percent(stats.pending, stats.total),
    [stats.pending, stats.total]
  );
  const suspendedPercent = useMemo(
    () => percent(stats.suspended, stats.total),
    [stats.suspended, stats.total]
  );
  const watchlistedPercent = useMemo(
    () => percent(stats.watchlisted, stats.total),
    [stats.watchlisted, stats.total]
  );

  return (
    <Box>
      {/* HEADER + TAB-URI */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 0.8 }}
        >
          Health platformă
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          textColor="secondary"
          indicatorColor="secondary"
          sx={{
            minHeight: 32,
            "& .MuiTab-root": {
              minHeight: 32,
              fontSize: 12,
              px: 1.5,
            },
          }}
        >
          <Tab label="Furnizori" value="providers" />
          <Tab label="Evenimente" value="events" />
          <Tab label="Clienți" value="clients" />
        </Tabs>
      </Stack>

      {loading && activeTab === "providers" && (
        <LinearProgress sx={{ mb: 1.5 }} />
      )}

      {error && activeTab === "providers" && (
        <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
          {error}
        </Typography>
      )}

      {/* TAB 1 – FURNIZORI */}
      {activeTab === "providers" && (
        <Stack spacing={2}>
          {/* total provideri */}
          <Stack spacing={0.5}>
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              provideri înregistrați în platformă
            </Typography>
          </Stack>

          {/* linia 1 KPI */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 0.5 }}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                PROVIDERI ACTIVI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {stats.active}
              </Typography>
              <Typography variant="caption" color="success.main">
                {activePercent}% din total
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                ÎN AȘTEPTARE REVIEW
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {stats.pending}
              </Typography>
              <Typography variant="caption" color="warning.main">
                {pendingPercent}% din total
              </Typography>
            </Box>
          </Stack>

          {/* linia 2 KPI */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                PROVIDERI SUSPENDAȚI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {stats.suspended}
              </Typography>
              <Typography variant="caption" color="error.main">
                {suspendedPercent}% din total
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                WATCHLIST
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {stats.watchlisted}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {watchlistedPercent}% marcați important
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Distribuție rapidă: {activePercent}% activi, {pendingPercent}% în
            review. Folosește watchlist-ul pentru furnizorii strategici.
          </Typography>
        </Stack>
      )}

      {/* TAB 2 – EVENIMENTE (layout pregătit, de legat la API ulterior) */}
      {activeTab === "events" && (
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h4">0</Typography>
            <Typography variant="body2" color="text.secondary">
              evenimente înregistrate în platformă
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 0.5 }}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                ÎN PLANIFICARE
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – în curs de organizare
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                FINALIZATE
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – cu feedback disponibil
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Modulul de evenimente va afișa aici KPI reali (distribuție pe
            status, tipuri de evenimente, volum lunar) imediat ce îl legăm la
            endpoint-urile de stats.
          </Typography>
        </Stack>
      )}

      {/* TAB 3 – CLIENȚI (layout pregătit) */}
      {activeTab === "clients" && (
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h4">0</Typography>
            <Typography variant="body2" color="text.secondary">
              clienți înregistrați în platformă
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 0.5 }}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                CLIENȚI ACTIVI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – au cel puțin un eveniment în lucru
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                CLIENȚI RECURENȚI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – cu &gt;= 2 evenimente în istoric
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            În modulul Clienți vom conecta acest tab la statisticile reale:
            retenție, evenimente per client și conversii din lead-uri.
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
