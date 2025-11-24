"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, List, ListItem, ListItemText, Typography } from "@mui/material";

export default function BriefTemplatePanel({ eventId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const r = await fetch(`/api/events/${eventId}/brief-template`, {
        cache: "no-store",
      });
      if (!r.ok) {
        throw new Error(await r.text().catch(() => ""));
      }
      const d = await r.json();
      setData(d);
    } catch (e) {
      // e ok să nu existe template, nu afișăm eroare agresivă
      setError(true);
    }
  }

  useEffect(() => {
    if (eventId) load();
  }, [eventId]);

  if (error || !data) {
    return null; // nu afișăm nimic dacă nu avem template
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title="Ghid completare brief"
        subheader={data.label ? `Tip eveniment: ${data.label}` : undefined}
      />
      <CardContent>
        {data.intro && (
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {data.intro}
          </Typography>
        )}
        {data.tips && data.tips.length > 0 && (
          <List dense>
            {data.tips.map((tip, idx) => (
              <ListItem key={idx} sx={{ py: 0 }}>
                <ListItemText
                  primaryTypographyProps={{ variant: "body2" }}
                  primary={`• ${tip}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
