"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePathname } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const CURRENCY_OPTIONS = ["RON", "EUR", "USD"];

export default function AdminEventBriefTemplatesPage() {
  const pathname = usePathname();
  const { locale } = extractLocaleAndPath(pathname); // păstrat pentru consistență, chiar dacă nu-l folosim acum

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/event-types", { cache: "no-store" });
      if (!r.ok) {
        throw new Error(await r.text().catch(() => "Eroare la încărcare"));
      }
      const data = await r.json();
      const list = data.items || [];

      setItems(
        list.map((it) => {
          const brief = it.briefJson || {};
          const budget = it.budgetJson || {};

          const tips = Array.isArray(brief.tips) ? brief.tips : [];
          const categories = Array.isArray(budget.categories)
            ? budget.categories
            : [];

          return {
            ...it,
            label: it.label || brief.label || it.type,
            // BRIEF
            briefIntro: brief.intro || "",
            briefTips: tips.length ? tips : [""],
            // BUDGET
            budgetBasePerGuest: Number(budget.basePerGuest ?? 0) || 0,
            budgetCurrency: budget.currency || "RON",
            budgetCategories:
              categories.length > 0
                ? categories.map((c, idx) => ({
                    key: c.key || `cat_${idx + 1}`,
                    label: c.label || "",
                    percent: Number(c.percent ?? 0) || 0,
                  }))
                : [
                    {
                      key: "general",
                      label: "Buget general",
                      percent: 100,
                    },
                  ],
          };
        })
      );
    } catch (e) {
      console.error(e);
      setError("Nu s-au putut încărca șabloanele.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --- Handlere BRIEF ---

  function handleLabelChange(id, value) {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, label: value } : x))
    );
  }

  function handleIntroChange(id, value) {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, briefIntro: value } : x))
    );
  }

  function handleTipChange(id, index, value) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const tips = [...x.briefTips];
        tips[index] = value;
        return { ...x, briefTips: tips };
      })
    );
  }

  function addTip(id) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, briefTips: [...x.briefTips, ""]} : x
      )
    );
  }

  function removeTip(id, index) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const tips = x.briefTips.filter((_, i) => i !== index);
        return { ...x, briefTips: tips.length ? tips : [""] };
      })
    );
  }

  // --- Handlere BUDGET ---

  function handleBasePerGuestChange(id, value) {
    const num = Number(value);
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, budgetBasePerGuest: Number.isNaN(num) ? 0 : num } : x
      )
    );
  }

  function handleCurrencyChange(id, value) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, budgetCurrency: value || "RON" } : x
      )
    );
  }

  function handleCategoryChange(id, index, field, value) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const cats = [...x.budgetCategories];
        const cat = { ...cats[index] };

        if (field === "label") {
          cat.label = value;
          if (!cat.key) {
            cat.key = value.toLowerCase().replace(/\s+/g, "_");
          }
        } else if (field === "percent") {
          const num = Number(value);
          cat.percent = Number.isNaN(num) ? 0 : num;
        }

        cats[index] = cat;
        return { ...x, budgetCategories: cats };
      })
    );
  }

  function addCategory(id) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              budgetCategories: [
                ...x.budgetCategories,
                { key: "", label: "", percent: 0 },
              ],
            }
          : x
      )
    );
  }

  function removeCategory(id, index) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const cats = x.budgetCategories.filter((_, i) => i !== index);
        return {
          ...x,
          budgetCategories:
            cats.length > 0
              ? cats
              : [{ key: "general", label: "Buget general", percent: 100 }],
        };
      })
    );
  }

  // --- Save ---

  async function saveOne(type) {
    const item = items.find((it) => it.type === type);
    if (!item) return;

    // Curățăm brief
    const cleanTips = item.briefTips
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const briefJson = {
      label: item.label || item.type,
      intro: item.briefIntro || "",
      tips: cleanTips,
      // poți extinde cu "sections" ulterior
    };

    // Curățăm buget
    const basePerGuest =
      Number(item.budgetBasePerGuest ?? 0) > 0
        ? Number(item.budgetBasePerGuest)
        : 0;

    const categoriesSanitized = item.budgetCategories
      .map((c) => {
        const label = (c.label || "").trim();
        const percent = Number(c.percent ?? 0) || 0;
        const key =
          c.key ||
          (label ? label.toLowerCase().replace(/\s+/g, "_") : "cat");

        return { key, label: label || "Categorie", percent };
      })
      // permitem categorie și doar cu procent, dar de obicei vrei minim ceva definitoriu
      .filter((c) => c.label || c.percent > 0);

    const budgetJson = {
      basePerGuest,
      currency: item.budgetCurrency || "RON",
      categories: categoriesSanitized,
    };

    setSavingType(type);
    try {
      const r = await fetch(
        `/api/admin/event-types/${encodeURIComponent(type)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            label: item.label,
            briefJson,
            budgetJson,
          }),
        }
      );

      if (!r.ok) {
        throw new Error(await r.text().catch(() => "Save failed"));
      }

      alert(`Șablon actualizat pentru tipul "${type}".`);
    } catch (e) {
      console.error(e);
      alert("Nu s-a putut salva șablonul.");
    } finally {
      setSavingType(null);
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">
            Șabloane brief & buget pe tip de eveniment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configurezi textul de brief (intro + tips) și regulile de calcul
            estimativ al bugetului pentru fiecare tip de eveniment (nuntă,
            botez, corporate etc.), fără să scrii JSON manual.
          </Typography>
        </Box>

        <Button
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
          variant="outlined"
        >
          Reîncarcă
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Box sx={{ color: "error.main", mb: 2 }}>{error}</Box>
      )}

      <Stack spacing={2}>
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader
              title={`${it.label || it.type} (${it.type})`}
              subheader="Config pentru brief și buget estimativ"
            />
            <CardContent>
              <Stack spacing={3}>
                {/* LABEL TIP EVENIMENT */}
                <TextField
                  label="Label afișat (titlu tip eveniment)"
                  value={it.label || ""}
                  onChange={(e) => handleLabelChange(it.id, e.target.value)}
                  fullWidth
                />

                {/* BRIEF */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Brief eveniment
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Intro (text explicativ pentru client)"
                      value={it.briefIntro}
                      onChange={(e) =>
                        handleIntroChange(it.id, e.target.value)
                      }
                      fullWidth
                      multiline
                      minRows={3}
                      helperText="Ex: Explică pe scurt ce informații are nevoie organizatorul pentru acest tip de eveniment."
                    />

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Tips pentru completare (listă de puncte)
                      </Typography>

                      <Stack spacing={1}>
                        {it.briefTips.map((tip, idx) => (
                          <Stack
                            key={idx}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <TextField
                              label={`Tip ${idx + 1}`}
                              value={tip}
                              onChange={(e) =>
                                handleTipChange(it.id, idx, e.target.value)
                              }
                              fullWidth
                              size="small"
                            />
                            <IconButton
                              aria-label="Șterge tip"
                              onClick={() => removeTip(it.id, idx)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}

                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => addTip(it.id)}
                          size="small"
                        >
                          Adaugă tip
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                {/* BUDGET */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Buget estimativ
                  </Typography>

                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                    >
                      <TextField
                        label="Bază per invitat (RON/EUR/USD)"
                        type="number"
                        value={it.budgetBasePerGuest}
                        onChange={(e) =>
                          handleBasePerGuestChange(it.id, e.target.value)
                        }
                        fullWidth
                        helperText="Folosit pentru calculul bugetului când nu există buget planificat setat pe eveniment."
                      />

                      <TextField
                        select
                        label="Monedă implicită"
                        value={it.budgetCurrency}
                        onChange={(e) =>
                          handleCurrencyChange(it.id, e.target.value)
                        }
                        sx={{ minWidth: 140 }}
                      >
                        {CURRENCY_OPTIONS.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Categorii de buget (procente din total)
                      </Typography>

                      <Stack spacing={1}>
                        {it.budgetCategories.map((cat, idx) => (
                          <Stack
                            key={idx}
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", sm: "center" }}
                          >
                            <TextField
                              label="Label categorie"
                              value={cat.label}
                              onChange={(e) =>
                                handleCategoryChange(
                                  it.id,
                                  idx,
                                  "label",
                                  e.target.value
                                )
                              }
                              fullWidth
                              size="small"
                            />
                            <TextField
                              label="% din buget"
                              type="number"
                              value={cat.percent}
                              onChange={(e) =>
                                handleCategoryChange(
                                  it.id,
                                  idx,
                                  "percent",
                                  e.target.value
                                )
                              }
                              sx={{ width: 140 }}
                              size="small"
                            />
                            <IconButton
                              aria-label="Șterge categorie"
                              onClick={() => removeCategory(it.id, idx)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}

                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => addCategory(it.id)}
                          size="small"
                        >
                          Adaugă categorie
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                {/* SAVE */}
                <Box sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => saveOne(it.type)}
                    disabled={savingType === it.type}
                  >
                    {savingType === it.type
                      ? "Se salvează..."
                      : "Salvează șablonul"}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!loading && items.length === 0 && !error && (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            Nu există încă șabloane de eveniment. Verifică seed-ul sau adaugă în
            baza de date.
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
