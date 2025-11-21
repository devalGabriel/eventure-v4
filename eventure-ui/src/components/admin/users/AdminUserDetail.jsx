"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";
import {
  adminGetUser,
  adminUpdateUser,
  adminGetUserAudit,
  adminForceLogoutUser,
} from "@/lib/api/usersClient";

export default function AdminUserDetail({ userId }) {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    locale: "",
    isActive: true,
  });

  // AUDIT
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditItems, setAuditItems] = useState([]);
  const [auditError, setAuditError] = useState(null);

  const roleChips = useMemo(
    () =>
      (user?.roles || []).map((r) => ({
        label: r,
        color:
          r === "ADMIN"
            ? "secondary"
            : r === "PROVIDER"
            ? "primary"
            : "default",
      })),
    [user]
  );

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetUser(userId);
      setUser(data);

      setForm({
        fullName: data.fullName || data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        locale: data.locale || "ro-RO",
        isActive: typeof data.isActive === "boolean" ? data.isActive : true,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la încărcarea utilizatorului");
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    if (auditLoaded) return; // nu reîncărcăm inutil
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await adminGetUserAudit(userId);
      setAuditItems(res.items || []);
      setAuditLoaded(true);
    } catch (err) {
      console.error(err);
      setAuditError(err.message || "Eroare la încărcarea istoricului");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  // când schimbăm tab-ul pe "audit", încărcăm istoricul
  const handleTabChange = (e, newVal) => {
    setTab(newVal);
    if (newVal === "audit") {
      loadAudit();
    }
  };

  const handleFormChange = (field) => (e) => {
    const value =
      field === "isActive" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        locale: form.locale || undefined,
        isActive: form.isActive,
      };

      const updated = await adminUpdateUser(userId, payload);
      setUser(updated);

      // eventual reload audit (dacă e deja deschis tab-ul)
      if (auditLoaded) {
        setAuditLoaded(false);
        loadAudit();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Nu s-a putut salva modificările");
    } finally {
      setSaving(false);
    }
  };

  const handleForceLogout = async () => {
    try {
      await adminForceLogoutUser(userId);
      alert("Toate sesiunile utilizatorului au fost invalidate (force logout).");
    } catch (err) {
      console.error(err);
      alert(
        "Nu s-a putut face force logout: " + (err.message || String(err))
      );
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
        spacing={2}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Detalii utilizator
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              {user.email} • ID profil: {user.id}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {(roleChips || []).map((r) => (
            <Chip
              key={r.label}
              size="small"
              label={r.label}
              color={r.color}
            />
          ))}
          <Button
            variant="outlined"
            color="error"
            onClick={handleForceLogout}
          >
            Force logout
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
      >
        <Tab value="profile" label="Profil" />
        <Tab value="audit" label="Istoric modificări" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* TAB PROFIL */}
      {tab === "profile" && (
        <Box>
          <Stack spacing={2}>
            <TextField
              label="Nume complet"
              fullWidth
              value={form.fullName}
              onChange={handleFormChange("fullName")}
            />
            <TextField
              label="Email"
              fullWidth
              value={form.email}
              onChange={handleFormChange("email")}
            />
            <TextField
              label="Telefon"
              fullWidth
              value={form.phone}
              onChange={handleFormChange("phone")}
            />
            <TextField
              label="Locale"
              fullWidth
              value={form.locale}
              onChange={handleFormChange("locale")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={handleFormChange("isActive")}
                />
              }
              label="Cont activ"
            />

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || loading}
              >
                Salvează modificările
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* TAB AUDIT */}
      {tab === "audit" && (
        <Box>
          {auditLoading && <LinearProgress sx={{ mb: 2 }} />}
          {auditError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {auditError}
            </Typography>
          )}

          {!auditLoading && auditItems.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Nu există modificări înregistrate pentru acest utilizator.
            </Typography>
          )}

          <Stack spacing={2}>
            {auditItems.map((ev) => (
              <Box key={ev.id}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="subtitle2">
                    {ev.event}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ev.at
                      ? dayjs(ev.at).format("DD.MM.YYYY HH:mm")
                      : ""}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Chei modificate:{" "}
                  {Array.isArray(ev.changedKeys)
                    ? ev.changedKeys.join(", ")
                    : JSON.stringify(ev.changedKeys)}
                </Typography>
                {ev.before && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    <strong>Înainte:</strong>{" "}
                    {JSON.stringify(ev.before)}
                  </Typography>
                )}
                {ev.after && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block" }}
                  >
                    <strong>După:</strong>{" "}
                    {JSON.stringify(ev.after)}
                  </Typography>
                )}
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
