// src/components/profile/ProfileForm.jsx
"use client";
import { useState } from "react";
import { TextField, Button, Stack, Alert } from "@mui/material";
import { useNotify } from "@/components/providers/NotificationProvider";
import { updateMe } from "@/lib/auth"; // 👈 folosește endpoint-ul /v1/users/me

export default function ProfileForm({ name, email }) {
  const [v, setV] = useState({ name: name || "", email: email || "" });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const { notify } = useNotify();

  function setField(k, val) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function save() {
    try {
      setErr("");
      setSaved(false);
      await updateMe({ name: v.name, email: v.email }); // 👈
      setSaved(true);
      notify("Profil salvat", "success");
    } catch (e) {
      setErr(e.message || "Eroare");
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      {err && <Alert severity="error">{err}</Alert>}
      {saved && <Alert severity="success">Salvat</Alert>}
      <TextField
        label="Nume"
        value={v.name}
        onChange={(e) => setField("name", e.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        value={v.email}
        onChange={(e) => setField("email", e.target.value)}
      />
      <Button variant="contained" onClick={save}>
        Salvează
      </Button>
    </Stack>
  );
}
