// src/components/dashboard/ProviderQuickActions.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

const metricBoxSx = {
  p: 1.25,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.default",
};

export default function ProviderQuickActions() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const p = new URLSearchParams({
        participant: "me",
        role: "PROVIDER",
        page: "1",
        pageSize: "100",
      });
      const r = await fetch(`/api/events?${p}`, { cache: "no-store" });
      const d = r.ok ? await r.json() : { rows: [] };
      setRows(d.rows || []);
    })();
  }, []);

  const stats = useMemo(() => {
    const s = { total: 0, byStatus: {} };
    (rows || []).forEach((e) => {
      s.total++;
      s.byStatus[e.status] = (s.byStatus[e.status] || 0) + 1;
    });
    return s;
  }, [rows]);

  if (!rows) {
    return (
      <Stack spacing={1}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 0.8 }}
        >
          Provider — evenimente
        </Typography>
        <LinearProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: 0.8 }}
      >
        Provider — evenimente
      </Typography>

      {/* total */}
      <Stack spacing={0.5}>
        <Typography variant="h4">{stats.total}</Typography>
        <Typography variant="body2" color="text.secondary">
          evenimente în care ești invitat ca furnizor
        </Typography>
      </Stack>

      {/* statusuri */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {Object.entries(stats.byStatus).map(([k, v]) => (
          <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
        ))}
        {Object.keys(stats.byStatus).length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Nu ai încă solicitări de eveniment.
          </Typography>
        )}
      </Stack>

      {/* acțiuni rapide */}
      <Box sx={{ ...metricBoxSx, mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          ACȚIUNI RAPIDE
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          sx={{ mt: 0.75 }}
        >
          <Button
            component={Link}
            href="../offers"
            variant="contained"
            size="small"
          >
            Evenimente de ofertat
          </Button>
          <Button
            component={Link}
            href="../events"
            variant="outlined"
            size="small"
          >
            Toate evenimentele
          </Button>
          {/* viitor: grupuri servicii */}
          {/* <Button
            component={Link}
            href="../offers/groups"
            variant="outlined"
            size="small"
          >
            Grupuri servicii
          </Button> */}
        </Stack>
      </Box>
    </Stack>
  );
}
