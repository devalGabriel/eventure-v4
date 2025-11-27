// src/components/provider/invitations/OfferMessagesSection.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function OfferMessagesSection({ offerId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/offers/${offerId}/messages`, {
          cache: "no-store",
        });
        const txt = await r.text();
        if (!r.ok) throw new Error(txt || "Load failed");
        const json = txt ? JSON.parse(txt) : [];
        if (mounted) setRows(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error(e);
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [offerId]);

  async function send() {
    if (!body.trim()) return;
    try {
      const r = await fetch(`/api/offers/${offerId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || `Send failed with ${r.status}`);
      setBody("");
      // reload simplu
      const r2 = await fetch(`/api/offers/${offerId}/messages`, {
        cache: "no-store",
      });
      const txt2 = await r2.text();
      if (r2.ok) {
        setRows(JSON.parse(txt2));
      }
    } catch (e) {
      console.error(e);
      alert(String(e?.message || e));
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Mesaje / negocieri
        </Typography>
        {loading && <LinearProgress sx={{ mb: 1 }} />}
        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        <Stack spacing={1} sx={{ maxHeight: 240, overflowY: "auto", mb: 2 }}>
          {rows.map((m) => (
            <Box
              key={m.id}
              sx={{ p: 1, borderRadius: 1, bgcolor: "background.default" }}
            >
              <Typography variant="body2">{m.body}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(m.createdAt).toLocaleString()}
              </Typography>
            </Box>
          ))}
          {!rows.length && !loading && (
            <Typography variant="body2" color="text.secondary">
              Nicio discuție încă.
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Scrie un mesaj..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button variant="contained" onClick={send}>
            Trimite
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
