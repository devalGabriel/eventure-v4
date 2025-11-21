// src/components/provider/ProviderOffersPackagesSection.jsx
"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import {
  getMyServiceOffers,
  createServiceOffer,
  updateServiceOffer,
  getMyPackages,
  createPackage,
  updatePackage,
  getMyProviderGroups,
  getProviderCatalog,
} from "@/lib/api/providersClient";

const currencyOptions = ["RON", "EUR", "USD"];

export default function ProviderOffersPackagesSection() {
  const [offers, setOffers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [groups, setGroups] = useState([]);

  const [offerForm, setOfferForm] = useState({
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
  });

  const [packageForm, setPackageForm] = useState({
    id: null,
    name: "",
    description: "",
    basePrice: "",
    currency: "RON",
    offerIds: [],
    type: "SINGLE_EVENT",
    internalOnly: false,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [o, p, c, g] = await Promise.all([
          getMyServiceOffers(),
          getMyPackages(),
          getProviderCatalog(),
          getMyProviderGroups(),
        ]);
        if (!mounted) return;
        setOffers(o || []);
        setPackages(p || []);
        setCatalog(c || []);
        setGroups(g.groups || []);
      } catch (err) {
        if (mounted) setError(err.message || "Eroare la încărcare");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChangeOffer = (field) => (e) => {
    setOfferForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleChangePackage = (field) => (e) => {
    setPackageForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const resetOfferForm = () => {
    setOfferForm({
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
    });
  };

  const resetPackageForm = () => {
    setPackageForm({
      id: null,
      name: "",
      description: "",
      basePrice: "",
      currency: "RON",
      offerIds: [],
      type: "SINGLE_EVENT",
      internalOnly: false,
    });
  };

  const handleSubmitOffer = async () => {
    setError(null);
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
      let result;
      if (offerForm.id) {
        result = await updateServiceOffer(offerForm.id, payload);
      } else {
        result = await createServiceOffer(payload);
      }
      const newList = offerForm.id
        ? offers.map((o) => (o.id === result.id ? result : o))
        : [...offers, result];
      setOffers(newList);
      resetOfferForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la salvare ofertă");
    }
  };

  const handleSubmitPackage = async () => {
    setError(null);
    try {
      const payload = {
        name: packageForm.name,
        description: packageForm.description,
        basePrice: packageForm.basePrice ? Number(packageForm.basePrice) : null,
        currency: packageForm.currency,
        isPublic: !packageForm.internalOnly,
        internalOnly: packageForm.internalOnly,
        type: packageForm.type,
        offerIds: packageForm.offerIds || [],
      };
      let result;
      if (packageForm.id) {
        result = await updatePackage(packageForm.id, payload);
      } else {
        result = await createPackage(payload);
      }
      const newList = packageForm.id
        ? packages.map((p) => (p.id === result.id ? result : p))
        : [...packages, result];
      setPackages(newList);
      resetPackageForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la salvare pachet");
    }
  };

  const startEditOffer = (offer) => {
    setOfferForm({
      id: offer.id,
      title: offer.title || "",
      description: offer.description || "",
      basePrice: offer.basePrice ?? "",
      currency: offer.currency || "RON",
      pricingUnit: offer.pricingUnit || "eveniment",
      subcategoryId: offer.subcategoryId ? String(offer.subcategoryId) : "",
      tagIds: (offer.tags || []).map((t) => t.tagId),
      durationMinutes: offer.durationMinutes ?? "",
      canOverlap: offer.canOverlap || false,
      maxEventsPerDay: offer.maxEventsPerDay ?? "",
      maxGuests: offer.maxGuests ?? "",
      groupId: offer.groupId ? String(offer.groupId) : "",
    });
  };

  const startEditPackage = (pkg) => {
    setPackageForm({
      id: pkg.id,
      name: pkg.name || "",
      description: pkg.description || "",
      basePrice: pkg.basePrice ?? "",
      currency: pkg.currency || "RON",
      offerIds: (pkg.items || []).map((it) => it.serviceOfferId),
      type: pkg.type || "SINGLE_EVENT",
      internalOnly: pkg.internalOnly || false,
    });
  };

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
        {/* Oferte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Oferte servicii
            </Typography>
            <TextField
              label="Titlu ofertă"
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
              <Grid item xs={6}>
                <TextField
                  label="Preț de bază"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={offerForm.basePrice}
                  onChange={handleChangeOffer("basePrice")}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Monedă"
                  fullWidth
                  margin="normal"
                  value={offerForm.currency}
                  onChange={handleChangeOffer("currency")}
                >
                  {currencyOptions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Grupuri */}
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
                  helperText="Alege dacă serviciul este livrat solo sau de un grup (formație/echipă)."
                >
                  <MenuItem value="">Solo (fără grup)</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name} {g.isActive ? "" : "(inactiv)"}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                {/* Subcategorie */}
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
                  {catalog.flatMap((cat) =>
                    cat.subcategories.map((sub) => (
                      <MenuItem key={sub.id} value={sub.id}>
                        {cat.name} / {sub.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                {/* Tag-uri pentru subcategoria aleasă */}
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
                >
                  {catalog
                    .flatMap((cat) => cat.subcategories)
                    .filter(
                      (sub) =>
                        String(sub.id) === String(offerForm.subcategoryId)
                    )
                    .flatMap((sub) => sub.tags)
                    .map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        {tag.label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* Parametri operaționali */}
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
                  label="Max invitați recomandat"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={offerForm.maxGuests}
                  onChange={handleChangeOffer("maxGuests")}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Poate fi în paralel?"
                  fullWidth
                  margin="normal"
                  value={offerForm.canOverlap ? "yes" : "no"}
                  onChange={(e) =>
                    setOfferForm((prev) => ({
                      ...prev,
                      canOverlap: e.target.value === "yes",
                    }))
                  }
                >
                  <MenuItem value="no">Nu</MenuItem>
                  <MenuItem value="yes">Da</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Unitate de preț (ex: eveniment, oră, persoană)"
                  fullWidth
                  margin="normal"
                  value={offerForm.pricingUnit}
                  onChange={handleChangeOffer("pricingUnit")}
                />
              </Grid>
            </Grid>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              sx={{ mt: 2 }}
            >
              {offerForm.id && (
                <Button onClick={resetOfferForm}>Anulează editarea</Button>
              )}
              <Button variant="contained" onClick={handleSubmitOffer}>
                {offerForm.id ? "Salvează modificările" : "Adaugă ofertă"}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Lista ofertelor
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Titlu</TableCell>
                  <TableCell>Livrat de</TableCell>
                  <TableCell>Preț</TableCell>
                  <TableCell>Monedă</TableCell>
                  <TableCell>Subcategorie</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>{offer.title}</TableCell>
                    <TableCell>
                      {offer.group ? offer.group.name : "Solo"}
                    </TableCell>
                    <TableCell>{offer.basePrice}</TableCell>
                    <TableCell>{offer.currency}</TableCell>
                    <TableCell>
                      {offer.subcategory
                        ? `${offer.subcategory.category.name} / ${offer.subcategory.name}`
                        : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => startEditOffer(offer)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      Nu există încă servicii create.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Pachete */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pachete
            </Typography>
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
              <Grid item xs={6}>
                <TextField
                  label="Preț de bază"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={packageForm.basePrice}
                  onChange={handleChangePackage("basePrice")}
                  helperText="Nu poți coborî sub costul estimat al serviciilor incluse (validat în backend)."
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Monedă"
                  fullWidth
                  margin="normal"
                  value={packageForm.currency}
                  onChange={handleChangePackage("currency")}
                >
                  {currencyOptions.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
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
                  helperText="Alege serviciile din catalogul tău care intră în pachet."
                >
                  {offers.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.title} – {o.basePrice} {o.currency}
                      {o.group ? ` (${o.group.name})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Tip pachet"
                  fullWidth
                  margin="normal"
                  value={packageForm.type}
                  onChange={handleChangePackage("type")}
                  helperText="Single event, multi-day sau abonament."
                >
                  <MenuItem value="SINGLE_EVENT">Eveniment unic</MenuItem>
                  <MenuItem value="MULTI_DAY">Mai multe zile</MenuItem>
                  <MenuItem value="SUBSCRIPTION">Abonament</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Vizibilitate"
                  fullWidth
                  margin="normal"
                  value={packageForm.internalOnly ? "internal" : "public"}
                  onChange={(e) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      internalOnly: e.target.value === "internal",
                    }))
                  }
                  helperText="Pachete interne pot fi folosite doar în negocieri / oferte custom."
                >
                  <MenuItem value="public">Public (vizibil în marketplace)</MenuItem>
                  <MenuItem value="internal">Intern (doar pentru negocieri)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              sx={{ mt: 2 }}
            >
              {packageForm.id && (
                <Button onClick={resetPackageForm}>Anulează editarea</Button>
              )}
              <Button variant="contained" onClick={handleSubmitPackage}>
                {packageForm.id ? "Salvează pachet" : "Adaugă pachet"}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Lista pachetelor
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nume</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Preț</TableCell>
                  <TableCell>Monedă</TableCell>
                  <TableCell>Servicii incluse</TableCell>
                  <TableCell>Vizibilitate</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell>{pkg.type}</TableCell>
                    <TableCell>{pkg.basePrice}</TableCell>
                    <TableCell>{pkg.currency}</TableCell>
                    <TableCell>
                      {pkg.items && pkg.items.length > 0
                        ? pkg.items
                            .map((it) => it.serviceOffer?.title || `#${it.serviceOfferId}`)
                            .join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {pkg.internalOnly ? "Intern" : "Public"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => startEditPackage(pkg)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {packages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      Nu există încă pachete definite.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
