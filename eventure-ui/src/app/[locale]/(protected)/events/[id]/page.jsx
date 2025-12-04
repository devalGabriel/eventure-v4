"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import {
  getRecommendedNeeds,
  autoInviteProviders,
} from "@/lib/api/eventsClient";
import { getMatchedProvidersForNeed } from "@/lib/api/providersClient";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import SaveIcon from "@mui/icons-material/Save";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getRoleServer } from "@/lib/utils";
import { useNotify } from "@/components/providers/NotificationProvider";
import BudgetEstimatePanel from "@/components/events/BudgetEstimatePanel";
import BriefTemplatePanel from "@/components/events/BriefTemplatePanel";
import EventInvitationsOffersSection from "@/components/events/EventInvitationsOffersSection";

import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";
import BudgetAnalysisPanel from "@/components/events/BudgetAnalysisPanel";
import GapsAnalysisPanel from "@/components/events/GapsAnalysisPanel";
import GuestbookPanel from "@/components/events/GuestbookPanel";
import EventGuestbookTokensPanel from "@/components/events/EventGuestbookTokensPanel";
import EventGuestbookPanel from "@/components/events/EventGuestbookPanel";
import EventParticipantsPanel from "@/components/events/EventParticipantsPanel";

const statusOptions = ["DRAFT", "PLANNING", "ACTIVE", "COMPLETED", "CANCELED"];
const taskStatusColor = (s) =>
  ({
    TODO: "default",
    IN_PROGRESS: "info",
    DONE: "success",
  }[s] || "default");

