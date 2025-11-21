"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import { usePathname, useRouter } from "next/navigation";
import {
  adminListProviders,
  adminUpdateProvider,
} from "@/lib/api/providersClient";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const statusOptions = [
  "INCOMPLETE",
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "DELISTED",
];

const statusColorMap = {
  INCOMPLETE: "default",
  PENDING_REVIEW: "warning",
  ACTIVE: "success",
  SUSPENDED: "error",
  DELISTED: "default",
};

const sortOptions = [
  { value: "createdAtDesc", label: "Cele mai noi" },
  { value: "createdAtAsc", label: "Cele mai vechi" },
  { value: "nameAsc", label: "Nume A–Z" },
  { value: "nameDesc", label: "Nume Z–A" },
  { value: "status", label: "Status" },
];

export default function AdminProvidersList() {
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    q: "",
    watchlistOnly: false,
  });
  const [sortBy, setSortBy] = useState("createdAtDesc");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [rowUpdatingId, setRowUpdatingId] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  const { locale } = useMemo(
    () => extractLocaleAndPath(pathname),
    [pathname]
  );

  const load = async (overrides = {}) => {
    const effective = { ...filters, ...overrides };

    setLoading(true);
    setError(null);
    try {
      const res = await adminListProviders({
        status: effective.status || undefined,
        city: effective.city || undefined,
        q: effective.q || undefined,
        watchlistOnly: effective.watchlistOnly ? "true" : undefined,
        page: 1,
        pageSize: 50,
      });

      setItems(res.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la încărcare provideri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (e) => {
    const value =
      field === "watchlistOnly" ? e.target.checked : e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    const base = { status: "", city: "", q: "", watchlistOnly: false };
    setFilters(base);
    load(base);
  };

  // Elemente vizibile după filtrul "Doar watchlist"
  const visibleItems = useMemo(
    () =>
      filters.watchlistOnly
        ? items.filter((p) => p.isWatchlisted)
        : items,
    [items, filters.watchlistOnly]
  );

  // Count per status pe lista vizibilă
  const countsByStatus = useMemo(() => {
    const initial = {};
    statusOptions.forEach((st) => {
      initial[st] = 0;
    });
    for (const p of visibleItems) {
      if (p.status && Object.prototype.hasOwnProperty.call(initial, p.status)) {
        initial[p.status] += 1;
      }
    }
    return initial;
  }, [visibleItems]);

  const watchlistedCount = useMemo(
    () => visibleItems.filter((p) => p.isWatchlisted).length,
    [visibleItems]
  );

  // Sortare în memorie
  const sortedItems = useMemo(() => {
    const arr = [...visibleItems];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "createdAtAsc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "createdAtDesc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "nameAsc": {
          const na = (a.displayName || a.legalName || "").toLowerCase();
          const nb = (b.displayName || b.legalName || "").toLowerCase();
          return na.localeCompare(nb);
        }
        case "nameDesc": {
          const na = (a.displayName || a.legalName || "").toLowerCase();
          const nb = (b.displayName || b.legalName || "").toLowerCase();
          return nb.localeCompare(na);
        }
        case "status": {
          const sa = a.status || "";
          const sb = b.status || "";
          if (sa === sb) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return sa.localeCompare(sb);
        }
        default:
          return 0;
      }
    });
    return arr;
  }, [visibleItems, sortBy]);

  const computeProfileCompletion = (p) => {
    let score = 0;
    const total = 5;

    const hasIdentity = !!(p.displayName || p.legalName);
    const hasTaxId = !!p.taxId;
    const hasLocation = !!p.city || !!p.address;
    const hasServices = (p._count?.offers ?? 0) > 0;
    const hasCategories =
      Array.isArray(p.categories) && p.categories.length > 0;

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
  };

  const quickChangeStatus = async (e, providerId, newStatus) => {
    e.stopPropagation();
    try {
      setRowUpdatingId(providerId);
      await adminUpdateProvider(providerId, { status: newStatus });
      setItems((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, status: newStatus } : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut actualiza statusul: " + (err.message || String(err)));
    } finally {
      setRowUpdatingId(null);
    }
  };

  const toggleWatchlist = async (e, provider) => {
    e.stopPropagation();
    try {
      setRowUpdatingId(provider.id);
      const updated = await adminUpdateProvider(provider.id, {
        isWatchlisted: !provider.isWatchlisted,
      });
      setItems((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error(err);
      alert(
        "Nu s-a putut actualiza watchlist-ul: " +
          (err.message || String(err))
      );
    } finally {
      setRowUpdatingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* HEADER + META */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Lista provideri</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack spacing={0.2}>
            <Typography variant="body2" color="text.secondary">
              {sortedItems.length} înregistrări vizibile
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Watchlist în această listă: {watchlistedCount}
            </Typography>
          </Stack>

          <TextField
            select
            size="small"
            label="Sortare"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {sortOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            sx={{ ml: 1 }}
            control={
              <Switch
                size="small"
                checked={filters.watchlistOnly}
                onChange={handleChange("watchlistOnly")}
              />
            }
            label="Doar watchlist"
          />
          <Button size="small" onClick={handleResetFilters} disabled={loading}>
            Reset filtre
          </Button>
          <IconButton onClick={() => load()} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* FILTRE */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Caută (nume, email, CUI...)"
            fullWidth
            margin="normal"
            value={filters.q}
            onChange={handleChange("q")}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Oraș"
            fullWidth
            margin="normal"
            value={filters.city}
            onChange={handleChange("city")}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Status profil"
            fullWidth
            margin="normal"
            value={filters.status}
            onChange={handleChange("status")}
          >
            <MenuItem value="">(toate)</MenuItem>
            {statusOptions.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          item
          xs={12}
          md={3}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Button
            variant="contained"
            onClick={() => load()}
            disabled={loading}
            fullWidth
          >
            Filtrează
          </Button>
        </Grid>
      </Grid>

      {/* STATUS QUICK FILTERS */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {statusOptions.map((st) => {
          const selected = filters.status === st;
          return (
            <Chip
              key={st}
              label={`${st} (${countsByStatus[st] || 0})`}
              size="small"
              variant={selected ? "filled" : "outlined"}
              color={statusColorMap[st] || "default"}
              onClick={() => {
                const newStatus = selected ? "" : st;
                setFilters((prev) => ({ ...prev, status: newStatus }));
                load({ status: newStatus });
              }}
              sx={{ mb: 1 }}
            />
          );
        })}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* TABEL PROVIDERI */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>WL</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Nume afișat</TableCell>
            <TableCell>Oraș</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Profil</TableCell>
            <TableCell>Servicii</TableCell>
            <TableCell>Pachete</TableCell>
            <TableCell>Creat la</TableCell>
            <TableCell>Acțiuni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((p) => {
            const { percent, label } = computeProfileCompletion(p);
            const offersCount = p._count?.offers ?? 0;
            const packagesCount = p._count?.packages ?? 0;
            const updating = rowUpdatingId === p.id;

            return (
              <TableRow
                key={p.id}
                hover
                onClick={() =>
                  router.push(`/${locale}/admin/providers/${p.id}`)
                }
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox">
                  <Tooltip
                    title={
                      p.isWatchlisted
                        ? "Elimină din watchlist"
                        : "Adaugă în watchlist"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={(e) => toggleWatchlist(e, p)}
                        disabled={updating}
                      >
                        {p.isWatchlisted ? (
                          <StarIcon fontSize="small" color="warning" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.displayName || "—"}</TableCell>
                <TableCell>{p.city || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={p.status || "—"}
                    color={statusColorMap[p.status] || "default"}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Chip
                      size="small"
                      label={`${label} (${percent}%)`}
                      variant="outlined"
                    />
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {offersCount === 0 && (
                        <Chip
                          size="small"
                          label="Fără servicii"
                          variant="outlined"
                        />
                      )}
                      {packagesCount === 0 && (
                        <Chip
                          size="small"
                          label="Fără pachete"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell>{offersCount}</TableCell>
                <TableCell>{packagesCount}</TableCell>
                <TableCell>{formatDate(p.createdAt)}</TableCell>
                <TableCell>
                  <Stack spacing={0.5} direction="row" flexWrap="wrap">
                    {p.status !== "ACTIVE" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        disabled={updating}
                        onClick={(e) =>
                          quickChangeStatus(e, p.id, "ACTIVE")
                        }
                      >
                        Activează
                      </Button>
                    )}
                    {p.status === "ACTIVE" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={updating}
                        onClick={(e) =>
                          quickChangeStatus(e, p.id, "SUSPENDED")
                        }
                      >
                        Suspendă
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}

          {!loading && sortedItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={10}>
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  Nu s-au găsit provideri pentru filtrele curente.
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
