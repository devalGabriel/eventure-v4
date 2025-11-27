// src/components/events/EventInvitationsOffersSection.jsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

import EventInvitationsList from "./EventInvitationsList";
import EventOffersList from "./EventOffersList";
import EventInviteProvidersDialog from "./EventInviteProvidersDialog";

export default function EventInvitationsOffersSection({
  eventId,
  role = "client",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [invitations, setInvitations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // invitația selectată (solicitare la care ne uităm)
  const [selectedInvitationId, setSelectedInvitationId] = useState(null);

  // --- dialog Invite providers ---
  const [inviteOpen, setInviteOpen] = useState(false);

  // --- form INVITE SINGLE PROVIDER ---
  const [singleProviderId, setSingleProviderId] = useState("");
  const [singleNote, setSingleNote] = useState("");

  // --- form BULK BY CATEGORIES ---
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [bulkCategoryIds, setBulkCategoryIds] = useState([]);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  // --- buget client (per serviciu) ---
  const [clientBudget, setClientBudget] = useState("");
  const [clientBudgetCurrency, setClientBudgetCurrency] = useState("RON");

  // --- buget din brief (eveniment) ---
  const [eventBudget, setEventBudget] = useState(null);
  const [eventCurrency, setEventCurrency] = useState("RON");

  const assignmentsByKey = useMemo(() => {
    const map = {};
    (assignments || []).forEach((a) => {
      const key =
        a.providerId ||
        (a.providerGroupId ? `group:${a.providerGroupId}` : null);
      if (!key) return;
      map[key] = a;
    });
    return map;
  }, [assignments]);

  const invitationsById = useMemo(() => {
    const map = {};
    (invitations || []).forEach((inv) => {
      if (inv && inv.id) {
        map[inv.id] = inv;
      }
    });
    return map;
  }, [invitations]);

  const invitationsCount = invitations?.length || 0;
  const offersCount = offers?.length || 0;

  // --- load invitații + oferte + assignments ---
  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [ri, ro, ra] = await Promise.all([
        fetch(`/api/events/${eventId}/invitations`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/offers`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/assignments`, { cache: "no-store" }),
      ]);

      const [ti, to, ta] = await Promise.all([ri.text(), ro.text(), ra.text()]);

      if (!ri.ok) throw new Error(ti || "Failed to load invitations");
      if (!ro.ok) throw new Error(to || "Failed to load offers");
      if (!ra.ok && ra.status !== 404)
        throw new Error(ta || "Failed to load assignments");

      const inv = ti ? JSON.parse(ti) : [];
      const off = to ? JSON.parse(to) : [];
      const asg = ra.ok && ta ? JSON.parse(ta) : [];

      setInvitations(Array.isArray(inv) ? inv : inv.rows || []);
      setOffers(Array.isArray(off) ? off : off.rows || []);
      setAssignments(Array.isArray(asg) ? asg : asg.rows || []);

      // dacă invitația selectată nu mai există, o resetăm
      setSelectedInvitationId((prev) =>
        prev && !(Array.isArray(inv) ? inv : inv.rows || []).some(
          (x) => x.id === prev
        )
          ? null
          : prev
      );
    } catch (e) {
      console.error(e);
      setError(String(e?.message || e));
      setInvitations([]);
      setOffers([]);
      setAssignments([]);
      setSelectedInvitationId(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // --- load catalog provideri (pentru bulk) ---
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch("/api/providers/catalog", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : data.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // hook-uri de load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // --- buget din brief (event) ---
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function loadEventBudget() {
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          cache: "no-store",
        });
        const txt = await res.text();
        if (!res.ok || !txt) return;
        const ev = JSON.parse(txt);

        if (cancelled || !ev) return;

        const planned =
          ev.budgetPlanned != null ? Number(ev.budgetPlanned) : null;
        const curr = ev.currency || "RON";

        setEventCurrency(curr);

        if (planned != null && !Number.isNaN(planned)) {
          setEventBudget(planned);

          setClientBudget((prev) =>
            prev === "" || prev == null ? String(planned) : prev
          );
          setClientBudgetCurrency((prev) =>
            !prev || prev === "" ? curr : prev
          );
        }
      } catch (e) {
        console.error("Failed to load event budget", e);
      }
    }

    loadEventBudget();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const flatCategories = useMemo(
    () =>
      (catalog || []).map((c) => ({
        id: c.id,
        name: c.name || c.title || c.slug || "Categorie",
      })),
    [catalog]
  );

  // --- INVITE punctual ---
  async function handleCreateSingleInvitation(e) {
    e.preventDefault();
    if (!eventId || !singleProviderId.trim()) return;

    try {
      const r = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerId: singleProviderId.trim(),
          note: singleNote?.trim() || null,
          proposedBudget: clientBudget ? Number(clientBudget) : null,
          budgetCurrency: clientBudgetCurrency || null,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || `Invite failed with ${r.status}`);
      }

      setSingleProviderId("");
      setSingleNote("");
      await loadAll();
      setBulkMessage("");
      setInviteOpen(false);
    } catch (err) {
      console.error(err);
      alert("Invite failed: " + String(err.message || err));
    }
  }

  // --- BULK INVITE BY CATEGORIES ---
  async function handleBulkInvite(e) {
    e.preventDefault();
    if (!eventId || !bulkCategoryIds.length) return;

    setBulkLoading(true);
    setBulkMessage("");

    try {
      const qs = new URLSearchParams();
      qs.set("categoryIds", bulkCategoryIds.join(","));
      qs.set("page", "1");
      qs.set("pageSize", "5000");

      if (clientBudget != null && clientBudget !== "") {
        qs.set("proposedBudget", String(clientBudget));
        if (clientBudgetCurrency) {
          qs.set("budgetCurrency", clientBudgetCurrency);
        }
      }

      const pkgRes = await fetch(`/api/client/packages?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!pkgRes.ok) {
        throw new Error(await pkgRes.text());
      }

      const pkgs = await pkgRes.json();

      let arr = [];
      if (Array.isArray(pkgs)) {
        arr = pkgs;
      } else if (Array.isArray(pkgs?.items)) {
        arr = pkgs.items;
      } else if (Array.isArray(pkgs?.rows)) {
        arr = pkgs.rows;
      } else if (pkgs && typeof pkgs === "object") {
        Object.values(pkgs).forEach((v) => {
          if (Array.isArray(v)) arr.push(...v);
        });
      }

      const providerIds = Array.from(
        new Set(
          (arr || [])
            .map((p) => {
              if (!p || typeof p !== "object") return null;
              const userId =
                p.providerProfile?.userId ?? p.providerProfileUserId ?? null;
              if (userId == null) return null;
              return String(userId);
            })
            .filter(Boolean)
        )
      );

      if (!providerIds.length) {
        setBulkMessage(
          "Nu am găsit provideri cu pachete în categoriile selectate."
        );
        return;
      }

      const resp = await fetch(`/api/events/${eventId}/invitations/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerIds,
          note: bulkNote?.trim() || null,
          proposedBudget:
            clientBudget != null && clientBudget !== ""
              ? Number(clientBudget)
              : null,
          budgetCurrency: clientBudgetCurrency || null,
        }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const result = await resp.json().catch(() => null);

      setBulkMessage(
        `Invitații trimise: ${
          result?.createdCount ?? providerIds.length
        }. Provideri deja invitați (omiteți): ${result?.skippedCount ?? 0}.`
      );

      setBulkNote("");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Bulk invite failed: " + String(err.message || err));
    } finally {
      setBulkLoading(false);
    }
  }

  // --- acțiuni pe oferte / assignments ---
  async function handleOfferDecision(id, decision) {
    try {
      const r = await fetch(`/api/offers/${id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || `Decision failed with ${r.status}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError(String(e?.message || e));
    }
  }

  async function handleAssignmentFromOffer(offer, status) {
    if (!offer) return;
    try {
      const body = {
        providerId: offer.providerId || null,
        providerGroupId: offer.providerGroupId || null,
        sourceOfferId: offer.id,
        status,
      };

      const r = await fetch(`/api/events/${eventId}/assignments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      if (!r.ok)
        throw new Error(text || `Assignment failed with ${r.status}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError(String(e?.message || e));
    }
  }

  const handleSelectInvitation = (id) => {
    setSelectedInvitationId((prev) => (prev === id ? null : id));
  };

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={1}>
          <Typography variant="h6">Invitații &amp; Oferte</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`Invitații: ${invitationsCount}`} size="small" />
            <Chip label={`Oferte: ${offersCount}`} size="small" />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          {role === "client" && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setInviteOpen(true)}
            >
              Invite providers
            </Button>
          )}
          <IconButton onClick={loadAll}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Din această secțiune poți:
        <br />– trimite invitații în masă către provideri care au pachete în
        anumite categorii (bulk by categories),
        <br />– sau trimite invitații punctuale către un provider anume și să
        gestionezi ofertele primite.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress />
        </Box>
      )}
      {/* drop hint */}
      <Typography variant="caption" fontSize={18} color="error.main">
        (***Funcționalitatea de invitații și oferte este în curs de dezvoltare și
        poate suferi modificări semnificative în versiunile viitoare***) 
        <br /><strong>Trebuie legata cu bugetul din brief și nevoile clientului pentru a
        funcționa corect.</strong>
      </Typography>
      {/* Invitații trimise */}
      <EventInvitationsList
        invitations={invitations}
        assignmentsByKey={assignmentsByKey}
        loading={loading}
        role={role}
        selectedInvitationId={selectedInvitationId}
        onSelectInvitation={handleSelectInvitation}
      />

      {/* Oferte primite */}
      <EventOffersList
        offers={offers}
        assignmentsByKey={assignmentsByKey}
        invitationsById={invitationsById}
        role={role}
        selectedInvitationId={selectedInvitationId}
        totalInvitations={invitationsCount}
        onAssignmentFromOffer={handleAssignmentFromOffer}
        onOfferDecision={handleOfferDecision}
        onClearSelection={() => setSelectedInvitationId(null)}
      />
      
      {/* Dialog Invite providers */}
      {role === "client" && (
        <EventInviteProvidersDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          clientBudget={clientBudget}
          setClientBudget={setClientBudget}
          clientBudgetCurrency={clientBudgetCurrency}
          setClientBudgetCurrency={setClientBudgetCurrency}
          eventBudget={eventBudget}
          eventCurrency={eventCurrency}
          catalogLoading={catalogLoading}
          flatCategories={flatCategories}
          bulkCategoryIds={bulkCategoryIds}
          setBulkCategoryIds={setBulkCategoryIds}
          bulkNote={bulkNote}
          setBulkNote={setBulkNote}
          bulkLoading={bulkLoading}
          bulkMessage={bulkMessage}
          singleProviderId={singleProviderId}
          setSingleProviderId={setSingleProviderId}
          singleNote={singleNote}
          setSingleNote={setSingleNote}
          onBulkInvite={handleBulkInvite}
          onCreateSingleInvitation={handleCreateSingleInvitation}
        />
      )}
    </Stack>
  );
}
