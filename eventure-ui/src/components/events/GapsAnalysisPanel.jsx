"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Divider,
  Typography,
  Stack,
  LinearProgress,
} from "@mui/material";
import { getGapsAnalysis } from "@/lib/api/eventsClient";

function riskColor(risk) {
  switch (risk) {
    case "HIGH":
      return "#d32f2f";
    case "OVER_BUDGET":
      return "#ff9800";
    case "MEDIUM":
      return "#ffb300";
    case "LOW":
    default:
      return "#4caf50";
  }
}

export default function GapsAnalysisPanel({ eventId }) {
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState([]);

  useEffect(() => {
    load();
  }, [eventId]);

  async function load() {
    try {
      setLoading(true);
      const res = await getGapsAnalysis(eventId);
      setGaps(res);
    } catch (e) {
      console.error("Gaps error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LinearProgress />;

  return (
    <Card sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6">Riscuri & Nevoi neacoperite</Typography>
      <Divider sx={{ my: 2 }} />

      {gaps.map((g) => (
        <Card
          key={g.needId}
          sx={{
            p: 2,
            mb: 2,
            borderLeft: `6px solid ${riskColor(g.risk)}`,
          }}
        >
          <Typography>
            <b>{g.label}</b> — {g.status}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            Riscuri: {g.risk}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label={`${g.invitationsCount} invitații`} />
            <Chip label={`${g.offersCount} oferte`} />
          </Stack>
        </Card>
      ))}
    </Card>
  );
}
