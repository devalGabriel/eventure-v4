// eventure-ui/src/app/[locale]/(protected)/admin/providers/applications/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RejectDialog from "@/components/admin/providers/RejectDialog";
import RefreshIcon from "@mui/icons-material/Refresh";

const statusColorMap = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export default function AdminProviderApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [search, setSearch] = useState("");

  const handleRejectClick = (app) => {
    setSelectedApp(app);
    setRejectOpen(true);
  };

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({
        status,
        page: String(page),
        pageSize: String(pageSize),
      }).toString();
      const r = await fetch(`/api/admin/provider-applications?${qs}`, {
        cache: "no-store",
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || "failed");
      const j = JSON.parse(t);
      setRows(j.rows || []);
      setTotal(j.total || 0);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function decide(id, decision) {
    const r = await fetch(`/api/admin/provider-applications/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }), // 'APPROVE' sau 'REJECT'
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      alert("Decision failed: " + txt);
      return;
    }
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const applicant = r.applicant || {};
      const name =
        applicant.name ||
        applicant.displayName ||
        applicant.email ||
        r.userId ||
        "";
      const email = applicant.email || "";
      const note = r.note || "";
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        note.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5">Aplicații furnizor</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} aplicații înregistrate pentru statusul {status}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label="Caută (nume, email, notă)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TextField
            size="small"
            select
            SelectProps={{ native: true }}
            label="Status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </TextField>
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {loading && <LinearProgress />}
      {err && <Alert severity="error">{String(err)}</Alert>}

      <Stack spacing={1}>
        {filteredRows.map((r) => {
          const applicant = r.applicant || {};
          const labelName =
            applicant.name ||
            applicant.email ||
            r.userId ||
            "Utilizator necunoscut";
          const labelEmail = applicant.email || null;

          return (
            <Card key={r.id}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1">{labelName}</Typography>
                    {labelEmail && (
                      <Typography variant="body2" color="text.secondary">
                        {labelEmail}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(r.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={r.status}
                      color={statusColorMap[r.status] || "default"}
                    />
                    {r.status === "PENDING" && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() => decide(r.id, "APPROVE")}
                        >
                          Aprobă
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleRejectClick(r)}
                        >
                          Respinge
                        </Button>
                      </>
                    )}
                  </Stack>
                </Stack>

                {r.note && (
                  <Typography sx={{ mt: 1 }} variant="body2">
                    Notă aplicant: {r.note}
                  </Typography>
                )}

                <RejectDialog
                  open={rejectOpen}
                  onClose={() => setRejectOpen(false)}
                  application={selectedApp}
                  locale={"ro"}
                  onDone={() => {
                    setRejectOpen(false);
                    load();
                  }}
                />
              </CardContent>
            </Card>
          );
        })}

        {!filteredRows.length && !loading && (
          <Box sx={{ p: 2, color: "text.secondary" }}>
            Nu sunt aplicații pentru filtrul curent.
          </Box>
        )}
      </Stack>

      <Stack direction="row" justifyContent="center">
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, p) => setPage(p)}
        />
      </Stack>
    </Stack>
  );
}
