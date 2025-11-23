// src/components/dashboard/ClientEventsWidget.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const metricBoxSx = {
  p: 1.25,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.default",
};

export default function ClientEventsWidget() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());
  const pathname = usePathname();

  const {locale, path} = extractLocaleAndPath(pathname)
  const eventsBasePath = `/${locale}/events`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = new URLSearchParams({
        owner: "me",
        page: "1",
        pageSize: "100",
      });
      const r = await fetch(`/api/events?${p}`, { cache: "no-store" });
      const d = r.ok ? await r.json() : { rows: [] };
      setRows(d.rows || []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const s = { total: 0, status: {}, next: null };
    if (!rows) return s;
    rows.forEach((e) => {
      s.total++;
      s.status[e.status] = (s.status[e.status] || 0) + 1;
      if (e.date) {
        const t = new Date(e.date).getTime();
        if (t >= now && (!s.next || t < new Date(s.next.date).getTime())) {
          s.next = e;
        }
      }
    });
    return s;
  }, [rows, now]);

  if (loading || !rows) {
    return (
      <Stack spacing={1}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 0.8 }}
        >
          Evenimentele mele
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
        Evenimentele mele
      </Typography>

      {/* total */}
      <Stack spacing={0.5}>
        <Typography variant="h4">{stats.total}</Typography>
        <Typography variant="body2" color="text.secondary">
          evenimente create în platformă
        </Typography>
      </Stack>

      {/* statusuri principale */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: "wrap" }}
      >
        {Object.entries(stats.status).map(([k, v]) => (
          <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
        ))}
        {Object.keys(stats.status).length === 0 && (
          <Typography variant="caption" color="text.secondary">
            Nu există încă evenimente.
          </Typography>
        )}
      </Stack>

      {/* următorul eveniment */}
            <Box sx={{ ...metricBoxSx, mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          URMĂTORUL EVENIMENT
        </Typography>
        {stats.next ? (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Box sx={{ mr: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
                noWrap
              >
                {stats.next.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {stats.next.type} •{" "}
                {stats.next.date
                  ? new Date(stats.next.date).toLocaleString()
                  : "fără dată"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {(stats.next.city || stats.next.location || "-") +
                  (stats.next.guestCount
                    ? ` • ${stats.next.guestCount} invitați`
                    : "")}
              </Typography>
            </Box>
            <Button
              component={Link}
              href={`${eventsBasePath}/${stats.next.id}`}
              variant="outlined"
              size="small"
            >
              Deschide
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Nu ai evenimente viitoare programate.
          </Typography>
        )}
      </Box>


      {/* acțiuni rapide */}
      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
        <Button
          component={Link}
          href={`${eventsBasePath}/new`}
          variant="contained"
          size="small"
        >
          Creează eveniment
        </Button>
        <Button
          component={Link}
          href={`${eventsBasePath}`}
          variant="outlined"
          size="small"
        >
          Vezi toate
        </Button>
      </Stack>
    </Stack>
  );
}
