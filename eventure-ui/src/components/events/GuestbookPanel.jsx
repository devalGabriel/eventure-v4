"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getGuestbook,
  postGuestbookEntry,
  deleteGuestbookEntry,
} from "@/lib/api/eventsClient";
import { useNotify } from "../providers/NotificationProvider";

export default function GuestbookPanel({ eventId }) {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getGuestbook(eventId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load guestbook:", e);
      notify("Nu s-a putut încărca guestbook-ul.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) load();
  }, [eventId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = authorName.trim();
    const msg = message.trim();
    if (!name || !msg) return;

    try {
      setLoading(true);
      await postGuestbookEntry(eventId, { authorName: name, message: msg });
      setAuthorName("");
      setMessage("");
      await load();
      notify("Mesaj adăugat în guestbook.", "success");
    } catch (err) {
      console.error("postGuestbookEntry error:", err);
      notify("Nu s-a putut adăuga mesajul.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Sigur vrei să ștergi această intrare?")) return;
    try {
      setLoading(true);
      await deleteGuestbookEntry(eventId, id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      notify("Intrare ștearsă.", "success");
    } catch (err) {
      console.error("deleteGuestbookEntry error:", err);
      notify("Nu s-a putut șterge intrarea.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Guestbook eveniment"
        subheader="Note, mesaje și gânduri pentru acest eveniment."
      />
      <CardContent>
        {/* FORM */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                label="Nume autor (ex. Mireasa, Nasi, Familia X)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Mesaj"
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
                disabled={loading || !authorName.trim() || !message.trim()}
              >
                Adaugă mesaj
              </Button>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* LISTĂ MESAJ */}
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nu există mesaje în guestbook încă.
          </Typography>
        ) : (
          <List dense>
            {entries.map((entry) => (
              <ListItem
                key={entry.id}
                alignItems="flex-start"
                sx={{ mb: 1, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(entry.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
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
                          ? new Date(entry.createdAt).toLocaleString("ro-RO")
                          : ""}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
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
