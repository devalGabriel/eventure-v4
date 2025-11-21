// src/components/admin/cards/ProviderStatsCard.jsx
"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Grid, LinearProgress } from "@mui/material";
import { adminListProviders } from "@/lib/api/providersClient";

function safeTotal(res) {
  if (typeof res?.total === "number") return res.total;
  if (Array.isArray(res?.items)) return res.items.length;
  return 0;
}

export default function ProviderStatsCard() {
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    pendingReviewProviders: 0,
    suspendedProviders: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [all, active, pendingReview, suspended, applications] =
        await Promise.all([
          adminListProviders({ page: 1, pageSize: 1 }),
          adminListProviders({ status: "ACTIVE", page: 1, pageSize: 1 }),
          adminListProviders({
            status: "PENDING_REVIEW",
            page: 1,
            pageSize: 1,
          }),
          adminListProviders({ status: "SUSPENDED", page: 1, pageSize: 1 }),
          (async () => {
            const qs = new URLSearchParams({
              status: "PENDING",
              page: "1",
              pageSize: "1",
            }).toString();
            const r = await fetch(
              `/api/admin/provider-applications?${qs}`,
              { cache: "no-store" }
            );
            const txt = await r.text();
            if (!r.ok) throw new Error(txt || "failed");
            const j = JSON.parse(txt);
            return j;
          })(),
        ]);

      setStats({
        totalProviders: safeTotal(all),
        activeProviders: safeTotal(active),
        pendingReviewProviders: safeTotal(pendingReview),
        suspendedProviders: safeTotal(suspended),
        pendingApplications:
          typeof applications?.total === "number"
            ? applications.total
            : Array.isArray(applications?.rows)
            ? applications.rows.length
            : 0,
      });
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tiles = [
    {
      label: "Total provideri",
      value: stats.totalProviders,
      desc: "toate profilele create",
    },
    {
      label: "Provideri activi",
      value: stats.activeProviders,
      desc: "vizibili în marketplace",
    },
    {
      label: "În așteptare review",
      value: stats.pendingReviewProviders,
      desc: "profiluri ce cer activare",
    },
    {
      label: "Provideri suspendați",
      value: stats.suspendedProviders,
      desc: "temporar blocați",
    },
    {
      label: "Aplicații PENDING",
      value: stats.pendingApplications,
      desc: "cereri de provider neprocesate",
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Provider overview
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid key={tile.label} item xs={6} md={4}>
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                p: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase" }}
              >
                {tile.label}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {tile.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {tile.desc}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
