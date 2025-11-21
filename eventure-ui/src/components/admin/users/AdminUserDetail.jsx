// src/components/admin/users/AdminUserDetail.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Chip,
  Tabs,
  Tab,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";
import {
  adminGetUser,
  adminGetUserAudit,
  adminUpdateUser,
  adminUpdateUserRoles,
} from "@/lib/api/usersClient";

const roleOptions = ["admin", "client", "provider"];

export default function AdminUserDetail({ userId }) {
  const pathname = usePathname();
  const { locale } = useMemo(
    () => extractLocaleAndPath(pathname),
    [pathname]
  );

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    locale: "",
    isActive: true,
  });
  const [roleValue, setRoleValue] = useState("");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [auditLoading, setAuditLoading] = useState(false);
  const [audit, setAudit] = useState({ items: [], total: 0 });

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await adminGetUser(userId);
      setUser(u);
      setForm({
        fullName: u.fullName || "",
        email: u.email || "",
        phone: u.phone || "",
        locale: u.locale || "ro-RO",
        isActive: u.isActive ?? true,
      });
      setRoleValue(u.role || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Nu s-a putut încărca utilizatorul");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFormChange = (field) => (e) => {
    const value =
      field === "isActive" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try{
      const payload = {};

      if (form.fullName !== (user.fullName || "")) {
        payload.fullName = form.fullName;
      }
      if (form.email !== (user.email || "")) {
        payload.email = form.email;
      }
      if (form.phone !== (user.phone || "")) {
        payload.phone = form.phone;
      }
      if (form.locale !== (user.locale || "")) {
        payload.locale = form.locale;
      }
      if (typeof form.isActive === "boolean" && form.isActive !== user.isActive) {
        payload.isActive = form.isActive;
      }

      let updated = user;
      if (Object.keys(payload).length > 0) {
        updated = await adminUpdateUser(user.id, payload);
      }

      setUser(updated);
      setForm((prev) => ({
        ...prev,
        fullName: updated.fullName || "",
        email: updated.email || "",
        phone: updated.phone || "",
        locale: updated.locale || "ro-RO",
        isActive: updated.isActive ?? true,
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || "Nu s-au putut salva modificările");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (!user) return;
    setRoleValue(newRole);
    try {
      const currentRoles = user.roles || [];
      const target = newRole.toUpperCase();
      const add = [target];
      const remove = currentRoles.filter((r) => r !== target);

      const updated = await adminUpdateUserRoles(user.id, { add, remove });
      setUser(updated);
      setRoleValue(updated.role || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Nu s-a putut actualiza rolul");
    }
  };

  const loadAudit = async () => {
    if (!user) return;
    setAuditLoading(true);
    setError(null);
    try {
      const res = await adminGetUserAudit(user.id, {
        page: 1,
        pageSize: 50,
      });
      setAudit({
        items: res.items || [],
        total: res.total || 0,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Nu s-a putut încărca auditul");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleTabChange = (e, value) => {
    setTab(value);
    if (value === 1 && audit.items.length === 0) {
      // tab Audit
      loadAudit();
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Se încarcă utilizatorul...</Typography>
      </Paper>
    );
  }

  if (!user) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">
          Utilizatorul nu a fost găsit.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">Detalii utilizator</Typography>
          <Typography variant="body2" color="text.secondary">
            ID (profil users-service): {user.id}
          </Typography>
          {user.authUserId && (
            <Typography variant="body2" color="text.secondary">
              authUserId (auth-service): {user.authUserId}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            Salvează
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        aria-label="tabs user admin"
      >
        <Tab label="Profil" />
        <Tab label="Audit" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {/* PROFIL */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Nume complet"
              fullWidth
              value={form.fullName}
              onChange={handleFormChange("fullName")}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={handleFormChange("email")}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={handleFormChange("isActive")}
                />
              }
              label="Cont activ"
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* ROLURI */}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Roluri & permisiuni
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
            {(user.roles || []).map((r) => (
              <Chip key={r} label={r} size="small" />
            ))}
            {(!user.roles || user.roles.length === 0) && (
              <Typography variant="body2" color="text.secondary">
                Fără roluri definite în users-service.
              </Typography>
            )}
          </Stack>

          <TextField
            select
            label="Rol principal"
            fullWidth
            value={roleValue}
            onChange={handleRoleChange}
            helperText="Schimbarea rolului principal actualizează rolurile în users-service și auth-service."
          >
            <MenuItem value="">(nesetat)</MenuItem>
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {auditLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Audit modificări profil
          </Typography>
          {audit.items.length === 0 && !auditLoading ? (
            <Typography variant="body2" color="text.secondary">
              Nu există înregistrări de audit pentru acest utilizator.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>La</TableCell>
                  <TableCell>Eveniment</TableCell>
                  <TableCell>Chei schimbate</TableCell>
                  <TableCell>Before → After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {audit.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.at
                        ? new Date(row.at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{row.event}</TableCell>
                    <TableCell>
                      {Array.isArray(row.changedKeys)
                        ? row.changedKeys.join(", ")
                        : JSON.stringify(row.changedKeys)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {JSON.stringify(row.before)} {" → "}{" "}
                        {JSON.stringify(row.after)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}
    </Paper>
  );
}
