"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

export default function BudgetEstimatePanel({ eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/events/${eventId}/budget-estimate`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Eroare la încărcarea estimării.");
      }
      const d = await r.json();
      setData(d);
    } catch (e) {
      console.warn("budget-estimate error", e);
      setError("Nu există încă o configurație de buget pentru acest eveniment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) load();
  }, [eventId]);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Estimare buget" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Se calculează estimarea de buget…
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader title="Estimare buget" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {error ||
              "Nu este disponibilă o estimare de buget. Verifică șablonul în zona de Admin sau completează bugetul manual."}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    label,
    guestCount,
    plannedBudget,
    currency,
    baseTotal,
    source,
    categories,
  } = data;

  return (
    <Card>
      <CardHeader title="Estimare buget" subheader={label || "Tip eveniment"} />
      <Typography variant="caption" sx={{ px: 2 }} color="error.main">
        (***Estimarea de buget se va realiza in productie pe baza datelor reale ale
        evenimentului si ale nevoilor introduse de client***)
      </Typography>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">
              {baseTotal.toLocaleString("ro-RO", {
                maximumFractionDigits: 0,
              })}{" "}
              {currency}
            </Typography>
            <Chip
              size="small"
              label={
                source === "event"
                  ? "bazat pe bugetul introdus"
                  : source === "template-per-guest"
                  ? "bazat pe invitați & template"
                  : "estimare template"
              }
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {guestCount
              ? `Număr estimativ invitați: ${guestCount}.`
              : "Numărul de invitați nu este setat."}
            {plannedBudget
              ? ` Buget planificat introdus: ${plannedBudget.toLocaleString(
                  "ro-RO",
                  { maximumFractionDigits: 0 }
                )} ${currency}.`
              : ""}
          </Typography>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ textTransform: "uppercase", mb: 0.5 }}
              color="text.secondary"
            >
              Distribuție recomandată pe categorii
            </Typography>

            <Stack spacing={0.5}>
              {categories.map((c) => (
                <Stack
                  key={c.key}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ fontSize: 14 }}
                >
                  <Box sx={{ mr: 2 }}>
                    <Typography variant="body2">{c.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.percent}% din buget
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {c.amount.toLocaleString("ro-RO", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    {currency}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
