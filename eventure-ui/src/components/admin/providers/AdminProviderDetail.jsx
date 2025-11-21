// src/components/admin/providers/AdminProviderDetail.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
  Button,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  LinearProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  adminGetProviderById,
  adminUpdateProvider,
  adminListProviderAdminNotes,
  adminCreateProviderAdminNote,
} from "@/lib/api/providersClient";

const statusOptions = [
  "INCOMPLETE",
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "DELISTED",
];

export default function AdminProviderDetail({ providerId }) {
  const [data, setData] = useState(null);

  // profil editabil
  const [status, setStatus] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [watchlisted, setWatchlisted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProvider() {
      try {
        const p = await adminGetProviderById(providerId);
        if (!mounted) return;
        setData(p);

        setStatus(p.status);
        setDisplayName(p.displayName || "");
        setLegalName(p.legalName || "");
        setTaxId(p.taxId || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setWatchlisted(!!p.isWatchlisted);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Eroare la încărcare provider");
      }
    }

    async function loadNotes() {
      setNotesLoading(true);
      setNotesError(null);
      try {
        const list = await adminListProviderAdminNotes(providerId);
        if (!mounted) return;
        setNotes(list || []);
      } catch (err) {
        console.error(err);
        if (mounted)
          setNotesError(err.message || "Eroare la încărcare note admin");
      } finally {
        if (mounted) setNotesLoading(false);
      }
    }

    loadProvider();
    loadNotes();

    return () => {
      mounted = false;
    };
  }, [providerId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        status,
        displayName: displayName || null,
        legalName: legalName || null,
        taxId: taxId || null,
        email: email || null,
        phone: phone || null,
        isWatchlisted: watchlisted,
      };

      const updated = await adminUpdateProvider(providerId, payload);

      setData((prev) => ({
        ...(prev || {}),
        ...updated,
      }));

      setStatus(updated.status ?? status);
      setDisplayName(updated.displayName ?? displayName);
      setLegalName(updated.legalName ?? legalName);
      setTaxId(updated.taxId ?? taxId);
      setEmail(updated.email ?? email);
      setPhone(updated.phone ?? phone);
      setWatchlisted(
        typeof updated.isWatchlisted === "boolean"
          ? updated.isWatchlisted
          : watchlisted
      );

      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    const text = newNote.trim();
    if (!text) return;
    setCreatingNote(true);
    setNotesError(null);
    try {
      const created = await adminCreateProviderAdminNote(providerId, {
        note: text,
      });
      setNotes((prev) => [created, ...(prev || [])]);
      setNewNote("");
    } catch (err) {
      console.error(err);
      setNotesError(err.message || "Eroare la adăugare notă admin");
    } finally {
      setCreatingNote(false);
    }
  };

  if (!data) {
    return <Typography>Se încarcă detaliile providerului...</Typography>;
  }

  const categories = data.categories || [];
  const offers = data.offers || [];
  const packages = data.packages || [];
  const groups = data.groups || [];

  const createdAt = data.createdAt ? new Date(data.createdAt) : null;
  const updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

  const profileScoreSummary = (() => {
    let score = 0;
    const total = 5;
    const hasIdentity = !!(displayName || legalName);
    const hasTaxId = !!taxId;
    const hasLocation = !!(data.city || data.address);
    const hasServices = offers.length > 0;
    const hasCategories = categories.length > 0;

    if (hasIdentity) score += 1;
    if (hasTaxId) score += 1;
    if (hasLocation) score += 1;
    if (hasServices) score += 1;
    if (hasCategories) score += 1;

    const percent = Math.round((score / total) * 100);
    let label = "Minim";
    if (percent >= 80) label = "Complet";
    else if (percent >= 40) label = "Parțial";

    return { percent, label };
  })();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Provider #{data.id} – {displayName || "(fără nume afișat)"}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {saved && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          Modificările au fost salvate.
        </Typography>
      )}

      {/* SECȚIUNEA 1 – Profil business + status + meta + watchlist */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Date business
          </Typography>

          <TextField
            label="Nume afișat"
            fullWidth
            margin="dense"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Denumire legală"
            fullWidth
            margin="dense"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <TextField
            label="CUI / CIF"
            fullWidth
            margin="dense"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Telefon"
            fullWidth
            margin="dense"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Meta & profil</Typography>
            <Typography variant="body2">
              Creat la:{" "}
              {createdAt ? createdAt.toLocaleString() : "necunoscut"}
            </Typography>
            <Typography variant="body2">
              Ultima actualizare:{" "}
              {updatedAt ? updatedAt.toLocaleString() : "necunoscut"}
            </Typography>
            <Typography variant="body2">
              Profil: {profileScoreSummary.label} (
              {profileScoreSummary.percent}%)
            </Typography>
            <Typography variant="body2">
              Servicii: {offers.length} · Pachete: {packages.length} ·
              Grupuri: {groups.length}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Status & control</Typography>
          <TextField
            select
            label="Status profil"
            fullWidth
            margin="normal"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={watchlisted}
                onChange={(e) => setWatchlisted(e.target.checked)}
              />
            }
            label="Provider pe watchlist (de urmărit)"
          />

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Se salvează..." : "Salvează modificările"}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* SECȚIUNEA 1.1 – Note interne admin */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Note interne administrator
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Notele sunt vizibile doar în panoul de administrare și nu sunt
          afișate providerului sau clienților.
        </Typography>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12} md={9}>
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ex: 'Provider serios, răspuns rapid la oferte', 'Atenție la contractele pentru corporate' etc."
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={3}
            sx={{ display: "flex", alignItems: "flex-end" }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={handleAddNote}
              disabled={creatingNote}
            >
              {creatingNote ? "Se adaugă..." : "Adaugă notă"}
            </Button>
          </Grid>
        </Grid>

        {notesLoading && <LinearProgress sx={{ mb: 1 }} />}
        {notesError && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {notesError}
          </Typography>
        )}

        {notes.length === 0 && !notesLoading ? (
          <Typography variant="body2" color="text.secondary">
            Nu există note încă.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {notes.map((n) => {
              const created = n.createdAt ? new Date(n.createdAt) : null;
              return (
                <Box
                  key={n.id}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1,
                  }}
                >
                  <Typography variant="body2">{n.note}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {created ? created.toLocaleString() : ""} –{" "}
                    {n.adminName || `Admin #${n.adminUserId}`}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECȚIUNEA 2 – Categorii & subcategorii */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Categorii & subcategorii (profil)
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={
                c.subcategory?.category
                  ? `${c.subcategory.category.name} / ${c.subcategory.name}`
                  : c.subcategory?.name || "(necunoscut)"
              }
            />
          ))}
          {categories.length === 0 && (
            <Typography variant="body2">Nicio categorie setată.</Typography>
          )}
        </Stack>

        {data.description && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Descriere</Typography>
            <Typography variant="body2">{data.description}</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECȚIUNEA 3 – Servicii oferite */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Servicii oferite (ServiceOffer)
        </Typography>

        {offers.length === 0 ? (
          <Typography variant="body2">
            Providerul nu are încă servicii definite.
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Titlu</TableCell>
                <TableCell>Subcategorie</TableCell>
                <TableCell>Preț</TableCell>
                <TableCell>Unitate</TableCell>
                <TableCell>Durată</TableCell>
                <TableCell>Capacitate</TableCell>
                <TableCell>Paralel</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.title}</TableCell>
                  <TableCell>
                    {offer.subcategory?.category
                      ? `${offer.subcategory.category.name} / ${offer.subcategory.name}`
                      : offer.subcategory?.name || "—"}
                  </TableCell>
                  <TableCell>
                    {offer.basePrice != null
                      ? `${offer.basePrice} ${offer.currency || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>{offer.pricingUnit || "—"}</TableCell>
                  <TableCell>
                    {offer.durationMinutes
                      ? `${offer.durationMinutes} min`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {offer.maxGuests ? `${offer.maxGuests} pers` : "—"}
                  </TableCell>
                  <TableCell>{offer.canOverlap ? "Da" : "Nu"}</TableCell>
                  <TableCell>{offer.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {offers.length > 0 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            * Tag-uri serviciu vizibile la nivel de detaliu serviciu (în viitor
            putem adăuga o pagină dedicată).
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECȚIUNEA 4 – Pachete de servicii */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Pachete (ServicePackage)
        </Typography>

        {packages.length === 0 ? (
          <Typography variant="body2">
            Providerul nu are încă pachete definite.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume pachet</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Preț</TableCell>
                <TableCell>Vizibilitate</TableCell>
                <TableCell>Servicii incluse</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.name}</TableCell>
                  <TableCell>{pkg.type}</TableCell>
                  <TableCell>
                    {pkg.basePrice != null
                      ? `${pkg.basePrice} ${pkg.currency || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {pkg.internalOnly
                      ? "Doar intern"
                      : pkg.isPublic
                      ? "Public"
                      : "Privat"}
                  </TableCell>
                  <TableCell>
                    {(pkg.items || [])
                      .map((item) => item.serviceOffer?.title)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* SECȚIUNEA 5 – Grupuri & Membri */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Grupuri & Membri
        </Typography>

        {groups && groups.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume grup</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Politică</TableCell>
                <TableCell>Membri & share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell>{g.isActive ? "Activ" : "Inactiv"}</TableCell>
                  <TableCell>{g.sharePolicy}</TableCell>
                  <TableCell>
                    {(g.members || [])
                      .map((m) => {
                        const sharePart =
                          m.shareMode === "PERCENTAGE"
                            ? `${m.shareValue ?? 0}%`
                            : m.shareMode === "FIXED_AMOUNT"
                            ? `${m.shareValue ?? 0} (fix)`
                            : "";
                        return m.role
                          ? `${m.userId} (${m.role}${
                              sharePart ? ", " + sharePart : ""
                            })`
                          : `${m.userId}${
                              sharePart ? " (" + sharePart + ")" : ""
                            }`;
                      })
                      .join("; ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2">
            Providerul nu are grupuri definite.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
