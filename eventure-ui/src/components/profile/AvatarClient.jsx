// src/components/profile/AvatarClient.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Stack, Alert } from "@mui/material";
import { useNotify } from "@/components/providers/NotificationProvider";
import { uploadAvatar } from "@/lib/auth";
import AvatarCropper from "@/components/media/AvatarCropper";

const API_USERS = (
  process.env.NEXT_PUBLIC_USERS_URL || "http://localhost:4102"
).replace(/\/$/, "");

function toAbsoluteUrl(u) {
  if (!u) return "";
  // dacă vine /uploads/.. din backend, prefixează cu hostul users-service
  if (u.startsWith("/uploads/")) return `${API_USERS}${u}`;
  // dacă e deja absolut, păstrează-l
  return u;
}

export default function AvatarClient({ initial, name }) {
  const [url, setUrl] = useState(toAbsoluteUrl(initial));
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const { notify } = useNotify();

  // dacă `initial` se schimbă după load (ex. după GET /me), sincronizează
  useEffect(() => {
    setUrl(toAbsoluteUrl(initial));
  }, [initial]);

  function onSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function onCropped(blob) {
    try {
      setErr("");
      setOpen(false);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const res = await uploadAvatar(file); // { url: '/uploads/...' }
      const next = toAbsoluteUrl(res?.url);
      if (!next) throw new Error("Răspuns invalid la upload.");
      setUrl(next);
      notify("Avatar actualizat", "success");
    } catch (e) {
      setErr(e.message || "Eroare upload");
    }
  }

  const avatarFallback = useMemo(
    () => (name || "").trim()?.[0]?.toUpperCase() || "U",
    [name]
  );

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar src={url} sx={{ width: 72, height: 72 }}>
        {avatarFallback}
      </Avatar>
      <Button variant="outlined" component="label">
        Încarcă
        <input hidden type="file" accept="image/*" onChange={onSelect} />
      </Button>
      {err && (
        <Alert severity="error" sx={{ ml: 2 }}>
          {err}
        </Alert>
      )}
      {preview && (
        <AvatarCropper
          open={open}
          src={preview}
          onCancel={() => setOpen(false)}
          onCropped={onCropped}
        />
      )}
    </Stack>
  );
}
