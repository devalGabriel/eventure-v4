"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { getEventGuestbook } from "@/lib/api/eventsClient";
import { useNotify } from "../providers/NotificationProvider";

export default function EventGuestbookPanel({ eventId }) {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getEventGuestbook(eventId);

      // Normalizare defensivă – suportă mai multe forme de răspuns
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.entries)
        ? data.entries
        : [];

      setEntries(list);
      setStats(data?.stats || null);
    } catch (e) {
      console.error("getEventGuestbook error:", e);
      notify("Nu s-a putut încărca guestbook-ul evenimentului.", "error");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Guestbook eveniment"
        subheader="Mesaje primite din linkurile publice de guestbook"
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {stats && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {`Mesaje: ${stats.totalEntries ?? entries.length}${
                stats.uniqueAuthors != null
                  ? ` · Autori unici: ${stats.uniqueAuthors}`
                  : ""
              }`}
            </Typography>
          </Box>
        )}

        {entries.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary">
            Nu există încă mesaje în guestbook pentru acest eveniment.
          </Typography>
        )}

        {entries.length > 0 && (
          <List dense>
            {entries.map((entry) => (
              <ListItem
                key={entry.id}
                alignItems="flex-start"
                sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Typography variant="subtitle2">
                        {entry.authorName || "Invitat anonim"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString("ro-RO")
                          : ""}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {entry.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
