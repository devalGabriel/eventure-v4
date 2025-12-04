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

const STATUS_BUCKET_LABELS = {
  PLANNING: "În pregătire",
  ACTIVE: "Active",
  COMPLETED: "Finalizate",
};

const STATUS_TO_BUCKET = {
  DRAFT: "PLANNING",
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELED: "COMPLETED",
};

function getBucket(status) {
  const s = (status || "DRAFT").toUpperCase();
  return STATUS_TO_BUCKET[s] || "PLANNING";
}

function statusChipProps(status) {
  const s = (status || "DRAFT").toUpperCase();
  switch (s) {
    case "DRAFT":
    case "PLANNING":
      return { label: "În pregătire", color: "default" };
    case "ACTIVE":
      return { label: "Activ", color: "success" };
    case "COMPLETED":
      return { label: "Finalizat", color: "primary" };
    case "CANCELED":
      return { label: "Anulat", color: "warning" };
    default:
      return { label: s, color: "default" };
  }
}

export default function ClientEventsWidget() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { locale } = extractLocaleAndPath(pathname || "/ro/dashboard");
  const safeLocale = locale || "ro";

  const eventsBasePath = `/${safeLocale}/events`;
  const newEventPath = `${eventsBasePath}/new`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const p = new URLSearchParams({
          owner: "me",
          page: "1",
          pageSize: "50",
        });
        const res = await fetch(`/api/events?${p.toString()}`, {
          cache: "no-store",
        });
        const txt = await res.text();
        if (!res.ok) {
          console.error("ClientEventsWidget load failed", txt);
          if (!cancelled) setRows([]);
          return;
        }
        const data = txt ? JSON.parse(txt) : {};
        const list = Array.isArray(data.rows) ? data.rows : [];
        if (!cancelled) setRows(list);
      } catch (e) {
        console.error("ClientEventsWidget error", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const base = {
      total: 0,
      PLANNING: 0,
      ACTIVE: 0,
      COMPLETED: 0,
    };
    (rows || []).forEach((ev) => {
      base.total += 1;
      const bucket = getBucket(ev.status);
      base[bucket] += 1;
    });
    return base;
  }, [rows]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const withDate = (rows || [])
      .map((ev) => {
        const ts = ev.date ? new Date(ev.date).getTime() : NaN;
        return { ...ev, _ts: ts };
      })
      .filter((ev) => !Number.isNaN(ev._ts) && ev._ts >= now)
      .sort((a, b) => a._ts - b._ts)
      .slice(0, 3);
    return withDate;
  }, [rows]);

  if (loading && !rows) {
    return (
      <Stack spacing={1} sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Evenimente
        </Typography>
        <LinearProgress />
      </Stack>
    );
  }

  if ((rows || []).length === 0) {
    return (
      <Stack spacing={1} sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Evenimente
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nu ai încă evenimente create. Începe prin a adăuga primul tău eveniment.
        </Typography>
        <Button
          component={Link}
          href={newEventPath}
          variant="contained"
          size="small"
        >
          Creează eveniment
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="overline" color="text.secondary">
          Pipeline evenimente
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {stats.total} evenimente
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        {["PLANNING", "ACTIVE", "COMPLETED"].map((bucket) => (
          <Box
            key={bucket}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              minWidth: 90,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {STATUS_BUCKET_LABELS[bucket]}
            </Typography>
            <Typography variant="h6">{stats[bucket]}</Typography>
          </Box>
        ))}
      </Stack>

      {upcoming.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Următoarele evenimente</Typography>
          {upcoming.map((ev) => {
            const chip = statusChipProps(ev.status);
            return (
              <Stack
                key={ev.id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Button
                    component={Link}
                    href={`${eventsBasePath}/${ev.id}`}
                    variant="text"
                    size="small"
                    sx={{ px: 0 }}
                  >
                    {ev.name || "Eveniment fără nume"}
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {ev.date
                      ? new Date(ev.date).toLocaleDateString(safeLocale)
                      : "fără dată"}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={chip.label}
                  color={chip.color}
                  variant="outlined"
                />
              </Stack>
            );
          })}
        </Stack>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          component={Link}
          href={newEventPath}
          variant="contained"
          size="small"
        >
          Creează eveniment
        </Button>
        <Button
          component={Link}
          href={eventsBasePath}
          variant="outlined"
          size="small"
        >
          Vezi toate
        </Button>
      </Stack>
    </Stack>
  );
}
