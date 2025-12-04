"use client";

import { useEffect, useMemo, useState } from "react";
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
  Tooltip,
  Typography,
  Autocomplete,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getGuestbookTokens,
  createGuestbookToken,
  getEventParticipants,
} from "@/lib/api/eventsClient";
import { useLocale } from "next-intl";
import { useNotify } from "../providers/NotificationProvider";

function buildShareUrl(token, locale) {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const loc = locale || "ro";
  return `${origin}/${loc}/guestbook/${token}`;
}

export default function EventGuestbookTokensPanel({ event }) {
  const { notify } = useNotify();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [creating, setCreating] = useState(false);
  const [nameHint, setNameHint] = useState("");

    const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const [emailName, setEmailName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const genericToken = useMemo(
    () => tokens.find((t) => t.type === "GENERIC" && t.status === "ACTIVE"),
    [tokens]
  );

  async function load() {
    try {
      setLoading(true);
      const data = await getGuestbookTokens(event.id);
      setTokens(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("getGuestbookTokens error:", e);
      notify("Nu s-au putut încărca linkurile de guestbook.", "error");
    } finally {
      setLoading(false);
    }
  }

    async function loadParticipants() {
    try {
      setLoadingParticipants(true);
      const data = await getEventParticipants(event.id);
      // normalizare simplă
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.participants)
        ? data.participants
        : [];
      setParticipants(list);
    } catch (e) {
      console.error("getEventParticipants error:", e);
      notify("Nu s-au putut încărca invitații/participanții.", "error");
    } finally {
      setLoadingParticipants(false);
    }
  }

  useEffect(() => {
    if (event?.id) {
      load();
      loadParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  async function handleCreateGeneric() {
    try {
      setCreating(true);
      const payload = {
        type: "GENERIC",
        canRead: true,
        canWrite: true,
        maxUses: null,
        expiresAt: null,
        nameHint: nameHint || null,
      };
      await createGuestbookToken(event.id, payload);
      setNameHint("");
      await load();
      notify("Link public de guestbook creat.", "success");
    } catch (e) {
      console.error("createGuestbookToken error:", e);
      notify("Nu s-a putut crea linkul de guestbook.", "error");
    } finally {
      setCreating(false);
    }
  }

    async function handleCreateParticipantToken() {
  if (!selectedParticipant) return;
  try {
    setCreating(true);
    const payload = {
      type: "PARTICIPANT",
      canRead: true,
      canWrite: true,
      maxUses: 1,
      // backend-ul are nevoie de userId + role ca să lege tokenul de EventParticipant
      participantUserId:
        selectedParticipant.userId ||
        selectedParticipant.user?.id ||
        null,
      participantRole: selectedParticipant.role || "CLIENT",
      nameHint:
        selectedParticipant.name ||
        selectedParticipant.user?.name ||
        selectedParticipant.email ||
        selectedParticipant.user?.email ||
        null,
    };

    await createGuestbookToken(event.id, payload);
    await load(); // reload tokens
    notify("Link de guestbook creat pentru invitat.", "success");
  } catch (e) {
    console.error("createGuestbookToken PARTICIPANT error:", e);
    notify("Nu s-a putut crea linkul pentru participant.", "error");
  } finally {
    setCreating(false);
  }
}


    async function handleCreateEmailToken() {
    const email = emailAddress.trim();
    if (!email) return;

    try {
      setCreating(true);
      const payload = {
        type: "EMAIL",
        canRead: true,
        canWrite: true,
        maxUses: 1,
        email,
        nameHint: emailName.trim() || null,
      };
      await createGuestbookToken(event.id, payload);
      setEmailName("");
      setEmailAddress("");
      await load();
      notify("Link de guestbook creat pentru adresa de email.", "success");
    } catch (e) {
      console.error("createGuestbookToken EMAIL error:", e);
      notify("Nu s-a putut crea linkul pentru email.", "error");
    } finally {
      setCreating(false);
    }
  }


  async function handleCopy(tokenStr) {
    const url = buildShareUrl(tokenStr, locale);
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copiat în clipboard.", "success");
    } catch {
      notify("Nu s-a putut copia linkul.", "error");
    }
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Guestbook public"
        action={
          <IconButton onClick={load} size="small" disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        }
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Typography variant="body2" sx={{ mb: 2 }}>
          Creează și distribuie un link public de guestbook pentru invitați.
          Mesajele ajung direct în pagina evenimentului, în secțiunea Guestbook.
        </Typography>

        {/* CREARE LINK GENERIC */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
          sx={{ mb: 3 }}
        >
          <TextField
            label="Nume afișat (ex. Nunta Andrei & Ioana)"
            value={nameHint}
            onChange={(e) => setNameHint(e.target.value)}
            fullWidth
            helperText="Opțional – apare ca nume implicit când cineva deschide linkul."
          />
          <Button
            variant="contained"
            onClick={handleCreateGeneric}
            disabled={creating}
          >
            Generează link public
          </Button>
        </Stack>
        {/* TOKEN PE PARTICIPANT */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Link per invitat (PARTICIPANT)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Generează un link dedicat pentru un invitat din lista de
            participanți. Ideal pentru trimis pe WhatsApp / Messenger, astfel
            încât să scrie direct în guestbook.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
          >
            <Autocomplete
              options={participants}
              loading={loadingParticipants}
              getOptionLabel={(p) =>
                p?.name ||
                p?.fullName ||
                p?.email ||
                p?.phone ||
                "Invitat fără nume"
              }
              value={selectedParticipant}
              onChange={(_, val) => setSelectedParticipant(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Alege invitat"
                  size="small"
                  fullWidth
                />
              )}
              sx={{ flex: 1 }}
            />

            <Button
              variant="outlined"
              onClick={handleCreateParticipantToken}
              disabled={creating || !selectedParticipant}
            >
              Generează link pe invitat
            </Button>
          </Stack>
        </Box>
        {/* TOKEN PE EMAIL */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Link per email (EMAIL)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Introdu un nume și o adresă de email pentru a genera un link
            personalizat de guestbook – util când invitatul nu este încă
            adăugat în lista de participanți.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
          >
            <TextField
              label="Nume invitat (opțional)"
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Email invitat"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              size="small"
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={handleCreateEmailToken}
              disabled={creating || !emailAddress.trim()}
            >
              Generează link pe email
            </Button>
          </Stack>
        </Box>

        {/* EXISTING GENERIC TOKEN */}
        {genericToken ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Link public curent
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={buildShareUrl(genericToken.token, locale)}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
              <Tooltip title="Copiază link">
                <IconButton
                  onClick={() => handleCopy(genericToken.token)}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              <Chip
                size="small"
                label="Public"
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label="Scriere & citire"
                color="success"
                variant="outlined"
              />
              {genericToken.nameHint && (
                <Chip
                  size="small"
                  label={`Nume afișat: ${genericToken.nameHint}`}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nu există încă un link public generat pentru acest eveniment.
          </Typography>
        )}

        {/* LISTĂ TOATE TOKENURILE (pentru viitor – participant/email) */}
        {tokens.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Toate linkurile de guestbook
            </Typography>
            <Stack spacing={1}>
              {tokens.map((t) => (
                <Card
                  key={t.id}
                  variant="outlined"
                  sx={{ p: 1.5, display: "flex", flexDirection: "column" }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography variant="body2">
                      {t.type}{" "}
                      {t.nameHint ? `– ${t.nameHint}` : ""}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                    >
                      <Chip
                        size="small"
                        label={t.status}
                        color={
                          t.status === "ACTIVE" ? "success" : "default"
                        }
                        variant="outlined"
                      />
                      {t.canWrite ? (
                        <Chip
                          size="small"
                          label="write"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="read-only"
                          color="default"
                          variant="outlined"
                        />
                      )}
                      {t.maxUses != null && (
                        <Chip
                          size="small"
                          label={`Uses: ${t.usedCount}/${t.maxUses}`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
