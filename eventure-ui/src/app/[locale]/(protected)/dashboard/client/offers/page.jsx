"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Rating,
  InputAdornment,
  MenuItem,
  Pagination,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import PersonIcon from "@mui/icons-material/Person";
import { usePathname, useSearchParams } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

// Tipuri de eveniment – pentru UX (filtru local)
const EVENT_TYPES = [
  { value: "wedding", label: "Nuntă" },
  { value: "baptism", label: "Botez" },
  { value: "corporate", label: "Corporate" },
];

// Categoriile sunt "logice" (nu sunt încă legate 100% de DB)
// Le folosim la filtrare locală pe baza label-ului/cheii
const PROVIDER_CATEGORIES = [
  { value: "", label: "Toate categoriile" },
  { value: "venue", label: "Locații" },
  { value: "music", label: "Muzică / DJ / Formație" },
  { value: "photo_video", label: "Foto / Video" },
  { value: "decor", label: "Decorațiuni & Flori" },
  { value: "catering", label: "Catering" },
];

export default function ClientOffersPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = extractLocaleAndPath(pathname);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1); // 1-based pentru Pagination
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtre
  const [eventType, setEventType] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [onlyGroups, setOnlyGroups] = useState(false);

  // preload eventType din query (ex: ?eventType=wedding)
  useEffect(() => {
    const et = searchParams.get("eventType");
    if (et && !eventType) {
      setEventType(et);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      // deocamdată eventType & category sunt filtrate local în UI;
      // le putem trimite la backend când avem mapping direct în Prisma.
      if (location.trim()) params.set("location", location.trim());
      if (budgetMin) params.set("budgetMin", budgetMin);
      if (budgetMax) params.set("budgetMax", budgetMax);
      if (onlyGroups) params.set("onlyGroups", "true");

      const r = await fetch(`/api/client/packages?${params.toString()}`, {
        cache: "no-store",
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Failed to load offers");
      }

      const data = await r.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      console.error(e);
      setError("Nu s-au putut încărca ofertele. Încearcă din nou.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, location, budgetMin, budgetMax, onlyGroups]);

  // === FILTRARE LOCALĂ (pe lista deja încărcată) ===
  // filtru local suplimentar: text + tip eveniment + categorie
  const visibleItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    const et = eventType.trim().toLowerCase();
    const cat = category.trim().toLowerCase();

    return items.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.shortDescription || p.description || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      const tagsStr = Array.isArray(p.tags)
        ? p.tags.join(" ").toLowerCase()
        : "";
      const categoryLabel = (p.categoryLabel || p.category || "").toLowerCase();

      // 1) căutare text liber
      let textMatch = true;
      if (term) {
        textMatch =
          name.includes(term) ||
          desc.includes(term) ||
          city.includes(term);
      }

      // 2) tip eveniment – heuristici pe text (nu atingem schema)
      let eventMatch = true;
      if (et) {
        const haystack = `${name} ${desc} ${tagsStr}`;
        if (et === "wedding") {
          eventMatch =
            haystack.includes("nunt") ||
            haystack.includes("wedding") ||
            haystack.includes("bride");
        } else if (et === "baptism") {
          eventMatch =
            haystack.includes("botez") ||
            haystack.includes("baptism") ||
            haystack.includes("christening");
        } else if (et === "corporate") {
          eventMatch =
            haystack.includes("corporate") ||
            haystack.includes("teambuilding") ||
            haystack.includes("team building") ||
            haystack.includes("business");
        }
      }

      // 3) categorie – heuristici după categoryLabel + tags
      let catMatch = true;
      if (cat) {
        const catHaystack = `${categoryLabel} ${tagsStr}`;

        if (cat === "venue") {
          catMatch =
            catHaystack.includes("loca") ||
            catHaystack.includes("venue") ||
            catHaystack.includes("restaurant") ||
            catHaystack.includes("sală") ||
            catHaystack.includes("sala");
        } else if (cat === "music") {
          catMatch =
            catHaystack.includes("dj") ||
            catHaystack.includes("muzic") ||
            catHaystack.includes("forma") ||
            catHaystack.includes("band");
        } else if (cat === "photo_video") {
          catMatch =
            catHaystack.includes("foto") ||
            catHaystack.includes("photo") ||
            catHaystack.includes("video");
        } else if (cat === "decor") {
          catMatch =
            catHaystack.includes("decor") ||
            catHaystack.includes("flori") ||
            catHaystack.includes("flowers");
        } else if (cat === "catering") {
          catMatch =
            catHaystack.includes("catering") ||
            catHaystack.includes("meni") ||
            catHaystack.includes("food");
        }
      }

      return textMatch && eventMatch && catMatch;
    });
  }, [items, q, eventType, category]);


  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">Oferte pentru evenimentul tău</Typography>
          <Typography variant="body2" color="text.secondary">
            Alege tipul de eveniment și filtrează furnizorii în funcție de categorie,
            buget și locație. Vezi rapid cine ți se potrivește.
          </Typography>
        </Box>

        <IconButton onClick={() => load()} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Filtre */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            spacing={2}
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "flex-end" }}
          >
            <TextField
              label="Tip eveniment"
              select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Toate</MenuItem>
              {EVENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Categorie"
              select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 200 }}
            >
              {PROVIDER_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Buget minim (RON)"
              type="number"
              value={budgetMin}
              onChange={(e) => {
                setBudgetMin(e.target.value);
                setPage(1);
              }}
              sx={{ maxWidth: 160 }}
            />

            <TextField
              label="Buget maxim (RON)"
              type="number"
              value={budgetMax}
              onChange={(e) => {
                setBudgetMax(e.target.value);
                setPage(1);
              }}
              sx={{ maxWidth: 160 }}
            />

            <TextField
              label="Locație (oraș / zonă)"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
          </Stack>

          <Stack
            spacing={2}
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "flex-end" }}
            sx={{ mt: 2 }}
          >
            <TextField
              label="Căutare text (nume / descriere / locație)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant={onlyGroups ? "contained" : "outlined"}
              startIcon={<GroupWorkIcon />}
              onClick={() => {
                setOnlyGroups((prev) => !prev);
                setPage(1);
              }}
            >
              {onlyGroups ? "Afișează toți furnizorii" : "Doar grupuri de servicii"}
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setEventType("");
                setCategory("");
                setQ("");
                setLocation("");
                setBudgetMin("");
                setBudgetMax("");
                setOnlyGroups(false);
                setPage(1);
              }}
            >
              Reset filtre
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Eroare */}
      {error && (
        <Box sx={{ mb: 2, color: "error.main" }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Grid de oferte */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          Se încarcă ofertele…
        </Box>
      )}

      {!loading && visibleItems.length === 0 && !error && (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          Nu am găsit oferte pentru filtrele curente. Poți relaxa puțin filtrele
          sau schimba tipul de eveniment.
        </Box>
      )}

      {!loading && visibleItems.length > 0 && (
        <>
          <Grid container spacing={2}>
            {visibleItems.map((p) => {
              const priceLabel =
                p.minPrice && p.currency
                  ? `De la ${p.minPrice} ${p.currency}`
                  : p.minPrice
                  ? `De la ${p.minPrice}`
                  : "Preț la cerere";

              const categoryLabel = p.categoryLabel || "Furnizor";

              return (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardHeader
                      avatar={p.isGroup ? <GroupWorkIcon /> : <PersonIcon />}
                      title={
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                          noWrap
                        >
                          {p.name}
                        </Typography>
                      }
                      subheader={categoryLabel}
                    />
                    <CardContent sx={{ pt: 0, flexGrow: 1 }}>
                      {p.city && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <PlaceIcon fontSize="small" />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {p.city}
                          </Typography>
                        </Stack>
                      )}

                      {typeof p.rating === "number" && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Rating
                            size="small"
                            precision={0.5}
                            readOnly
                            value={p.rating}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {p.rating.toFixed(1)}
                          </Typography>
                        </Stack>
                      )}

                      <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                        color="text.secondary"
                        noWrap
                      >
                        {p.shortDescription ||
                          "Furnizor de servicii pentru evenimente."}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {priceLabel}
                      </Typography>

                      {Array.isArray(p.tags) && p.tags.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          rowGap={0.5}
                        >
                          {p.tags.slice(0, 4).map((tag) => (
                            <Chip
                              key={tag}
                              size="small"
                              label={tag}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      )}
                    </CardContent>

                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        pt: 0,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        href={`/${locale}/providers/${p.slug || p.id}`}
                      >
                        Detalii
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              shape="rounded"
            />
          </Box>
        </>
      )}
    </Paper>
  );
}
