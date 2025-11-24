"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const ACTIVE_OPTIONS = [
  { value: "", label: "Toți" },
  { value: "true", label: "Activi" },
  { value: "false", label: "Inactivi" },
];

export default function AdminClientsPage() {
  const pathname = usePathname();
  const { locale } = extractLocaleAndPath(pathname);

    const searchParams = useSearchParams();
  
  // inițializează clientId din query la primul render
  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid && !clientId) {
      setClientId(cid);
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-based pentru MUI
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // filtre trimise la backend
  const [q, setQ] = useState(""); // nume/email/telefon
  const [isActiveFilter, setIsActiveFilter] = useState("");

  const usersBasePath = `/${locale}/dashboard/admin/users`;
  const eventsBasePath = `/${locale}/dashboard/admin/events`;

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1)); // backend 1-based
      params.set("pageSize", String(pageSize));
      params.set("role", "CLIENT"); // siguranta, oricum e setat și în BFF

      if (q.trim()) params.set("q", q.trim());
      if (isActiveFilter) params.set("isActive", isActiveFilter);

      const r = await fetch(`/api/admin/clients?${params.toString()}`, {
        cache: "no-store",
      });

      if (!r.ok) {
        console.error(
          "Failed to load clients",
          await r.text().catch(() => "")
        );
        setRows([]);
        setTotal(0);
        return;
      }

      const data = await r.json();
      // 🔧 users-service întoarce { items, total, page, pageSize }
      const clients = data.items || data.rows || [];
      setRows(clients);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, isActiveFilter]);

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">Supervizare clienți</Typography>
          <Typography variant="body2" color="text.secondary">
            Administrezi și monitorizezi clienții platformei. De aici poți
            deschide profilul userului sau evenimentele asociate.
          </Typography>
        </Box>

        <IconButton onClick={() => load()} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Filtre */}
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        sx={{ mb: 2 }}
      >
        <TextField
          label="Caută după nume / email / telefon"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
        />

        <TextField
          label="Stare cont"
          select
          value={isActiveFilter}
          onChange={(e) => {
            setIsActiveFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 180 }}
        >
          {ACTIVE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="outlined"
          onClick={() => {
            setQ("");
            setIsActiveFilter("");
            setPage(0);
          }}
        >
          Reset filtre
        </Button>
      </Stack>

      {/* Tabel clienți */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nume</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Telefon</TableCell>
            <TableCell>Locale</TableCell>
            <TableCell>Stare</TableCell>
            <TableCell>Roluri</TableCell>
            <TableCell align="right">Acțiuni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((u) => {
            const roles = Array.isArray(u.roles) ? u.roles : [];
            const isActive = !!u.isActive;

            return (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {u.fullName || "(fără nume)"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.email || "-"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.phone || "-"}</Typography>
                </TableCell>
                <TableCell>{u.locale || "-"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={isActive ? "Activ" : "Inactiv"}
                    color={isActive ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {roles.length === 0 && (
                      <Chip size="small" label="(fără roluri)" variant="outlined" />
                    )}
                    {roles.map((r) => (
                      <Chip
                        key={r}
                        size="small"
                        label={r}
                        color={r === "CLIENT" ? "primary" : "default"}
                        variant={r === "CLIENT" ? "filled" : "outlined"}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {/* Profil user (UUID din u.id) */}
                    <Button
                      component={Link}
                      href={`${usersBasePath}/${u.id}`}
                      size="small"
                      variant="outlined"
                    >
                      Profil
                    </Button>

                    {/* Evenimente client: filtrăm după authUserId ca și clientId în events-service */}
                    {u.authUserId && (
                      <Button
                        component={Link}
                        href={`${eventsBasePath}?clientId=${encodeURIComponent(
                          u.authUserId
                        )}`}
                        size="small"
                        variant="text"
                      >
                        Evenimente
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}

          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  Nu s-au găsit clienți pentru filtrele curente.
                </Box>
              </TableCell>
            </TableRow>
          )}

          {loading && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  Se încarcă…
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50]}
      />
    </Paper>
  );
}
