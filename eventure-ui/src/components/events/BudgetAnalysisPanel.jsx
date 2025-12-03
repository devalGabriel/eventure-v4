"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Stack,
} from "@mui/material";
import { getBudgetAnalysis } from "@/lib/api/eventsClient";

export default function BudgetAnalysisPanel({ eventId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, [eventId]);

  async function load() {
    try {
      setLoading(true);
      const res = await getBudgetAnalysis(eventId);
      setData(res);
    } catch (e) {
      console.error("Budget analysis error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LinearProgress />;

  if (!data)
    return <Typography>Eroare la încărcarea analizei bugetare.</Typography>;

  const { idealBudget, plannedBudget, realBudget } = data;

  const categories = Object.keys({
    ...idealBudget,
    ...plannedBudget,
    ...realBudget,
  });

  return (
    <Card sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Analiză buget eveniment
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {categories.map((catId) => (
        <Box key={catId} sx={{ mb: 3 }}>
          <Typography>
            <b>Categorie #{catId}</b>
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Chip label={`Ideal: ${idealBudget[catId] || 0} lei`} />
            <Chip
              label={`Planificat: ${plannedBudget[catId] || 0} lei`}
              color="info"
            />
            <Chip
              label={`Real: ${realBudget[catId] || 0} lei`}
              color="success"
            />
          </Stack>
        </Box>
      ))}
    </Card>
  );
}
