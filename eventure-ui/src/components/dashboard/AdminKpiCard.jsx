// src/components/dashboard/AdminKpiCard.jsx
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

function percent(part, total) {
  const t = Number(total) || 0;
  if (!t) return 0;
  const p = ((Number(part) || 0) * 100) / t;
  return Math.round(p);
}

export default function AdminKpiCard() {
  // TAB ACTIV
  const [activeTab, setActiveTab] = useState("providers");

  // ---------- PROVIDERS STATE ----------
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);
  const [providerStats, setProviderStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    incomplete: 0,
    watchlisted: 0,
  });

  // ---------- EVENTS STATE ----------
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [eventsStats, setEventsStats] = useState({
    total: 0,
    preContract: {
      no_activity: 0,
      invitations_sent: 0,
      in_negotiation: 0,
      providers_selected: 0,
      atRisk: 0,
    },
  });

  // ---------- CLIENTS STATE ----------
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [clientsStats, setClientsStats] = useState({
    total: 0,
  });

  // =========================================================
  // LOAD PROVIDERS (exact ca varianta ta veche, doar ambalat)
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadProviders() {
      setProvidersLoading(true);
      setProvidersError(null);

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

        setProviderStats({
          total: all?.total ?? 0,
          active: active?.total ?? 0,
          pending: pending?.total ?? 0,
          suspended: suspended?.total ?? 0,
          incomplete: incomplete?.total ?? 0,
          watchlisted: watchlisted?.total ?? 0,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setProvidersError(
            e?.message ||
              "Eroare la încărcarea statisticilor pentru provideri."
          );
        }
      } finally {
        if (!cancelled) {
          setProvidersLoading(false);
        }
      }
    }

    loadProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  const activePercent = useMemo(
    () => percent(providerStats.active, providerStats.total),
    [providerStats.active, providerStats.total]
  );
  const pendingPercent = useMemo(
    () => percent(providerStats.pending, providerStats.total),
    [providerStats.pending, providerStats.total]
  );
  const suspendedPercent = useMemo(
    () => percent(providerStats.suspended, providerStats.total),
    [providerStats.suspended, providerStats.total]
  );
  const watchlistedPercent = useMemo(
    () => percent(providerStats.watchlisted, providerStats.total),
    [providerStats.watchlisted, providerStats.total]
  );

  // =========================================================
  // LOAD EVENTS (total + pre-contract pipeline)
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setEventsLoading(true);
      setEventsError(null);

      let totalEvents = 0;
      const preContract = {
        no_activity: 0,
        invitations_sent: 0,
        in_negotiation: 0,
        providers_selected: 0,
        atRisk: 0,
      };

      try {
        // 1) total evenimente (events-service /events)
        try {
          const res = await fetch("/api/events?page=1&pageSize=1", {
            cache: "no-store",
            credentials: "include",
          });
          const txt = await res.text();
          if (!res.ok) {
            console.error("AdminKpiCard: /api/events failed", txt);
          } else {
            const data = txt ? JSON.parse(txt) : {};
            totalEvents =
              typeof data.total === "number"
                ? data.total
                : Array.isArray(data.rows)
                ? data.rows.length
                : 0;
          }
        } catch (err) {
          console.error("AdminKpiCard: error loading /api/events", err);
        }

        // 2) pre-contract pipeline (events-service /admin/events/pre-contract)
        try {
          const res = await fetch("/api/admin/events/pre-contract", {
            cache: "no-store",
            credentials: "include",
          });
          const txt = await res.text();
          if (!res.ok) {
            console.error(
              "AdminKpiCard: /api/admin/events/pre-contract failed",
              txt
            );
            if (!cancelled) {
              setEventsError(
                "Nu s-au putut încărca datele de pre-contract pentru evenimente."
              );
            }
          } else {
            const data = txt ? JSON.parse(txt) : {};
            const rows = Array.isArray(data.rows) ? data.rows : [];

            for (const row of rows) {
              const status = row.preContractStatus || "no_activity";
              if (preContract[status] != null) {
                preContract[status] += 1;
              }
              if (row.isAtRisk) {
                preContract.atRisk += 1;
              }
            }
          }
        } catch (err) {
          console.error(
            "AdminKpiCard: error loading pre-contract pipeline",
            err
          );
          if (!cancelled) {
            setEventsError(
              "Nu s-au putut încărca datele de pre-contract pentru evenimente."
            );
          }
        }

        if (!cancelled) {
          setEventsStats({
            total: totalEvents,
            preContract,
          });
        }
      } catch (err) {
        console.error("AdminKpiCard: events stats unexpected error", err);
        if (!cancelled) {
          setEventsError("Eroare la agregarea statisticilor pentru evenimente.");
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const preContractTotal = useMemo(() => {
    const p = eventsStats.preContract;
    return (
      p.no_activity +
      p.invitations_sent +
      p.in_negotiation +
      p.providers_selected
    );
  }, [eventsStats.preContract]);

  const eventsInPlanning = eventsStats.preContract.no_activity;
  const eventsInPreContract =
    eventsStats.preContract.invitations_sent +
    eventsStats.preContract.in_negotiation;
  const eventsWithProvidersSelected =
    eventsStats.preContract.providers_selected;
  const eventsAtRisk = eventsStats.preContract.atRisk;

  const uncoveredEvents =
    eventsStats.total > 0
      ? Math.max(eventsStats.total - eventsWithProvidersSelected, 0)
      : 0;

  // =========================================================
  // LOAD CLIENTS (admin / clients)
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      setClientsLoading(true);
      setClientsError(null);

      try {
        const res = await fetch("/api/admin/clients?page=1&pageSize=1", {
          cache: "no-store",
          credentials: "include",
        });
        const txt = await res.text();
        if (!res.ok) {
          console.error("AdminKpiCard: /api/admin/clients failed", txt);
          if (!cancelled) {
            setClientsError(
              "Nu s-au putut încărca statisticile pentru clienți."
            );
          }
          return;
        }

        const data = txt ? JSON.parse(txt) : {};
        let total = 0;

        if (typeof data.total === "number") {
          total = data.total;
        } else if (Array.isArray(data.rows)) {
          total = data.rows.length;
        } else if (Array.isArray(data)) {
          total = data.length;
        }

        if (!cancelled) {
          setClientsStats({ total });
        }
      } catch (err) {
        console.error("AdminKpiCard: error loading clients stats", err);
        if (!cancelled) {
          setClientsError(
            "Nu s-au putut încărca statisticile pentru clienți."
          );
        }
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
        }
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // RENDER
  // =========================================================

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

      {/* ---------------- TAB PROVIDERS ---------------- */}
      {activeTab === "providers" && (
        <>
          {providersLoading && <LinearProgress sx={{ mb: 1.5 }} />}

          {providersError && (
            <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
              {providersError}
            </Typography>
          )}

          {!providersLoading && !providersError && (
            <Stack spacing={2}>
              {/* total provideri */}
              <Stack spacing={0.5}>
                <Typography variant="h4">{providerStats.total}</Typography>
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
                    {providerStats.active}
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
                    {providerStats.pending}
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
                    {providerStats.suspended}
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
                    {providerStats.watchlisted}
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
        </>
      )}

      {/* ---------------- TAB EVENTS ---------------- */}
      {activeTab === "events" && (
        <Stack spacing={2}>
          {eventsLoading && <LinearProgress sx={{ mb: 1.5 }} />}

          {eventsError && (
            <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
              {eventsError}
            </Typography>
          )}

          <Stack spacing={0.5}>
            <Typography variant="h4">{eventsStats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              evenimente înregistrate în platformă (toate rolurile)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dintre acestea, {preContractTotal} au activitate în fluxul
              pre-contract (invitații, oferte, selecții).
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
                {eventsInPlanning}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                fără invitații trimise sau oferte primite
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                ÎN PRE-CONTRACT
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {eventsInPreContract}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                invitații trimise și/sau oferte în negociere
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                FURNIZORI SELECTAȚI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {eventsWithProvidersSelected}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                pregătite pentru generare de contract (MOD 03)
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                FĂRĂ FURNIZORI ALEȘI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {uncoveredEvents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                evenimente unde nu există încă assignment confirmat
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                EVENIMENTE „AT RISK”
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {eventsAtRisk}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                evenimente în următoarele 14 zile fără furnizori selectați
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )}

      {/* ---------------- TAB CLIENTS ---------------- */}
      {activeTab === "clients" && (
        <Stack spacing={2}>
          {clientsLoading && <LinearProgress sx={{ mb: 1.5 }} />}

          {clientsError && (
            <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
              {clientsError}
            </Typography>
          )}

          <Stack spacing={0.5}>
            <Typography variant="h4">{clientsStats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              clienți înregistrați în platformă (rol CLIENT)
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 0.5 }}
          >
            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                BAZĂ DE CLIENȚI
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {clientsStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                total conturi cu rol CLIENT
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                ACTIVITATE (coming soon)
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – clienți cu cel puțin un eveniment în lucru (după integrarea
                completă MOD 03)
              </Typography>
            </Box>

            <Box sx={metricBoxSx}>
              <Typography variant="caption" color="text.secondary">
                RECURENȚĂ (coming soon)
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                – clienți cu &gt;= 2 evenimente în istoric (după modul CRM)
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            În modulul Clienți vom putea afișa KPI reali de retenție și
            conversii (lead → client → eveniment), pe baza users-service +
            events-service.
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
