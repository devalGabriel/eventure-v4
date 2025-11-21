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
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  adminListUsers,
  adminUpdateUserRoles,
} from "@/lib/api/usersClient";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const roleOptions = ["ADMIN", "CLIENT", "PROVIDER"];

const roleColorMap = {
  ADMIN: "secondary",
  CLIENT: "default",
  PROVIDER: "primary",
};

function getPrimaryRole(u) {
  const roles = Array.isArray(u.roles) ? u.roles : [];
  if (!roles.length) return null;
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("PROVIDER")) return "PROVIDER";
  if (roles.includes("CLIENT")) return "CLIENT";
  return roles[0];
}

export default function AdminUsersList() {
  const [filters, setFilters] = useState({ role: "", q: "" });
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [rowUpdatingId, setRowUpdatingId] = useState(null);

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
      const r = getPrimaryRole(u);
      if (r && Object.prototype.hasOwnProperty.call(acc, r)) {
        acc[r] += 1;
      }
    }
    return acc;
  }, [rows]);

  const quickChangeRole = async (e, userId, targetRole) => {
    e.stopPropagation();

    let payload;
    if (targetRole === "ADMIN") {
      payload = { add: ["ADMIN"], remove: [] };
    } else if (targetRole === "PROVIDER") {
      // provider rămâne și client by default
      payload = { add: ["PROVIDER", "CLIENT"], remove: ["ADMIN"] };
    } else if (targetRole === "CLIENT") {
      payload = { add: ["CLIENT"], remove: ["ADMIN", "PROVIDER"] };
    } else {
      return;
    }

    try {
      setRowUpdatingId(userId);
      const updated = await adminUpdateUserRoles(userId, payload);
      setRows((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, roles: updated.roles || u.roles } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        "Nu s-a putut actualiza rolul: " + (err.message || String(err))
      );
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
            label="Rol principal"
            fullWidth
            margin="normal"
            value={filters.role}
            onChange={handleChange("role")}
          >
            <MenuItem value="">(toate)</MenuItem>
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
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
              label={`${r} (${countsByRole[r] || 0})`}
              size="small"
              variant={selected ? "filled" : "outlined"}
              color={roleColorMap[r] || "default"}
              onClick={() => {
                const newRole = selected ? "" : r;
                setFilters((prev) => ({ ...prev, role: newRole }));
                load({ role: newRole });
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

      {/* TABEL USERS */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nume</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Roluri</TableCell>
            <TableCell>Creat la</TableCell>
            <TableCell>Acțiuni rapide</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((u) => {
            const updating = rowUpdatingId === u.id;
            const primaryRole = getPrimaryRole(u);
            return (
              <TableRow key={u.id} hover sx={{ cursor: "default" }}>
                <TableCell>
                  <Link
                    href={`/${locale}/admin/users/${u.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        color: "primary.main",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {u.fullName || "—"}
                    </Box>
                  </Link>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {Array.isArray(u.roles) && u.roles.length ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {u.roles.map((r) => (
                        <Chip
                          key={r}
                          size="small"
                          label={r}
                          color={roleColorMap[r] || "default"}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Chip size="small" label="Fără rol" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {roleOptions
                      .filter((r) => r !== primaryRole)
                      .map((r) => (
                        <Button
                          key={r}
                          size="small"
                          variant="outlined"
                          disabled={updating}
                          onClick={(e) => quickChangeRole(e, u.id, r)}
                        >
                          Set {r.toLowerCase()}
                        </Button>
                      ))}
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
