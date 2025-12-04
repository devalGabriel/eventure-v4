// src/components/events/EventParticipantsPanel.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getEventParticipants,
  createEventParticipant,
  deleteEventParticipant,
} from "@/lib/api/eventsClient";
import { useNotify } from "../providers/NotificationProvider";

const ROLE_OPTIONS = [
  { value: "CLIENT", label: "Client" },
  { value: "PROVIDER", label: "Provider" },
  { value: "ADMIN", label: "Admin" },
];

export default function EventParticipantsPanel({ event }) {
  const { notify } = useNotify();
  const eventId = event?.id;

  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("CLIENT");

  async function load() {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await getEventParticipants(eventId);
      setParticipants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("getEventParticipants error:", e);
      notify("Nu s-a putut încărca lista de invitați.", "error");
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAddParticipant(e) {
    e.preventDefault();
    const email = newEmail.trim();
    const phone = newPhone.trim();

    if (!email && !phone) {
      notify("Introdu cel puțin email sau telefon.", "warning");
      return;
    }

    try {
      setLoading(true);
      await createEventParticipant(eventId, {
        email,
        phone,
        role: newRole,
      });
      setNewEmail("");
      setNewPhone("");
      setNewRole("CLIENT");
      await load();
      notify("Invitat adăugat în lista participanților.", "success");
    } catch (err) {
      console.error("createEventParticipant error:", err);
      notify(
        err?.message ||
          "Nu s-a putut adăuga invitatul. Verifică dacă există utilizator cu acest email/telefon.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteParticipant(p) {
    if (
      !window.confirm(
        `Sigur vrei să elimini invitatul (${
          p.name || p.email || p.userId
        }) din acest eveniment?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await deleteEventParticipant(eventId, p.userId, p.role);
      setParticipants((prev) =>
        prev.filter(
          (row) =>
            !(
              row.eventId === p.eventId &&
              row.userId === p.userId &&
              row.role === p.role
            )
        )
      );
      notify("Invitat eliminat.", "success");
    } catch (err) {
      console.error("deleteEventParticipant error:", err);
      notify(
        err?.message ||
          "Nu s-a putut elimina invitatul (poate are token-uri de guestbook active).",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Lista de invitați"
        subheader="Participanți la eveniment (utilizatori existenți ai aplicației, identificați prin email/telefon)."
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* FORM ADD */}
        <Box component="form" onSubmit={handleAddParticipant} sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "flex-end" }}
          >
            <TextField
              label="Email invitat"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Telefon invitat"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              fullWidth
            />
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Rol în eveniment</InputLabel>
              <Select
                label="Rol în eveniment"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || (!newEmail.trim() && !newPhone.trim())}
            >
              Adaugă invitat
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            În această versiune, poți adăuga doar utilizatori existenți ai
            aplicației (client / provider), identificați prin email sau telefon.
          </Typography>
        </Box>

        {/* LISTĂ PARTICIPANȚI */}
        {participants.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nu există încă invitați înregistrați pentru acest eveniment.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {participants.map((p) => (
              <Box
                key={`${p.eventId}-${p.userId}-${p.role}`}
                sx={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  pb: 1,
                  mb: 1,
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {p.name || p.email || p.userId}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      {p.email && `Email: ${p.email}`}
                      {p.email && p.phone && " · "}
                      {p.phone && `Telefon: ${p.phone}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      User ID: {p.userId}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    justifyContent={{ xs: "flex-start", md: "flex-end" }}
                  >
                    <Chip
                      size="small"
                      label={`Rol: ${p.role}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`Status: ${p.status}`}
                      variant="outlined"
                    />
                    {p.tokensCount != null && p.tokensCount > 0 && (
                      <Chip
                        size="small"
                        label={`Guestbook tokens: ${p.tokensCount}`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteParticipant(p)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
