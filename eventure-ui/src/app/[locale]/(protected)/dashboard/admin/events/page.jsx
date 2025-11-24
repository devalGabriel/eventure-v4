"use client";

import { useEffect, useMemo, useState } from "react";
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

const STATUS_OPTIONS = [
  "DRAFT",
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "CANCELED",
];

const TYPE_OPTIONS = [
  { value: "wedding", label: "Nuntă" },
  { value: "baptism", label: "Botez" },
  { value: "corporate", label: "Corporate" },
];

function statusColor(status) {
  return (
    {
      DRAFT: "default",
      PLANNING: "info",
      ACTIVE: "success",
      COMPLETED: "secondary",
      CANCELED: "error",
    }[status] || "default"
  );
}

export default function AdminEventsPage() {
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
  const [page, setPage] = useState(0); // 0-based (MUI)
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // filtre trimise la backend
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // filtru doar în UI pentru nume/email client
  const [clientQuery, setClientQuery] = useState("");

  // map clientId (authUserId) -> user info (fullName, email, id UUID etc.)
  const [clientsMap, setClientsMap] = useState({});

  const eventsBasePath = `/${locale}/events`;
  const usersBasePath = `/${locale}/admin/users`;

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      params.set("page", String(page + 1)); // backend 1-based
      params.set("pageSize", String(pageSize));

      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (clientId.trim()) params.set("clientId", clientId.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const r = await fetch(`/api/events?${params.toString()}`, {
        cache: "no-store",
      });

      if (!r.ok) {
        console.error("Failed to load events", await r.text().catch(() => ""));
        setRows([]);
        setTotal(0);
        setClientsMap({});
        return;
      }

      const data = await r.json();
      const events = data.rows || [];
      setRows(events);
      setTotal(data.total || 0);

      // ---- încărcăm clienții asociați (din users-service prin BFF) ----
      const ids = Array.from(
        new Set(
          events
            .map((e) => e.clientId)
            .filter((id) => typeof id === "string" && id.length > 0)
        )
      );

      if (!ids.length) {
        setClientsMap({});
        return;
      }

      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const resp = await fetch(`/api/admin/users/${id}/byAuthId`, {
              cache: "no-store",
            });
            if (!resp.ok) return null;
            const u = await resp.json();
            return [id, u]; // id = authUserId, u = userProfile (cu id UUID)
          } catch (err) {
            console.error("Failed to load user", id, err);
            return null;
          }
        })
      );

      const map = {};
      for (const entry of entries) {
        if (!entry) continue;
        const [id, u] = entry;
        map[id] = u;
      }
      setClientsMap(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, status, type, clientId, dateFrom, dateTo]);

  // filtru suplimentar în UI după nume/email client
  const filteredRows = useMemo(() => {
    const term = clientQuery.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((ev) => {
      const info = clientsMap[ev.clientId];
      if (!info) return false;
      const name = (info.fullName || "").toLowerCase();
      const email = (info.email || "").toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        ev.clientId?.toLowerCase()?.includes(term)
      );
    });
  }, [rows, clientsMap, clientQuery]);

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
          <Typography variant="h5">Evenimente (Admin)</Typography>
          <Typography variant="body2" color="text.secondary">
            Vizualizezi și filtrezi toate evenimentele din platformă și poți
            deschide rapid profilul clientului.
          </Typography>
        </Box>

        <IconButton onClick={() => load()} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Filtre principale (backend) */}
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        sx={{ mb: 2 }}
      >
        <TextField
          label="Caută după nume eveniment"
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
          label="Status"
          select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Toate</MenuItem>
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Tip"
          select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Toate</MenuItem>
          {TYPE_OPTIONS.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Filtre secundare (clientId + date + clientQuery) */}
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        sx={{ mb: 2 }}
      >
        <TextField
          label="Client ID (opțional)"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 200 }}
        />

        <TextField
          label="De la data"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Până la data"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Caută după client (nume / email)"
          value={clientQuery}
          onChange={(e) => setClientQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
        />

        <Button
          variant="outlined"
          onClick={() => {
            setQ("");
            setStatus("");
            setType("");
            setClientId("");
            setDateFrom("");
            setDateTo("");
            setClientQuery("");
            setPage(0);
          }}
        >
          Reset filtre
        </Button>
      </Stack>

      {/* Tabel evenimente */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nume eveniment</TableCell>
            <TableCell>Tip</TableCell>
            <TableCell>Dată</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Acțiuni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRows.map((ev) => {
            const client = clientsMap[ev.clientId];
            const clientName = client?.fullName || "-";
            const clientEmail = client?.email || "-";

            return (
              <TableRow key={ev.id} hover>
                <TableCell sx={{ maxWidth: 140 }} title={ev.id}>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ev.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {ev.name}
                  </Typography>
                </TableCell>
                <TableCell>{ev.type}</TableCell>
                <TableCell>
                  {ev.date
                    ? new Date(ev.date).toLocaleString()
                    : "fără dată"}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{clientName}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {clientEmail}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={ev.status}
                    color={statusColor(ev.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      component={Link}
                      href={`${eventsBasePath}/${ev.id}`}
                      size="small"
                      variant="outlined"
                    >
                      Deschide
                    </Button>
                    {client && (
                      <Button
                        component={Link}
                        href={`${usersBasePath}/${client.id}`} // 👈 UUID din userProfile
                        size="small"
                        variant="text"
                      >
                        Profil client
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}

          {!loading && filteredRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  Nu s-au găsit evenimente pentru filtrele curente.
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
