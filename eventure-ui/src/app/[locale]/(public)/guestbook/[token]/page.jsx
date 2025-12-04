"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getPublicGuestbook,
  postPublicGuestbookMessage,
} from "@/lib/api/eventsClient";
import { useNotify } from "@/components/providers/NotificationProvider";

export default function PublicGuestbookPage() {
  const { token } = useParams();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const d = await getPublicGuestbook(token);
      setData(d);
      if (d?.token?.nameHint && !authorName) {
        setAuthorName(d.token.nameHint);
      }
    } catch (e) {
      console.error("Public guestbook load error:", e);
      notify("Link de guestbook invalid sau expirat.", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading && !data) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 8 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 8 }}>
        <Typography variant="h6">
          Link de guestbook invalid sau expirat.
        </Typography>
      </Box>
    );
  }

  const { event, token: tokenMeta, entries } = data;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tokenMeta?.canWrite) return;

    const name = authorName.trim();
    const msg = message.trim();
    if (!name || !msg) return;

    try {
      setPosting(true);
      await postPublicGuestbookMessage(token, {
        authorName: name,
        message: msg,
      });
      setMessage("");
      await load();
      notify("Mesaj adăugat, mulțumim!", "success");
    } catch (err) {
      console.error("postPublicGuestbookMessage error:", err);
      notify("Nu s-a putut trimite mesajul.", "error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", my: 6, px: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={`Guestbook pentru ${event?.name || "eveniment"}`}
          subheader={
            event
              ? `${event.type || ""} · ${
                  event.date
                    ? new Date(event.date).toLocaleDateString("ro-RO")
                    : ""
                } · ${event.city || ""}`
              : null
          }
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Lasă un mesaj, o amintire sau un gând frumos pentru organizatorii și
            invitații acestui eveniment.
          </Typography>
        </CardContent>
      </Card>

      {tokenMeta?.canWrite && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Scrie un mesaj în guestbook" />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Numele tău"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Mesajul tău"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      posting ||
                      !authorName.trim() ||
                      !message.trim() ||
                      !tokenMeta.canWrite
                    }
                  >
                    Trimite mesaj
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {tokenMeta?.canRead && (
        <Card>
          <CardHeader title="Mesaje din guestbook" />
          <CardContent>
            {!entries || entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Încă nu există mesaje. Fii primul care scrie ceva!
              </Typography>
            ) : (
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
                            {entry.authorName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {entry.createdAt
                              ? new Date(entry.createdAt).toLocaleString(
                                  "ro-RO"
                                )
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
      )}
    </Box>
  );
}
