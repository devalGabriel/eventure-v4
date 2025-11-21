// src/components/provider/ProviderOffersPackagesSection.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getMyServiceOffers,
  createServiceOffer,
  updateServiceOffer,
  deleteServiceOffer,
  getMyPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getMyProviderGroups,
  getProviderCatalog,
} from "@/lib/api/providersClient";

const CURRENCY_OPTIONS = ["RON", "EUR", "USD"];

// --- default form objects ---
const EMPTY_OFFER_FORM = {
  id: null,
  title: "",
  description: "",
  basePrice: "",
  currency: "RON",
  pricingUnit: "eveniment",
  subcategoryId: "",
  tagIds: [],
  durationMinutes: "",
  canOverlap: false,
  maxEventsPerDay: "",
  maxGuests: "",
  groupId: "",
};

const EMPTY_PACKAGE_FORM = {
  id: null,
  name: "",
  description: "",
  basePrice: "",
  currency: "RON",
  offerIds: [],
  type: "SINGLE_EVENT",
  internalOnly: false,
};

export default function ProviderOffersPackagesSection() {
  // === state compact, pe obiecte ===
  const [data, setData] = useState({
    offers: [],
    packages: [],
    catalog: [],
    groups: [],
    loading: true,
    error: null,
  });

  const [dialogs, setDialogs] = useState({
    offer: { open: false, form: EMPTY_OFFER_FORM },
    package: { open: false, form: EMPTY_PACKAGE_FORM },
  });

  // helpers scurte pentru citire
  const { offers, packages, catalog, groups, loading, error } = data;
  const { offer: offerDialog, package: packageDialog } = dialogs;
  const offerForm = offerDialog.form;
  const packageForm = packageDialog.form;

  // === data load ===
  useEffect(() => {
    let mounted = true;

    async function load() {
      setData((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [o, p, c, g] = await Promise.all([
          getMyServiceOffers(),
          getMyPackages(),
          getProviderCatalog(),
          getMyProviderGroups(),
        ]);

        if (!mounted) return;
        const cats = Array.isArray(c) ? c : c?.categories || [];

        setData((prev) => ({
          ...prev,
          offers: o || [],
          packages: p || [],
          catalog: cats,
          groups: g?.groups || [],
          loading: false,
        }));
      } catch (err) {
        if (!mounted) return;
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Eroare la încărcare",
        }));
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // === helpers catalog ===
  const flatSubcategories = useMemo(
    () =>
      catalog.flatMap((cat) =>
        (cat.subcategories || []).map((sub) => ({
          ...sub,
          categoryName: cat.name,
        }))
      ),
    [catalog]
  );

  const tagsForSubcategory = (subcategoryId) => {
    if (!subcategoryId) return [];
    const sub = flatSubcategories.find(
      (s) => String(s.id) === String(subcategoryId)
    );
    return sub?.tags || [];
  };

  const subcategoryLabelForOffer = (offer) => {
    if (offer.subcategory && offer.subcategory.category) {
      return `${offer.subcategory.category.name} / ${offer.subcategory.name}`;
    }
    if (!offer.subcategoryId) return "—";
    const sub = flatSubcategories.find(
      (s) => String(s.id) === String(offer.subcategoryId)
    );
    if (!sub) return "—";
    return `${sub.categoryName} / ${sub.name}`;
  };

  // === helpers pentru dialoguri & formulare (pe obiect dialogs) ===
  const setOfferForm = (updater) => {
    setDialogs((prev) => ({
      ...prev,
      offer: {
        ...prev.offer,
        form:
          typeof updater === "function"
            ? updater(prev.offer.form)
            : updater,
      },
    }));
  };

  const setPackageForm = (updater) => {
    setDialogs((prev) => ({
      ...prev,
      package: {
        ...prev.package,
        form:
          typeof updater === "function"
            ? updater(prev.package.form)
            : updater,
      },
    }));
  };

  const openNewOfferDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      offer: { open: true, form: { ...EMPTY_OFFER_FORM } },
    }));
  };

  const openEditOfferDialog = (offer) => {
    setDialogs((prev) => ({
      ...prev,
      offer: {
        open: true,
        form: {
          id: offer.id,
          title: offer.title || "",
          description: offer.description || "",
          basePrice: offer.basePrice ?? "",
          currency: offer.currency || "RON",
          pricingUnit: offer.pricingUnit || "eveniment",
          subcategoryId: offer.subcategoryId ? String(offer.subcategoryId) : "",
          tagIds: (offer.tags || []).map((t) => t.tagId),
          durationMinutes: offer.durationMinutes ?? "",
          canOverlap: !!offer.canOverlap,
          maxEventsPerDay: offer.maxEventsPerDay ?? "",
          maxGuests: offer.maxGuests ?? "",
          groupId: offer.groupId ? String(offer.groupId) : "",
        },
      },
    }));
  };

  const closeOfferDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      offer: { open: false, form: { ...EMPTY_OFFER_FORM } },
    }));
  };

  const openNewPackageDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      package: { open: true, form: { ...EMPTY_PACKAGE_FORM } },
    }));
  };

  const openEditPackageDialog = (pkg) => {
    setDialogs((prev) => ({
      ...prev,
      package: {
        open: true,
        form: {
          id: pkg.id,
          name: pkg.name || "",
          description: pkg.description || "",
          basePrice: pkg.basePrice ?? "",
          currency: pkg.currency || "RON",
          offerIds: (pkg.items || []).map((it) => it.serviceOfferId),
          type: pkg.type || "SINGLE_EVENT",
          internalOnly: !!pkg.internalOnly,
        },
      },
    }));
  };

  const closePackageDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      package: { open: false, form: { ...EMPTY_PACKAGE_FORM } },
    }));
  };

  // === handlers formular ===
  const handleChangeOffer = (field) => (e) => {
    const value = e.target.value;
    setOfferForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePackage = (field) => (e) => {
    const value = e.target.value;
    setPackageForm((prev) => ({ ...prev, [field]: value }));
  };

  // === submit (API + update state) ===
  const handleSubmitOffer = async () => {
    setData((prev) => ({ ...prev, error: null }));
    try {
      const payload = {
        title: offerForm.title,
        description: offerForm.description,
        basePrice: offerForm.basePrice ? Number(offerForm.basePrice) : null,
        currency: offerForm.currency,
        pricingUnit: offerForm.pricingUnit,
        isPublic: true,
        subcategoryId: offerForm.subcategoryId || null,
        tagIds: offerForm.tagIds || [],
        durationMinutes: offerForm.durationMinutes
          ? Number(offerForm.durationMinutes)
          : null,
        canOverlap: !!offerForm.canOverlap,
        maxEventsPerDay: offerForm.maxEventsPerDay
          ? Number(offerForm.maxEventsPerDay)
          : null,
        maxGuests: offerForm.maxGuests ? Number(offerForm.maxGuests) : null,
        groupId: offerForm.groupId || null,
      };

      const result = offerForm.id
        ? await updateServiceOffer(offerForm.id, payload)
        : await createServiceOffer(payload);

      setData((prev) => ({
        ...prev,
        offers: offerForm.id
          ? prev.offers.map((o) => (o.id === result.id ? result : o))
          : [...prev.offers, result],
      }));

      closeOfferDialog();
    } catch (err) {
      console.error(err);
      setData((prev) => ({
        ...prev,
        error: err.message || "Eroare la salvare ofertă",
      }));
    }
  };

  const handleSubmitPackage = async () => {
    setData((prev) => ({ ...prev, error: null }));
    try {
      const payload = {
        name: packageForm.name,
        description: packageForm.description,
        basePrice: packageForm.basePrice
          ? Number(packageForm.basePrice)
          : null,
        currency: packageForm.currency,
        isPublic: !packageForm.internalOnly,
        internalOnly: !!packageForm.internalOnly,
        type: packageForm.type,
        offerIds: packageForm.offerIds || [],
      };

      const result = packageForm.id
        ? await updatePackage(packageForm.id, payload)
        : await createPackage(payload);

      setData((prev) => ({
        ...prev,
        packages: packageForm.id
          ? prev.packages.map((p) => (p.id === result.id ? result : p))
          : [...prev.packages, result],
      }));

      closePackageDialog();
    } catch (err) {
      console.error(err);
      setData((prev) => ({
        ...prev,
        error: err.message || "Eroare la salvare pachet",
      }));
    }
  };

  // === delete ===
  const handleDeleteOffer = async (offer) => {
    if (!window.confirm(`Ștergi serviciul "${offer.title}"?`)) return;
    setData((prev) => ({ ...prev, error: null }));
    try {
      await deleteServiceOffer(offer.id);
      setData((prev) => ({
        ...prev,
        offers: prev.offers.filter((o) => o.id !== offer.id),
      }));
    } catch (err) {
      console.error(err);
      setData((prev) => ({
        ...prev,
        error: err.message || "Nu am putut șterge serviciul.",
      }));
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Ștergi pachetul "${pkg.name}"?`)) return;
    setData((prev) => ({ ...prev, error: null }));
    try {
      await deletePackage(pkg.id);
      setData((prev) => ({
        ...prev,
        packages: prev.packages.filter((p) => p.id !== pkg.id),
      }));
    } catch (err) {
      console.error(err);
      setData((prev) => ({
        ...prev,
        error: err.message || "Nu am putut șterge pachetul.",
      }));
    }
  };

  // === render ===
  if (loading) {
    return <Typography>Se încarcă serviciile...</Typography>;
  }

  return (
    <Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* TABEL SERVICII */}
        <Grid item xs={12} md={6} width={"100%"}>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Servicii</Typography>
              <Button variant="contained" size="small" onClick={openNewOfferDialog}>
                Adaugă serviciu
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Serviciu</TableCell>
                  <TableCell align="right">Preț</TableCell>
                  <TableCell>Monedă</TableCell>
                  <TableCell>Subcategorie</TableCell>
                  <TableCell>Grup</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} hover>
                    <TableCell>{offer.title}</TableCell>
                    <TableCell align="right">
                      {offer.basePrice != null ? offer.basePrice : "—"}
                    </TableCell>
                    <TableCell>{offer.currency}</TableCell>
                    <TableCell>{subcategoryLabelForOffer(offer)}</TableCell>
                    <TableCell>{offer.group ? offer.group.name : "Solo"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEditOfferDialog(offer)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteOffer(offer)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      Nu există servicii încă. Folosește „Adaugă serviciu”.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* TABEL PACHETE */}
        <Grid item xs={12} md={6} width={"100%"}>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Pachete</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={openNewPackageDialog}
              >
                Adaugă pachet
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pachet</TableCell>
                  <TableCell align="right">Preț</TableCell>
                  <TableCell>Monedă</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Vizibilitate</TableCell>
                  <TableCell>Servicii</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id} hover>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell align="right">
                      {pkg.basePrice != null ? pkg.basePrice : "—"}
                    </TableCell>
                    <TableCell>{pkg.currency}</TableCell>
                    <TableCell>{pkg.type}</TableCell>
                    <TableCell>
                      {pkg.internalOnly ? "Intern" : "Public"}
                    </TableCell>
                    <TableCell>
                      {(pkg.items || [])
                        .map((it) => it.serviceOffer?.title)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEditPackageDialog(pkg)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePackage(pkg)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {packages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      Nu există pachete încă. Folosește „Adaugă pachet”.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* DIALOG SERVICIU */}
      <Dialog
        open={offerDialog.open}
        onClose={closeOfferDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {offerForm.id ? "Editează serviciu" : "Adaugă serviciu"}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Titlu serviciu"
            fullWidth
            margin="normal"
            value={offerForm.title}
            onChange={handleChangeOffer("title")}
          />
          <TextField
            label="Descriere"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={offerForm.description}
            onChange={handleChangeOffer("description")}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Preț de bază"
                fullWidth
                margin="normal"
                type="number"
                value={offerForm.basePrice}
                onChange={handleChangeOffer("basePrice")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Monedă"
                fullWidth
                margin="normal"
                value={offerForm.currency}
                onChange={handleChangeOffer("currency")}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Unitate de preț (ex: eveniment, oră)"
                fullWidth
                margin="normal"
                value={offerForm.pricingUnit}
                onChange={handleChangeOffer("pricingUnit")}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Subcategorie serviciu"
                fullWidth
                margin="normal"
                value={offerForm.subcategoryId}
                onChange={(e) =>
                  setOfferForm((prev) => ({
                    ...prev,
                    subcategoryId: e.target.value,
                    tagIds: [],
                  }))
                }
              >
                <MenuItem value="">(fără clasificare)</MenuItem>
                {flatSubcategories.map((sub) => (
                  <MenuItem key={sub.id} value={sub.id}>
                    {sub.categoryName} / {sub.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Livrat de"
                fullWidth
                margin="normal"
                value={offerForm.groupId}
                onChange={(e) =>
                  setOfferForm((prev) => ({
                    ...prev,
                    groupId: e.target.value,
                  }))
                }
                helperText="Alege dacă serviciul este solo sau livrat de un grup."
              >
                <MenuItem value="">Solo (fără grup)</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name} {g.isActive ? "" : "(inactiv)"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            select
            SelectProps={{ multiple: true }}
            label="Tag-uri (atribute serviciu)"
            fullWidth
            margin="normal"
            value={offerForm.tagIds}
            onChange={(e) =>
              setOfferForm((prev) => ({
                ...prev,
                tagIds: e.target.value,
              }))
            }
            disabled={!offerForm.subcategoryId}
            helperText="Ex: live, acustic, premium, all inclusive etc."
          >
            {tagsForSubcategory(offerForm.subcategoryId).map((tag) => (
              <MenuItem key={tag.id} value={tag.id}>
                {tag.label}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Durată (minute)"
                type="number"
                fullWidth
                margin="normal"
                value={offerForm.durationMinutes}
                onChange={handleChangeOffer("durationMinutes")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max evenimente / zi"
                type="number"
                fullWidth
                margin="normal"
                value={offerForm.maxEventsPerDay}
                onChange={handleChangeOffer("maxEventsPerDay")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max invitați recomandați"
                type="number"
                fullWidth
                margin="normal"
                value={offerForm.maxGuests}
                onChange={handleChangeOffer("maxGuests")}
              />
            </Grid>
          </Grid>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={!!offerForm.canOverlap}
                onChange={(e) =>
                  setOfferForm((prev) => ({
                    ...prev,
                    canOverlap: e.target.checked,
                  }))
                }
              />
            }
            label="Serviciul poate fi livrat în paralel cu alte evenimente în aceeași zi"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeOfferDialog}>Anulează</Button>
          <Button variant="contained" onClick={handleSubmitOffer}>
            {offerForm.id ? "Salvează modificările" : "Adaugă serviciu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG PACHET */}
      <Dialog
        open={packageDialog.open}
        onClose={closePackageDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {packageForm.id ? "Editează pachet" : "Adaugă pachet"}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nume pachet"
            fullWidth
            margin="normal"
            value={packageForm.name}
            onChange={handleChangePackage("name")}
          />
          <TextField
            label="Descriere"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={packageForm.description}
            onChange={handleChangePackage("description")}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Preț de bază"
                fullWidth
                margin="normal"
                type="number"
                value={packageForm.basePrice}
                onChange={handleChangePackage("basePrice")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Monedă"
                fullWidth
                margin="normal"
                value={packageForm.currency}
                onChange={handleChangePackage("currency")}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Tip pachet"
                fullWidth
                margin="normal"
                value={packageForm.type}
                onChange={handleChangePackage("type")}
              >
                <MenuItem value="SINGLE_EVENT">Eveniment unic</MenuItem>
                <MenuItem value="MULTI_DAY">Multi-zile</MenuItem>
                <MenuItem value="SUBSCRIPTION">Abonament</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TextField
            select
            SelectProps={{ multiple: true }}
            label="Servicii incluse în pachet"
            fullWidth
            margin="normal"
            value={packageForm.offerIds}
            onChange={(e) =>
              setPackageForm((prev) => ({
                ...prev,
                offerIds: e.target.value,
              }))
            }
            helperText="Alege serviciile (DJ, formație, cabina foto etc.)"
          >
            {offers.map((offer) => (
              <MenuItem key={offer.id} value={offer.id}>
                {offer.title}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={!!packageForm.internalOnly}
                onChange={(e) =>
                  setPackageForm((prev) => ({
                    ...prev,
                    internalOnly: e.target.checked,
                  }))
                }
              />
            }
            label="Pachet intern (nu apare public, folosit doar pentru oferte personalizate)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePackageDialog}>Anulează</Button>
          <Button variant="contained" onClick={handleSubmitPackage}>
            {packageForm.id ? "Salvează modificările" : "Adaugă pachet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
