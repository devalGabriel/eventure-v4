"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";

const statusPriority = {
  ACCEPTED: 3,
  PENDING: 2,
  DECLINED: 1,
  EXPIRED: 0,
  CANCELLED: 0,
};

export default function ProviderInvitationsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = Array.isArray(params?.locale)
    ? params.locale[0]
    : params?.locale;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [ownedGroupIds, setOwnedGroupIds] = useState([]); // ✅ grupuri la care sunt owner

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
        const txt = await r.text();
        if (!r.ok) throw new Error(txt || "Load failed");
        const json = txt ? JSON.parse(txt) : {};
        const list = Array.isArray(json) ? json : json.rows || [];
        if (mounted) setRows(list);

        // assignments (evenimente selectate)
        const ra = await fetch("/api/providers/me/assignments", {
          cache: "no-store",
        });
        if (ra.ok) {
          const ta = await ra.text();
          const ja = ta ? JSON.parse(ta) : [];
          if (mounted) setAssignments(Array.isArray(ja) ? ja : ja.rows || []);
        }

        // ✅ grupuri unde sunt OWNER (administrator de grup)
        try {
          const rg = await fetch("/api/providers/me/groups", {
            cache: "no-store",
          });
          if (rg.ok) {
            const tg = await rg.text();
            const jg = tg ? JSON.parse(tg) : {};
            const groupsArr = Array.isArray(jg.groups)
              ? jg.groups
              : jg.groups || [];
            if (mounted) {
              setOwnedGroupIds(groupsArr.map((g) => g.id));
            }
          }
        } catch (e) {
          console.error("Failed to load provider groups", e);
        }
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
  }, []);

  const visibleInvitations = useMemo(() => {
    return (rows || []).filter((inv) => {
      if (!inv.providerGroupId) return true; // invitație directă către provider
      if (!ownedGroupIds.length) return false;
      return ownedGroupIds.includes(inv.providerGroupId);
    });
  }, [rows, ownedGroupIds]);

  // 🔹 DEDUP: grupăm invitațiile per eveniment (un singur request per event)
  const groupedInvitations = useMemo(() => {
    const map = new Map();

    (visibleInvitations || []).forEach((inv) => {
      const ev = inv.event || {};
      const eventId = inv.eventId || ev.id;
      if (!eventId) return;

      const existing = map.get(eventId);
      if (!existing) {
        map.set(eventId, { ...inv });
      } else {
        const merged = { ...existing };

        merged.hasOffer = Boolean(existing.hasOffer || inv.hasOffer);

        const currentScore = statusPriority[existing.status] || 0;
        const newScore = statusPriority[inv.status] || 0;
        if (newScore > currentScore) {
          merged.status = inv.status;
        }

        map.set(eventId, merged);
      }
    });

    return Array.from(map.values());
  }, [visibleInvitations]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Invitații la evenimente
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* LISTĂ INVITAȚII (DEDUP BY EVENT) */}
      <Stack spacing={1}>
        {groupedInvitations.map((inv) => {
          const ev = inv.event || {};
          const dt = ev.date ? new Date(ev.date) : null;

          return (
            <Card key={inv.id} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {ev.name || "Eveniment"}{" "}
                      {dt && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          ({dt.toLocaleDateString()})
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ev.type && `Tip: ${ev.type} • `}
                      {ev.location && `Locație: ${ev.location}`}
                      {ev.city && ` (${ev.city})`}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {inv.message || inv.note || "Fără mesaj"}
                    </Typography>
                    {inv.proposedBudget && (
                      <Typography variant="body2" color="text.secondary">
                        Buget propus: {inv.proposedBudget}{" "}
                        {inv.budgetCurrency || ""}
                      </Typography>
                    )}
                  </Box>

                  <Stack
                    spacing={1}
                    alignItems={{
                      xs: "flex-start",
                      md: "flex-end",
                    }}
                  >
                    <Chip
                      label={inv.status}
                      size="small"
                      color={
                        inv.status === "PENDING"
                          ? "warning"
                          : inv.status === "ACCEPTED"
                          ? "success"
                          : inv.status === "DECLINED"
                          ? "error"
                          : "default"
                      }
                    />
                    {inv.hasOffer && (
                      <Chip
                        label="Ofertă trimisă"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {inv.need && (
                      <Chip
                        label={inv.need.label}
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          router.push(
                            `/${locale}/dashboard/provider/invitations/${inv.id}`
                          )
                        }
                      >
                        Open
                      </Button>
                      {inv.status === "PENDING" && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              router.push(
                                `/${locale}/dashboard/provider/invitations/${inv.id}?accept=1`
                              )
                            }
                          >
                            Accept & open
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={async () => {
                              try {
                                const r = await fetch(
                                  `/api/invitations/${inv.id}/decision`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "content-type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      decision: "DECLINED",
                                    }),
                                  }
                                );
                                const txt = await r.text();
                                if (!r.ok)
                                  throw new Error(
                                    txt || `Decline failed with ${r.status}`
                                  );
                                // reload simplu
                                location.reload();
                              } catch (e) {
                                alert(String(e?.message || e));
                              }
                            }}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}

        {!groupedInvitations.length && !loading && (
          <Box sx={{ p: 1, color: "text.secondary" }}>
            Nu ai invitații deocamdată.
          </Box>
        )}
      </Stack>

      {/* EVENIMENTE SELECTATE / PRE-CONTRACT */}
      <Typography variant="h6" sx={{ mt: 3 }}>
        Evenimente selectate / pre-contract
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {assignments.map((a) => {
          const ev = a.event || {};
          const dt = ev.date ? new Date(ev.date) : null;
          return (
            <Card key={a.id} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {ev.name || "Eveniment"}{" "}
                      {dt && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          ({dt.toLocaleDateString()})
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ev.type && `Tip: ${ev.type} • `}
                      {ev.location && `Locație: ${ev.location}`}
                      {ev.city && ` (${ev.city})`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="success.main">
                      You have been selected for this event – waiting contract
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status pre-contract: {a.status}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        {!assignments.length && !loading && (
          <Box sx={{ p: 1, color: "text.secondary" }}>
            Nu ești selectat încă la niciun eveniment.
          </Box>
        )}
      </Stack>
    </Box>
  );
}
