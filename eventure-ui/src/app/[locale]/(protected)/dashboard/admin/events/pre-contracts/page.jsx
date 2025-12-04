"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "Toate" },
  { value: "no_activity", label: "Fără activitate" },
  { value: "invitations_sent", label: "Invitații trimise" },
  { value: "in_negotiation", label: "În negociere" },
  { value: "providers_selected", label: "Furnizori selectați" },
];

function StatusChip({ value }) {
  const map = {
    no_activity: { label: "Fără activitate", color: "default" },
    invitations_sent: { label: "Invitații trimise", color: "info" },
    in_negotiation: { label: "În negociere", color: "warning" },
    providers_selected: { label: "Furnizori selectați", color: "success" },
  };
  const cfg = map[value] || { label: value || "N/A", color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

export default function AdminPreContractsPage() {
  const { locale } = useParams();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // filtre simple
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (statusFilter) params.set("status", statusFilter);
      // client/provider îi filtrăm deocamdată în UI
      const qs = params.toString();
      const r = await fetch(
        `/api/admin/events/pre-contract${qs ? `?${qs}` : ""}`,
        { cache: "no-store" }
      );
      if (!r.ok) {
        console.error("Failed pre-contract admin load", await r.text());
        setRows([]);
        return;
      }
      const d = await r.json();
      setRows(Array.isArray(d?.rows) ? d.rows : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, statusFilter]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (
        clientFilter &&
        !String(r.clientId || "")
          .toLowerCase()
          .includes(clientFilter.toLowerCase())
      ) {
        return false;
      }
      if (providerFilter) {
        const list = Array.isArray(r.providersInvolved)
          ? r.providersInvolved
          : [];
        const match = list.some((pid) =>
          String(pid).toLowerCase().includes(providerFilter.toLowerCase())
        );
        if (!match) return false;
      }
      return true;
    });
  }, [rows, clientFilter, providerFilter]);

  const summary = useMemo(() => {
    const base = { total: rows.length, byStatus: {} };
    (rows || []).forEach((r) => {
      const key = r.preContractStatus || "";
      base.byStatus[key] = (base.byStatus[key] || 0) + 1;
    });
    return base;
  }, [rows]);

  const summaryChips = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        ...opt,
        count:
          opt.value === "" ? summary.total : summary.byStatus[opt.value] || 0,
      })),
    [summary]
  );

  const eventsBasePath = `/${locale}/events`;
  const usersBasePath = `/${locale}/admin/users`;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Pre-contract overview
      </Typography>
      {/* sumar pipeline */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {summary.total} evenimente în pipeline
          </Typography>
          {summaryChips.map((opt) => (
            <Chip
              key={opt.value || "all"}
              label={
                opt.value
                  ? `${opt.label} (${opt.count})`
                  : `${opt.label} (${summary.total})`
              }
              size="small"
              variant={
                statusFilter === opt.value || (!statusFilter && !opt.value)
                  ? "filled"
                  : "outlined"
              }
              color={
                statusFilter === opt.value || (!statusFilter && !opt.value)
                  ? "primary"
                  : "default"
              }
              onClick={() => setStatusFilter(opt.value)}
            />
          ))}
        </Stack>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Toolbar sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="De la data"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <TextField
            label="Până la data"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <TextField
            label="Filtru client (ID)"
            size="small"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />
          <TextField
            label="Filtru provider (ID)"
            size="small"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Toolbar>
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Event</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Locație</TableCell>
              <TableCell align="right">Invitații</TableCell>
              <TableCell align="right">Oferte</TableCell>
              <TableCell align="right">Shortlisted</TableCell>
              <TableCell align="right">Selected</TableCell>
              <TableCell align="right">Pre-contract</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary">
                    {loading
                      ? "Se încarcă..."
                      : "Nu există evenimente cu activitate pre-contract."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row) => (
              <TableRow key={row.eventId}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Link href={`${eventsBasePath}/${row.eventId}`}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.name}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {row.eventId}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Link href={`${usersBasePath}/${row.clientId}`}>
                      <Typography variant="body2">
                        {row.clientId || "-"}
                      </Typography>
                    </Link>
                  </Stack>
                </TableCell>
                <TableCell>
                  {row.date
                    ? new Date(row.date).toLocaleDateString(locale || "ro")
                    : "-"}
                </TableCell>
                <TableCell>{row.location || "-"}</TableCell>
                <TableCell align="right">{row.invitationsCount || 0}</TableCell>
                <TableCell align="right">{row.offersCount || 0}</TableCell>
                <TableCell align="right">
                  {row.assignments?.SHORTLISTED || 0}
                </TableCell>
                <TableCell align="right">
                  {row.assignments?.SELECTED || 0}
                </TableCell>
                <TableCell>
                  <StatusChip value={row.preContractStatus} />
                  {row.isAtRisk && (
                    <Chip
                      label="At risk"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
