// src/components/provider/ProviderPreContractWidget.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  Button,
} from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";

function safelyParseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function ProviderPreContractWidget() {
  const params = useParams();
  const locale = Array.isArray(params?.locale)
    ? params.locale[0]
    : params?.locale || "ro";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [ownedGroupIds, setOwnedGroupIds] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // invitații
        const r = await fetch("/api/providers/me/invitations", {
          cache: "no-store",
        });
        const rText = await r.text();
        if (!r.ok) {
          throw new Error(rText || "Nu s-au putut încărca invitațiile.");
        }
        const rJson = safelyParseJson(rText, {});
        const rows = Array.isArray(rJson) ? rJson : rJson.rows || [];
        if (mounted) setInvitations(rows);

        // assignments (evenimente unde providerul a fost selectat)
        const ra = await fetch("/api/providers/me/assignments", {
          cache: "no-store",
        });
        if (ra.ok) {
          const raTxt = await ra.text();
          const raJson = safelyParseJson(raTxt, []);
          const list = Array.isArray(raJson) ? raJson : raJson.rows || [];
          if (mounted) setAssignments(list);
        } else {
          if (mounted) setAssignments([]);
        }

        // grupuri unde sunt OWNER (administrator de grup)
        const rg = await fetch("/api/providers/me/groups", {
          cache: "no-store",
        });
        if (rg.ok) {
          const tg = await rg.text();
          const jg = safelyParseJson(tg, {});
          const groupsArr = Array.isArray(jg.groups)
            ? jg.groups
            : jg.groups || [];
          if (mounted) {
            setOwnedGroupIds(groupsArr.map((g) => g.id));
          }
        }
      } catch (e) {
        console.error("ProviderPreContractWidget load error", e);
        if (mounted) setError(e?.message || "Eroare la încărcarea datelor.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // aceleași reguli ca pe pagina de invitații:
  // invitațiile către grupuri sunt vizibile doar owner-ilor de grup
  const visibleInvitations = useMemo(() => {
    return (invitations || []).filter((inv) => {
      if (!inv.providerGroupId) return true; // invitație directă
      if (!ownedGroupIds.length) return false;
      return ownedGroupIds.includes(inv.providerGroupId);
    });
  }, [invitations, ownedGroupIds]);

  const stats = useMemo(() => {
    const base = {
      totalInvitations: visibleInvitations.length,
      pending: 0,
      accepted: 0,
      otherClosed: 0,
      assignments: assignments.length,
    };

    (visibleInvitations || []).forEach((inv) => {
      const status = (inv.status || "").toUpperCase();
      if (status === "PENDING") {
        base.pending += 1;
      } else if (status === "ACCEPTED") {
        base.accepted += 1;
      } else if (status) {
        base.otherClosed += 1; // DECLINED / EXPIRED / CANCELLED etc.
      }
    });

    return base;
  }, [visibleInvitations, assignments]);

  const hasData =
    stats.totalInvitations > 0 || stats.assignments > 0 || loading;

  const invitationsHref = `/${locale}/dashboard/provider/invitations`;

  if (loading && !error && !invitations.length && !assignments.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Pipeline pre-contract
        </Typography>
        <LinearProgress sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (!hasData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Pipeline pre-contract
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Nu ai încă invitații sau evenimente selectate în pipeline-ul de
          pre-contract.
        </Typography>
        <Button
          component={Link}
          href={invitationsHref}
          variant="outlined"
          size="small"
        >
          Vezi invitațiile
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="overline" color="text.secondary">
          Pipeline pre-contract
        </Typography>
        <Button
          component={Link}
          href={invitationsHref}
          variant="text"
          size="small"
        >
          Vezi detalii
        </Button>
      </Stack>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", mb: 1 }}
        >
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 100,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Invitații primite
          </Typography>
          <Typography variant="h6">
            {stats.totalInvitations}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 100,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            De răspuns
          </Typography>
          <Typography variant="h6">{stats.pending}</Typography>
        </Box>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 100,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Acceptate
          </Typography>
          <Typography variant="h6">{stats.accepted}</Typography>
        </Box>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 100,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Închise
          </Typography>
          <Typography variant="h6">{stats.otherClosed}</Typography>
        </Box>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minWidth: 120,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Evenimente selectate
          </Typography>
          <Typography variant="h6">{stats.assignments}</Typography>
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Invitațiile către grupuri sunt vizibile doar administratorilor de grup.
      </Typography>
    </Box>
  );
}