function useEvent(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/events/${id}`, { cache: "no-store" });
      const text = await r.text();
      if (!r.ok) {
        let payload = null;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          // ignore
        }
        setData(null);
        setError({
          status: r.status,
          message:
            payload?.error ||
            payload?.message ||
            `Request failed with ${r.status}`,
        });
        return;
      }
      const d = text ? JSON.parse(text) : null;
      setData(d);
    } catch (e) {
      console.error(e);
      setData(null);
      setError({
        status: 0,
        message: "Network / parse error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return { data, loading, error, reload: load };
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const { data: event, loading, error, reload } = useEvent(id);
  const [tab, setTab] = useState(0);
  const [role, setRole] = useState("client");

  useEffect(() => {
    async function fetchRole() {
      const r = await getRoleServer();
      setRole(r);
    }
    fetchRole();
  }, []);

  if (loading && !event && !error) {
    return <Box sx={{ p: 2 }}>Se încarcă…</Box>;
  }

  if (error && !event) {
    if (error.status === 404) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Eveniment inexistent</Typography>
          <Typography variant="body2" color="text.secondary">
            Evenimentul nu a fost găsit sau a fost șters.
          </Typography>
        </Box>
      );
    }
    if (error.status === 403) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Acces restricționat</Typography>
          <Typography variant="body2" color="text.secondary">
            Nu ai dreptul să vezi acest eveniment.
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Eroare la încărcare</Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message || "A apărut o eroare neașteptată."}
        </Typography>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Eveniment inexistent</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack>
          <Typography variant="h5">{event.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {event.type} •{" "}
            {event.date ? new Date(event.date).toLocaleString() : "fără dată"} •{" "}
            {event.location || "-"}
          </Typography>
        </Stack>
        <Chip label={event.status} />
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab label="Overview" />
        <Tab label="Brief & needs" />
        <Tab label="Tasks" />
        <Tab label="Invitations & Offers" />
        <Tab label="Selected providers" />
        <Tab label="Messages" />
        <Tab label="Files" />
        <Tab label="Invitați & Guestbook" />
      </Tabs>

      <Divider />

      {tab === 0 && (
        <>
          <OverviewTab event={event} onSaved={reload} />
          <BudgetAnalysisPanel eventId={event.id} />
          <GapsAnalysisPanel eventId={event.id} />
        </>
      )}
      {tab === 1 && <BriefTab event={event} />}
      {tab === 2 && <TasksTab eventId={event.id} eventDate={event.date} />}
      {tab === 3 && (
        <EventInvitationsOffersSection eventId={event.id} role={role} />
      )}
      {tab === 4 && <SelectedProvidersTab eventId={event.id} />}
      {tab === 5 && <MessagesTab eventId={event.id} />}
      {tab === 6 && <FilesTab eventId={event.id} />}
      {tab === 7 && (
        <Stack spacing={2}>
          <EventParticipantsPanel event={event} />
          <EventGuestbookTokensPanel event={event} />
          <GuestbookPanel eventId={event.id} />
          <EventGuestbookPanel eventId={event.id} />
        </Stack>
      )}
    </Stack>
  );
}

function OverviewTab({ event, onSaved }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(""); // string pentru <input type="datetime-local">
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const { notify } = useNotify();
  const pathname = usePathname();
  const { locale } = extractLocaleAndPath(pathname);
  // sincronizează state-ul cu event, inclusiv data
  useEffect(() => {
    setName(event.name || "");
    setStatus(event.status || "DRAFT");
    setLocation(event.location || "");

    if (event.date) {
      const d = new Date(event.date);
      // convertim la local fără offset (pt. datetime-local)
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16); // YYYY-MM-DDTHH:mm
      setDate(local);
    } else {
      setDate("");
    }
  }, [event]);

  useEffect(() => {
    async function fetchStatuses() {
      const r = await fetch(`/api/events/${event.id}/available-status`, {
        cache: "no-store",
      });
      const d = await r.json();
      setAvailableStatuses(d.allowed || []);
    }
    fetchStatuses();
  }, [event.id]);

  async function save() {
    const payload = {
      name: name || undefined,
      location: location || undefined,
      date: date ? new Date(date).toISOString() : null, // string local -> ISO UTC pt. backend
      status,
    };

    const r = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      notify("Salvat cu succes.", "success");
      onSaved();
    } else {
      notify("Nu s-a putut salva (verifică tranziția de status).", "error");
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} maxWidth={600}>
          <TextField
            label="Nume"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            component={Link}
            href={`/${locale}/dashboard/client/offers?eventId=${
              event.id
            }&eventType=${event.type || ""}&guests=${
              event.guestCount || ""
            }&maxBudget=${event.budgetPlanned || ""}`}
            variant="contained"
          >
            Caută oferte pentru acest eveniment
          </Button>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((s) => (
              <MenuItem
                disabled={!availableStatuses.includes(s)}
                key={s}
                value={s}
              >
                {s}
              </MenuItem>
            ))}
          </Select>

          <TextField
            type="datetime-local"
            label="Data & ora"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }} // important pt. overlay
          />

          <TextField
            label="Locație"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={save}>
              Salvează
            </Button>
            <Button component={Link} href="../events" variant="outlined">
              Înapoi
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BriefTab({ event }) {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);

  const [guestCount, setGuestCount] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [locationType, setLocationType] = useState("");
  const [notes, setNotes] = useState("");

  // EventNeed state: păstrăm TOATE câmpurile relevante
  const [needs, setNeeds] = useState([]);
  const [newNeedLabel, setNewNeedLabel] = useState("");
  const [newNeedBudget, setNewNeedBudget] = useState("");

  //ai
  const [aiRecommendedNeeds, setAiRecommendedNeeds] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [needForAiProviders, setNeedForAiProviders] = useState(null);
  const [matchedProviders, setMatchedProviders] = useState([]);
  const [openRecommendDialog, setOpenRecommendDialog] = useState(false);

  // --- Categorii / Subcategorii ---
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  async function loadAiRecommendations() {
    try {
      setLoadingAi(true);
      const suggestions = await getRecommendedNeeds(event.id);
      setAiRecommendedNeeds(suggestions || []);
    } catch (e) {
      notify("Eroare la încărcarea recomandărilor AI", "error");
    } finally {
      setLoadingAi(false);
    }
  }

  // -------------------------
  // LOAD CATEGORII
  // -------------------------
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/providers/catalog/categories", {
          cache: "force-cache",
        });
        const txt = await res.text();
        const data = txt ? JSON.parse(txt) : [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // === helpers catalog ===
  const flatSubcategories = useMemo(
    () =>
      categories.flatMap((cat) =>
        (cat.subcategories || []).map((sub) => ({
          ...sub,
          categoryName: cat.name,
        }))
      ),
    [categories]
  );

  const tagsForSubcategory = (subcategoryId) => {
    if (!subcategoryId) return [];
    const sub = flatSubcategories.find(
      (s) => String(s.id) === String(subcategoryId)
    );
    return sub?.tags || [];
  };

  // -------------------------
  // LOAD BRIEF + NEEDS
  // -------------------------
  async function load() {
    setLoading(true);
    try {
      const [brRes, needsRes] = await Promise.all([
        fetch(`/api/events/${event.id}/brief`, { cache: "no-store" }),
        fetch(`/api/events/${event.id}/needs`, { cache: "no-store" }),
      ]);

      const brief = brRes.ok ? await brRes.json() : {};
      const needsData = needsRes.ok ? await needsRes.json() : [];

      setGuestCount(
        brief.guestCount === null || brief.guestCount === undefined
          ? ""
          : String(brief.guestCount)
      );
      setCity(brief.city || "");
      setStyle(brief.style || "");
      setLocationType(brief.locationType || "");
      setNotes(brief.notes || "");

      setNeeds(
        Array.isArray(needsData)
          ? needsData.map((n) => ({
              id: n.id,
              label: n.label || "",
              budgetPlanned:
                n.budgetPlanned === null || n.budgetPlanned === undefined
                  ? ""
                  : String(n.budgetPlanned),

              categoryId:
                n.categoryId === null || n.categoryId === undefined
                  ? null
                  : n.categoryId,

              subcategoryId:
                n.subcategoryId === null || n.subcategoryId === undefined
                  ? null
                  : n.subcategoryId,

              tagId: n.tagId === null || n.tagId === undefined ? null : n.tagId,

              notes: n.notes || "",

              priority: n.priority || "MEDIUM",
              mustHave:
                n.mustHave === null || n.mustHave === undefined
                  ? true
                  : !!n.mustHave,

              // 👇 NOI
              locked: !!n.locked,
              offersDeadline: n.offersDeadline
                ? String(n.offersDeadline).slice(0, 16) // YYYY-MM-DDTHH:mm
                : "",
            }))
          : []
      );
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut încărca brief-ul.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [event.id]);

  // -------------------------
  // HANDLERE NEEDS
  // -------------------------
  function updateNeed(idx, patch) {
    setNeeds((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, ...patch } : n))
    );
  }

  function removeNeed(idx) {
    setNeeds((prev) => prev.filter((_, i) => i !== idx));
  }

  function addNeed() {
    const label = newNeedLabel.trim();
    if (!label) return;

    const b =
      newNeedBudget === "" || newNeedBudget === null
        ? ""
        : String(newNeedBudget);

    setNeeds((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}-${prev.length}`,
        label,
        budgetPlanned: b,
        categoryId: null,
        subcategoryId: null,
        tagId: null,
        notes: "",
        priority: "MEDIUM",
        mustHave: true,
        locked: false, // 👈 nou
        offersDeadline: "", // 👈 nou
      },
    ]);

    setNewNeedLabel("");
    setNewNeedBudget("");
  }

  // -------------------------
  // SAVE
  // -------------------------
  async function save() {
    try {
      setLoading(true);

      const briefPayload = {
        guestCount:
          guestCount === "" || guestCount === null ? null : Number(guestCount),
        city,
        style,
        locationType,
        notes,
      };

      await fetch(`/api/events/${event.id}/brief`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(briefPayload),
      });

      const needsPayload = {
        needs: needs.map((n) => ({
          // 👇 trimitem id pentru nevoile existente
          id: n.id && !String(n.id).startsWith("tmp-") ? n.id : undefined,

          label: n.label,
          budgetPlanned:
            n.budgetPlanned === "" || n.budgetPlanned === null
              ? null
              : Number(n.budgetPlanned),

          categoryId:
            n.categoryId === undefined ||
            n.categoryId === null ||
            n.categoryId === ""
              ? null
              : n.categoryId,

          subcategoryId:
            n.subcategoryId === undefined ||
            n.subcategoryId === null ||
            n.subcategoryId === ""
              ? null
              : n.subcategoryId,

          tagId:
            n.tagId === undefined || n.tagId === null || n.tagId === ""
              ? null
              : n.tagId,

          notes:
            n.notes !== undefined &&
            n.notes !== null &&
            String(n.notes).trim() !== ""
              ? String(n.notes).trim()
              : null,

          priority:
            typeof n.priority === "string" && n.priority
              ? n.priority.toUpperCase()
              : "MEDIUM",

          mustHave: n.mustHave === undefined ? true : !!n.mustHave,

          // 👇 nou: deadline pentru oferte
          offersDeadline:
            n.offersDeadline && n.offersDeadline !== ""
              ? n.offersDeadline
              : null,
        })),
      };

      await fetch(`/api/events/${event.id}/needs`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(needsPayload),
      });

      notify("Brief & nevoi salvate.", "success");
      await load();
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut salva brief-ul.", "error");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <Card>
      <CardContent>
        <Stack spacing={3} maxWidth={1800}>
          <Typography variant="h6">Profil eveniment</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Număr invitați (estimativ)"
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
            <TextField
              label="Oraș / zonă"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Stil eveniment (elegant, rustic, boho...)"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Tip locație (restaurant, ballroom, cort...)"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Preferințe & detalii"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={3}
          />

          <Divider />

          {/* ------------------------- */}
          {/* NEVOI DE SERVICII */}
          {/* ------------------------- */}
          <Typography variant="h6">Nevoi de servicii</Typography>

          {/* Add Need */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
          >
            <TextField
              label="Serviciu (ex. Muzică / DJ)"
              value={newNeedLabel}
              onChange={(e) => setNewNeedLabel(e.target.value)}
              fullWidth
            />
            <TextField
              label="Buget estimat"
              type="number"
              value={newNeedBudget}
              onChange={(e) => setNewNeedBudget(e.target.value)}
            />
            <Button variant="outlined" onClick={addNeed}>
              Adaugă
            </Button>
          </Stack>

          {/* Existing Needs */}
          <Stack spacing={1}>
            {needs.map((n, idx) => (
              <Card key={n.id || idx} sx={{ p: 1 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  disabled={n.locked}
                >
                  {/* Serviciu */}
                  <TextField
                    label="Serviciu"
                    value={n.label}
                    onChange={(e) => updateNeed(idx, { label: e.target.value })}
                    sx={{ flex: 2 }}
                    disabled={n.locked}
                  />

                  {/* Categorie */}
                  <FormControl sx={{ flex: 1, minWidth: 180 }}>
                    <InputLabel>Categorie</InputLabel>
                    <Select
                      value={n.categoryId || ""}
                      label="Categorie"
                      onChange={(e) => {
                        const categoryId = e.target.value || null;
                        updateNeed(idx, {
                          categoryId,
                          subcategoryId: null,
                        });
                      }}
                    >
                      <MenuItem value="">Alege categoria</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Subcategorie */}
                  <FormControl
                    sx={{ flex: 1, minWidth: 180 }}
                    disabled={!n.categoryId || n.locked}
                  >
                    <InputLabel>Subcategorie</InputLabel>
                    <Select
                      value={n.subcategoryId || ""}
                      label="Subcategorie"
                      onChange={(e) =>
                        updateNeed(idx, {
                          subcategoryId: e.target.value || null,
                        })
                      }
                    >
                      <MenuItem value="">Nicio subcategorie</MenuItem>
                      {(
                        categories.find((c) => c.id === n.categoryId)
                          ?.subcategories || []
                      ).map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* Particularitate (tag) */}
                  <FormControl
                    sx={{ flex: 1, minWidth: 180 }}
                    disabled={!n.subcategoryId || n.locked}
                  >
                    <InputLabel>Particularitate</InputLabel>
                    <Select
                      value={n.tagId || ""}
                      label="Particularitate"
                      onChange={(e) =>
                        updateNeed(idx, {
                          tagId: e.target.value || null,
                        })
                      }
                    >
                      <MenuItem value="">Nicio particularitate</MenuItem>
                      {tagsForSubcategory(n.subcategoryId).map((tag) => (
                        <MenuItem key={tag.id} value={tag.id}>
                          {tag.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Buget */}
                  <TextField
                    label="Buget"
                    type="number"
                    value={n.budgetPlanned}
                    onChange={(e) =>
                      updateNeed(idx, { budgetPlanned: e.target.value })
                    }
                    sx={{ flex: 1 }}
                    disabled={n.locked}
                  />

                  {/* Delete */}
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => removeNeed(idx)}
                    disabled={n.locked}
                  >
                    Șterge
                  </Button>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<LightbulbIcon />}
                    onClick={async () => {
                      setNeedForAiProviders(n);
                      try {
                        const res = await getMatchedProvidersForNeed(n, {
                          city,
                          eventType: event.eventType,
                          guestCount,
                        });

                        // 🔒 Normalizare: scoatem întotdeauna un array
                        const list = Array.isArray(res?.providers)
                          ? res.providers
                          : Array.isArray(res)
                          ? res
                          : [];

                        setMatchedProviders(list);
                        setOpenRecommendDialog(true);
                      } catch (err) {
                        console.error("getMatchedProvidersForNeed error:", err);
                        notify(
                          "Nu s-au putut încărca recomandările de provideri.",
                          "error"
                        );
                        setMatchedProviders([]);
                        setOpenRecommendDialog(true);
                      }
                    }}
                    disabled={n.locked}
                  >
                    Recomandă furnizori
                  </Button>

                  <Button
                    size="small"
                    startIcon={<RocketLaunchIcon />}
                    onClick={() =>
                      autoInviteProviders(event.id, n.id, "top", 5).then(() =>
                        notify("Invitații trimise", "success")
                      )
                    }
                    disabled={n.locked}
                  >
                    Invită Top 5
                  </Button>

                  <Button
                    size="small"
                    color="warning"
                    onClick={() =>
                      autoInviteProviders(event.id, n.id, "all").then(() =>
                        notify(
                          "Invitații trimise tuturor providerilor compatibili",
                          "success"
                        )
                      )
                    }
                    disabled={n.locked}
                  >
                    Invită toți
                  </Button>
                </Stack>

                {/* Prioritate, obligatoriu & detalii specifice */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ mt: 1 }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <FormControl sx={{ minWidth: 140 }} disabled={n.locked}>
                    <InputLabel>Prioritate</InputLabel>
                    <Select
                      label="Prioritate"
                      value={n.priority || "MEDIUM"}
                      onChange={(e) =>
                        updateNeed(idx, { priority: e.target.value })
                      }
                    >
                      <MenuItem value="HIGH">Mare</MenuItem>
                      <MenuItem value="MEDIUM">Medie</MenuItem>
                      <MenuItem value="LOW">Mică</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={n.mustHave !== false}
                        onChange={(e) =>
                          updateNeed(idx, { mustHave: e.target.checked })
                        }
                        disabled={n.locked}
                      />
                    }
                    label="Obligatoriu"
                  />
                  <TextField
                    label="Deadline oferte"
                    type="datetime-local"
                    value={n.offersDeadline || ""}
                    onChange={(e) =>
                      updateNeed(idx, { offersDeadline: e.target.value })
                    }
                    sx={{ minWidth: 220 }}
                    disabled={n.locked}
                  />

                  <TextField
                    label="Detalii pentru acest serviciu"
                    value={n.notes || ""}
                    onChange={(e) => updateNeed(idx, { notes: e.target.value })}
                    multiline
                    minRows={2}
                    sx={{ flex: 1 }}
                    disabled={n.locked}
                  />
                </Stack>
              </Card>
            ))}
            <Box sx={{ mt: 4 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  Sugestii AI pentru serviciile lipsă
                </Typography>
                <Button
                  startIcon={<AutoAwesomeIcon />}
                  onClick={loadAiRecommendations}
                  disabled={loadingAi}
                >
                  Generează sugestii
                </Button>
              </Stack>

              {loadingAi && <LinearProgress sx={{ mt: 2 }} />}

              {aiRecommendedNeeds.length > 0 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {aiRecommendedNeeds.map((rec, idx) => (
                    <Card
                      key={idx}
                      sx={{ p: 2, opacity: 0.85, border: "1px dashed #999" }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>
                          <b>{rec.label}</b> (recomandat)
                          <br />
                          Buget sugerat: {rec.suggestedBudget} lei
                        </Typography>

                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() => {
                              setNeeds((prev) => [
                                ...prev,
                                {
                                  id: `tmp-${Date.now()}`,
                                  label: rec.label,
                                  categoryId: rec.categoryId,
                                  subcategoryId: rec.subcategoryId,
                                  tagId: rec.tagId,
                                  notes: "",
                                  budgetPlanned: rec.suggestedBudget,
                                  priority: rec.priority,
                                  mustHave: rec.mustHave,
                                },
                              ]);
                            }}
                          >
                            Adaugă
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {!needs.length && (
              <Box sx={{ p: 2, color: "text.secondary" }}>
                Nu ai definit încă nevoi de servicii.
              </Box>
            )}
          </Stack>
          <Box sx={{ mt: 4 }}>
            <GapsAnalysisPanel eventId={event.id} />
          </Box>

          {/* SAVE */}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={save} disabled={loading}>
              Salvează brief & nevoi
            </Button>
          </Stack>

          <BriefTemplatePanel eventId={event.id} />

          <Box sx={{ mt: 2 }}>
            <BudgetEstimatePanel eventId={event.id} />
          </Box>
          <Box sx={{ mt: 3 }}>
</Box>
        </Stack>
      </CardContent>
      <Box sx={{ mt: 3 }}>
</Box>
      <Dialog
        open={openRecommendDialog}
        onClose={() => setOpenRecommendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Recomandări AI pentru: {needForAiProviders?.label}
        </DialogTitle>
        <DialogContent dividers>
          {Array.isArray(matchedProviders) && matchedProviders.length > 0 ? (
            matchedProviders.map((p) => (
              <Card key={p.id} sx={{ p: 2, mb: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>
                    <b>{p.name}</b>
                    <br />
                    Oras: {p.city}
                    <br />
                    Scor: {p.score}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() =>
                      autoInviteProviders(
                        event.id,
                        needForAiProviders.id,
                        "top",
                        1
                      ).then(() => notify("Invitație trimisă", "success"))
                    }
                  >
                    Invită
                  </Button>
                </Stack>
              </Card>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nu există încă recomandări pentru acest serviciu.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenRecommendDialog(false)}>Închide</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function TasksTab({ eventId, eventDate }) {
  const { notify } = useNotify();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // pentru dialog de editare
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const DAY_MS = 24 * 60 * 60 * 1000;

  function normalizeDateString(iso) {
    if (!iso) return "";
    // așteptăm ISO de la backend
    return new Date(iso).toISOString().slice(0, 10);
  }

  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title || "");
      setEditDueDate(normalizeDateString(editingTask.dueDate));
    } else {
      setEditTitle("");
      setEditDueDate("");
    }
  }, [editingTask]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/events/${eventId}/tasks`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Failed to load tasks");
      }
      const d = await r.json();
      setItems(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      notify("Nu s-au putut încărca taskurile.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    const t = title.trim();
    if (!t) return;

    try {
      const payload = { title: t };
      if (dueDate) {
        // yyyy-mm-dd din input type="date"
        payload.dueDate = dueDate;
      }

      const r = await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Create failed");
      }
      setTitle("");
      setDueDate("");
      notify("Task adăugat.", "success");
      await load();
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut adăuga taskul.", "error");
    }
  }

  async function generateTimeline() {
    if (
      !confirm(
        "Generezi timeline-ul implicit pentru acest eveniment?\nTaskurile existente NU vor fi șterse."
      )
    )
      return;

    setGenerating(true);
    try {
      const r = await fetch(`/api/events/${eventId}/tasks/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Generate failed");
      }
      notify("Timeline generat pe baza șablonului de eveniment.", "success");
      await load();
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut genera timeline-ul.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function saveEdit() {
    if (!editingTask) return;
    try {
      const payload = {};
      const t = editTitle.trim();
      if (t) payload.title = t;
      if (editDueDate === "") {
        payload.dueDate = null;
      } else if (editDueDate) {
        payload.dueDate = editDueDate; // yyyy-mm-dd
      }

      const r = await fetch(`/api/events/${eventId}/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Update failed");
      }
      notify("Task actualizat.", "success");
      setEditingTask(null);
      await load();
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut actualiza taskul.", "error");
    }
  }

  async function deleteTask() {
    if (!editingTask) return;
    try {
      const r = await fetch(`/api/events/${eventId}/tasks/${editingTask.id}`, {
        method: "DELETE",
      });
      console.log("r.status: ", r.status);
      console.log("r.ok: ", r.ok);
      if (!r.ok && r.status !== 204) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Delete failed");
      }

      notify("Task șters.", "success");
      setEditingTask(false);
      setEditingTask(null);
      await load();
    } catch (e) {
      console.error(e);
      notify("Nu s-a putut șterge taskul.", "error");
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  // timeline vertical: sortăm cronologic (fără dată la final)
  const timelineItems = useMemo(() => {
    const withDate = [];
    const withoutDate = [];

    items.forEach((it) => {
      if (it.dueDate) withDate.push(it);
      else withoutDate.push(it);
    });

    withDate.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // întâi cu dată, apoi fără
    return [...withDate, ...withoutDate];
  }, [items]);

  function daysUntil(due) {
    if (!due) return null;
    const d = new Date(due);
    if (!Number.isFinite(d.getTime())) return null;
    const diff = Math.round(
      (d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY_MS
    );
    return diff;
  }

  function formatDaysLabel(diff) {
    if (diff === null) return "fără termen";
    if (diff === 0) return "azi";
    if (diff > 0) return `în ${diff} zile`;
    return `acum ${Math.abs(diff)} zile`;
  }

  return (
    <Stack spacing={2}>
      {/* Form de adăugare + generare */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-end" }}
      >
        <TextField
          label="Task nou"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label="Termen (opțional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }} // rezolvă overlap cu mm/dd/yyyy
        />
        <Button
          variant="contained"
          onClick={add}
          disabled={loading || !title.trim()}
        >
          Adaugă
        </Button>
        <Button
          variant="outlined"
          onClick={generateTimeline}
          disabled={loading || generating}
        >
          Generează timeline
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ p: 2, color: "text.secondary" }}>Se încarcă taskurile…</Box>
      )}

      {!loading && timelineItems.length === 0 && (
        <Box sx={{ p: 2, color: "text.secondary" }}>
          Fără taskuri încă. Poți genera un timeline sau adăuga manual.
        </Box>
      )}

      {/* TIMELINE VERTICAL */}
      {!loading && timelineItems.length > 0 && (
        <Box sx={{ position: "relative", mt: 2 }}>
          {/* linia centrală */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: "divider",
            }}
          />
          <Stack spacing={4}>
            {timelineItems.map((it, index) => {
              const isLeft = index % 2 === 0;
              const diff = daysUntil(it.dueDate);
              const daysLabel = formatDaysLabel(diff);
              const dateLabel = it.dueDate
                ? new Date(it.dueDate).toLocaleString()
                : "fără dată";

              const opacity = it.status === "DONE" ? 0.6 : 1;

              return (
                <Box
                  key={it.id}
                  sx={{
                    display: "flex",
                    justifyContent: isLeft ? "flex-start" : "flex-end",
                  }}
                >
                  <Tooltip title="Click pentru editare/stergere">
                    <Box
                      sx={{
                        position: "relative",
                        maxWidth: { xs: "100%", md: "46%" },
                        cursor: "pointer",
                      }}
                      onClick={() => setEditingTask(it)}
                    >
                      {/* punct pe linia centrală */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 18,
                          [isLeft ? "right" : "left"]: "-10px",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          border: "2px solid",
                          borderColor: "background.default",
                        }}
                      />
                      <Card
                        sx={{
                          p: 1.5,
                          opacity,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip
                            size="small"
                            label={daysLabel}
                            color={taskStatusColor(it.status)}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500 }}
                              noWrap
                            >
                              {it.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem" }}
                              noWrap
                            >
                              {dateLabel}
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    </Box>
                  </Tooltip>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* DIALOG EDIT / DELETE */}
      <Dialog
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editează task</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titlu"
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <TextField
              label="Termen (opțional)"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={deleteTask}>
            Șterge
          </Button>
          <Button variant="contained" onClick={saveEdit}>
            Salvează
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function MessagesTab({ eventId }) {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");

  async function load() {
    try {
      const r = await fetch(`/api/events/${eventId}/messages`, {
        cache: "no-store",
      });
      if (!r.ok) {
        console.error("Failed messages load", await r.text());
        setItems([]);
        return;
      }
      const d = await r.json();
      const list = Array.isArray(d) ? d : Array.isArray(d?.rows) ? d.rows : [];
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }

  async function post() {
    if (!body.trim()) return;
    await fetch(`/api/events/${eventId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
    await load();
  }

  useEffect(() => {
    load();
  }, [eventId]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Mesaj"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={post}>
          Trimite
        </Button>
      </Stack>

      {items.map((m) => (
        <Card key={m.id} sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
          </Typography>
          <Typography>{m.body}</Typography>
        </Card>
      ))}

      {!items.length && (
        <Box sx={{ p: 2, color: "text.secondary" }}>Fără mesaje.</Box>
      )}
    </Stack>
  );
}

function FilesTab({ eventId }) {
  const [list, setList] = useState([]);
  const [file, setFile] = useState(null);

  async function load() {
    const r = await fetch(`/api/events/${eventId}/attachments`);
    const d = await r.json();
    setList(d || []);
  }
  useEffect(() => {
    load();
  }, [eventId]);

  async function upload() {
    if (!file) return;
    const body = {
      name: file.name,
      url: `/uploads/${file.name}`,
      mime: file.type,
      size: file.size,
    }; // MVP: metadate; integrarea upload-ului real o faci în files-service
    await fetch(`/api/events/${eventId}/attachments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setFile(null);
    await load();
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button variant="contained" onClick={upload} disabled={!file}>
          Încarcă
        </Button>
      </Stack>
      {list.map((a) => (
        <Card key={a.id} sx={{ p: 1 }}>
          <Typography>
            {a.name} • {a.mime || "-"} • {a.size ? `${a.size}B` : ""}
          </Typography>
        </Card>
      ))}
      {!list.length && (
        <Box sx={{ p: 2, color: "text.secondary" }}>Fără fișiere.</Box>
      )}
    </Stack>
  );
}

function SelectedProvidersTab({ eventId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/events/${eventId}/assignments`, {
          cache: "no-store",
        });
        const txt = await r.text();
        if (!r.ok) throw new Error(txt || "Load failed");
        const json = txt ? JSON.parse(txt) : [];
        const list = Array.isArray(json) ? json : json.rows || [];
        if (mounted) setRows(list);
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
  }, [eventId]);

  return (
    <Box sx={{ mt: 2 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={1}>
        {rows.map((a) => (
          <Card
            key={a.id}
            sx={{
              p: 2,
              mb: 1,
              borderLeft:
                a.status === "CONFIRMED_PRE_CONTRACT" || a.status === "SELECTED"
                  ? "6px solid #4caf50"
                  : "6px solid #ff9800",
            }}
          >
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography variant="subtitle1">
                    Provider / Grup: {a.providerId || a.providerGroupId || "-"}
                  </Typography>
                  {a.notes && (
                    <Typography variant="body2" color="text.secondary">
                      {a.notes}
                    </Typography>
                  )}
                </Box>
                <Stack
                  spacing={1}
                  alignItems={{ xs: "flex-start", md: "flex-end" }}
                >
                  <Chip
                    label={a.status}
                    size="small"
                    color={
                      a.status === "CONFIRMED_PRE_CONTRACT"
                        ? "success"
                        : a.status === "SELECTED"
                        ? "info"
                        : "default"
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const targetStatus =
                          a.status === "SHORTLISTED"
                            ? "SELECTED"
                            : "CONFIRMED_PRE_CONTRACT";
                        const r = await fetch(`/api/assignments/${a.id}`, {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ status: targetStatus }),
                        });
                        const txt = await r.text();
                        if (!r.ok)
                          throw new Error(
                            txt || `Update failed with ${r.status}`
                          );
                        // reload simplu
                        location.reload();
                      } catch (e) {
                        alert(String(e?.message || e));
                      }
                    }}
                  >
                    {a.status === "SHORTLISTED"
                      ? "Select provider"
                      : a.status === "SELECTED"
                      ? "Confirm pre-contract"
                      : "Pre-contract confirmed"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!rows.length && !loading && (
          <Box sx={{ p: 1, color: "text.secondary" }}>
            Nu ai selectat încă furnizori pentru acest eveniment.
          </Box>
        )}
      </Stack>
    </Box>
  );
}
