"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function invitationStatusColor(status) {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
      return "success";
    case "DECLINED":
    case "EXPIRED":
      return "error";
    default:
      return "default";
  }
}

function offerStatusColor(status) {
  switch (status) {
    case "DRAFT":
      return "default";
    case "SENT":
      return "info";
    case "ACCEPTED_BY_CLIENT":
      return "success";
    case "REJECTED_BY_CLIENT":
    case "WITHDRAWN":
      return "error";
    default:
      return "default";
  }
}

export default function EventInvitationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invitations, setInvitations] = useState([]);
  const [offers, setOffers] = useState([]);

  // --- form INVITE SINGLE PROVIDER ---
  const [singleProviderId, setSingleProviderId] = useState("");
  const [singleNote, setSingleNote] = useState("");

  // --- form BULK BY CATEGORIES ---
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [bulkCategoryIds, setBulkCategoryIds] = useState([]);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  async function loadInvitationsAndOffers() {
    if (!eventId) return;
    setLoading(true);
    setError("");
    try {
      const [invRes, offRes] = await Promise.all([
        fetch(`/api/events/${eventId}/invitations`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/offers`, { cache: "no-store" }),
      ]);

      if (!invRes.ok) throw new Error(await invRes.text());
      if (!offRes.ok) throw new Error(await offRes.text());

      const invData = await invRes.json();
      const offData = await offRes.json();

      setInvitations(Array.isArray(invData) ? invData : invData.rows || []);
      setOffers(Array.isArray(offData) ? offData : offData.rows || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load invitations / offers");
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const res = await fetch("/api/providers/catalog", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : data.rows || []);
    } catch (e) {
      console.error(e);
      // nu stricăm pagina dacă pică catalogul – doar dezactivăm bulk-ul
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      loadInvitationsAndOffers();
    }
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // map simplu pentru select categorie
  const flatCategories = useMemo(() => {
    // catalog: [{ id, name, slug, subcategories: [...] }, ...]
    return (catalog || []).map((c) => ({
      id: c.id,
      label: c.name || c.slug || `Category #${c.id}`,
    }));
  }, [catalog]);

  // --- INVITE SINGLE PROVIDER (fallback / targeted flow) ---
  async function handleCreateSingleInvitation(e) {
    e.preventDefault();
    if (!eventId || !singleProviderId.trim()) return;

    try {
      const r = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerId: singleProviderId.trim(),
          note: singleNote?.trim() || null,
        }),
      });
      if (!r.ok) {
        throw new Error(await r.text());
      }
      setSingleProviderId("");
      setSingleNote("");
      await loadInvitationsAndOffers();
      setBulkMessage("");
    } catch (err) {
      console.error(err);
      alert("Invite failed: " + String(err.message || err));
    }
  }

  // --- BULK INVITE BY CATEGORIES ---
  async function handleBulkInvite(e) {
    e.preventDefault();
    if (!eventId || !bulkCategoryIds.length) return;

    setBulkLoading(true);
    setBulkMessage("");
    try {
      // 1) luăm pachete de la providers-service prin BFF
      //    presupunem că suporta query `categoryIds=1,2,3`
      const qs = new URLSearchParams();
      qs.set("categoryIds", bulkCategoryIds.join(","));
      const pkgRes = await fetch(
        `/api/client/packages?${qs.toString()}`,
        { cache: "no-store" }
      );

      if (!pkgRes.ok) {
        throw new Error(await pkgRes.text());
      }

      const pkgs = await pkgRes.json();
      const arr = Array.isArray(pkgs) ? pkgs : pkgs.rows || [];

      // 2) extragem providerId distinct
      const providerIds = Array.from(
        new Set(
          arr
            .map((p) => p.providerId)
            .filter((id) => typeof id === "string" && id.trim())
        )
      );

      if (!providerIds.length) {
        setBulkMessage(
          "Nu s-au găsit provideri cu pachete în categoriile selectate."
        );
        return;
      }

      // 3) trimitem bulk invitation către events-service
      const resp = await fetch(
        `/api/events/${eventId}/invitations/bulk`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            providerIds,
            note: bulkNote?.trim() || null,
          }),
        }
      );

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const result = await resp.json().catch(() => null);

      setBulkMessage(
        `Invitații trimise: ${result?.createdCount ?? providerIds.length}. Provideri deja invitați (omiteți): ${
          result?.skippedCount ?? 0
        }.`
      );

      setBulkNote("");
      await loadInvitationsAndOffers();
    } catch (err) {
      console.error(err);
      alert("Bulk invite failed: " + String(err.message || err));
    } finally {
      setBulkLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Invitații &amp; Oferte</Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadInvitationsAndOffers}
          variant="outlined"
        >
          Reîncarcă
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Din această secțiune poți:
        <br />
        – trimite <strong>invitații în masă</strong> către provideri care au
        pachete în anumite categorii (bulk by categories),
        <br />
        – sau trimite <strong>invitații punctuale</strong> către un provider
        anume (până când marketplace-ul complet este disponibil).
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {/* --- BULK INVITE BY CATEGORIES --- */}
      <Card variant="outlined">
        <CardHeader title="Invită provideri după categorii (bulk)" />
        <CardContent>
          {catalogLoading && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Se încarcă catalogul de categorii...
            </Typography>
          )}
          {!catalogLoading && !flatCategories.length && (
            <Typography variant="body2" color="text.secondary">
              Catalogul de categorii nu este disponibil momentan. Poți folosi
              în continuare invitațiile punctuale mai jos.
            </Typography>
          )}

          {flatCategories.length > 0 && (
            <Stack
              component="form"
              spacing={2}
              onSubmit={handleBulkInvite}
              sx={{ mt: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Selectează una sau mai multe categorii de servicii. Eventure va
                găsi provideri care au pachete în aceste categorii și va trimite
                invitații către ei pentru acest eveniment.
              </Typography>

              <Select
                multiple
                value={bulkCategoryIds}
                onChange={(e) =>
                  setBulkCategoryIds(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value
                  )
                }
                displayEmpty
                size="small"
              >
                <MenuItem disabled value="">
                  Selectează categorii...
                </MenuItem>
                {flatCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                label="Mesaj pentru provideri"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
              />

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!bulkCategoryIds.length || bulkLoading}
                >
                  Trimite invitații
                </Button>
                {bulkLoading && (
                  <Typography variant="body2" color="text.secondary">
                    Se trimit invitațiile...
                  </Typography>
                )}
              </Stack>

              {bulkMessage && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {bulkMessage}
                </Alert>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* --- INVITE SINGLE PROVIDER (fallback) --- */}
      <Card variant="outlined">
        <CardHeader title="Invitație punctuală către un provider" />
        <CardContent>
          <Stack
            component="form"
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            onSubmit={handleCreateSingleInvitation}
          >
            <TextField
              label="Provider ID"
              value={singleProviderId}
              onChange={(e) => setSingleProviderId(e.target.value)}
              helperText="ID-ul intern al providerului (temporar; în viitor se va trimite direct din pagina providerului)."
              fullWidth
            />
            <TextField
              label="Mesaj / Detalii"
              value={singleNote}
              onChange={(e) => setSingleNote(e.target.value)}
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
            />
            <Button
              type="submit"
              variant="outlined"
              disabled={!singleProviderId.trim()}
            >
              Trimite invitație
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* --- LAYOUT INVITAȚII / OFERTE --- */}
      <Grid container spacing={2}>
        {/* Invitații */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader
              title="Invitații trimise"
              subheader={
                invitations.length
                  ? `${invitations.length} invitații`
                  : "Nu există încă invitații pentru acest eveniment."
              }
            />
            <CardContent>
              {!invitations.length ? (
                <Typography variant="body2" color="text.secondary">
                  Folosește una dintre secțiunile de mai sus pentru a invita
                  provideri să îți trimită oferte.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {invitations.map((inv) => (
                    <Box
                      key={inv.id}
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="subtitle2">
                          Provider: {inv.providerId}
                        </Typography>
                        <Chip
                          size="small"
                          label={inv.status || "PENDING"}
                          color={invitationStatusColor(inv.status)}
                        />
                      </Stack>
                      {inv.note && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {inv.note}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Trimisă la:{" "}
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleString()
                          : "-"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Oferte */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader
              title="Oferte pentru eveniment"
              subheader={
                offers.length
                  ? `${offers.length} oferte primite pentru acest eveniment`
                  : "Încă nu ai primit oferte."
              }
            />
            <CardContent>
              {!offers.length ? (
                <Typography variant="body2" color="text.secondary">
                  După ce trimiți invitații, furnizorii îți pot trimite oferte
                  pentru acest eveniment, care vor apărea aici.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {offers.map((o) => (
                    <Box
                      key={o.id}
                      sx={{
                        p: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="subtitle2">
                          Provider: {o.providerId}
                        </Typography>
                        <Chip
                          size="small"
                          label={o.status || "DRAFT"}
                          color={offerStatusColor(o.status)}
                        />
                      </Stack>
                      {o.title && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {o.title}
                        </Typography>
                      )}
                      {o.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: "pre-wrap", mb: 0.5 }}
                        >
                          {o.description}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        {o.price != null
                          ? `${o.price} ${o.currency || ""}`
                          : "Preț la cerere"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
