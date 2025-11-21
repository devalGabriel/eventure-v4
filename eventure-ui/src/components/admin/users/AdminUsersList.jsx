// src/components/admin/users/AdminUsersList.jsx
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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { usePathname, useRouter } from "next/navigation";
import { adminListUsers, adminUpdateUser } from "@/lib/api/usersClient";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const roleOptions = ["ADMIN", "CLIENT", "PROVIDER"];

const roleColorMap = {
  ADMIN: "secondary",
  CLIENT: "default",
  PROVIDER: "primary",
};

export default function AdminUsersList() {
  const [filters, setFilters] = useState({
    role: "",
    q: "",
  });
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [rowUpdatingId, setRowUpdatingId] = useState(null);

  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useMemo(
    () => extractLocaleAndPath(pathname),
    [pathname]
  );

  const load = async (overrides = {}) => {
    const effective = { ...filters, ...overrides };
    setLoading(true);
    setError(null);
    try {
      const res = await adminListUsers({
        role: effective.role || undefined,
        q: effective.q || undefined,
        page: 1,
        pageSize: 50,
      });
      setRows(res.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la încărcare utilizatori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleResetFilters = () => {
    const base = { role: "", q: "" };
    setFilters(base);
    load(base);
  };

  const countsByRole = useMemo(() => {
    const acc = { ADMIN: 0, CLIENT: 0, PROVIDER: 0 };
    for (const u of rows) {
      (u.roles || []).forEach((r) => {
        const key = String(r).toUpperCase();
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
          acc[key] += 1;
        }
      });
    }
    return acc;
  }, [rows]);

  const toggleActive = async (e, userId, nextActive) => {
    e.stopPropagation();
    try {
      setRowUpdatingId(userId);
      const updated = await adminUpdateUser(userId, { isActive: nextActive });
      setRows((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: updated.isActive } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut actualiza statusul: " + (err.message || String(err)));
    } finally {
      setRowUpdatingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Lista utilizatori</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {rows.length} înregistrări vizibile
          </Typography>
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
        <Grid item xs={12} md={4}>
          <TextField
            label="Caută (nume, email...)"
            fullWidth
            margin="normal"
            value={filters.q}
            onChange={handleChange("q")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="Rol"
            fullWidth
            margin="normal"
            value={filters.role}
            onChange={handleChange("role")}
          >
            <MenuItem value="">(toate)</MenuItem>
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r.toLowerCase()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          item
          xs={12}
          md={4}
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

      {/* QUICK FILTERS PE ROL */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {roleOptions.map((r) => {
          const selected = filters.role === r;
          return (
            <Chip
              key={r}
              label={`${r.toLowerCase()} (${countsByRole[r] || 0})`}
              size="small"
              variant={selected ? "filled" : "outlined"}
              color={roleColorMap[r] || "default"}
              onClick={() => {
                const newRole = selected ? "" : r;
                setFilters((prev) => ({ ...prev, role: newRole }));
                load({ role: newRole });
              }}
              sx={{ mb: 1, textTransform: "capitalize" }}
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

      {/* TABEL USERS */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Utilizator</TableCell>
            <TableCell>Roluri</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Creat la</TableCell>
            <TableCell>Acțiuni rapide</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((u) => {
            const updating = rowUpdatingId === u.id;
            const active = u.isActive ?? true;

            return (
              <TableRow
                key={u.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  router.push(`/${locale}/admin/users/${u.id}`)
                }
              >
                <TableCell>
                  <Stack spacing={0.3}>
                    <Typography variant="subtitle2">
                      {u.fullName || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.email}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      ID: {u.id}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                  >
                    {u.roles?.length
                      ? u.roles.map((r) => (
                          <Chip
                            key={r}
                            size="small"
                            label={r}
                            color={roleColorMap[r] || "default"}
                          />
                        ))
                      : (
                        <Chip
                          size="small"
                          label="fără rol"
                          variant="outlined"
                        />
                        )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={active ? "Activ" : "Inactiv"}
                    color={active ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      color={active ? "warning" : "success"}
                      disabled={updating}
                      onClick={(e) => toggleActive(e, u.id, !active)}
                    >
                      {active ? "Dezactivează" : "Activează"}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/admin/users/${u.id}`);
                      }}
                    >
                      Detalii
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}

          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  Nu s-au găsit utilizatori pentru filtrele curente.
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
