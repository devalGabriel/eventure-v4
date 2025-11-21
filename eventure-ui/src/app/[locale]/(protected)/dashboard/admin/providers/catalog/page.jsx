// src/app/[locale]/(protected)/dashboard/admin/providers/catalog/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  ListSubheader,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  adminUpdateProviderCategory,
  adminUpdateProviderSubcategory,
  adminUpdateProviderTag,
} from "@/lib/api/providersClient";

import {
  adminCreateCategory,
  adminCreateSubcategory,
  adminCreateTag,
  getProviderCatalog,
} from "@/lib/api/providerCatalogClient";

export default function AdminProviderCatalogPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // acordeon state
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [expandedSubcategoryId, setExpandedSubcategoryId] = useState(null);

  // form state
  const [newCategory, setNewCategory] = useState({ slug: "", name: "" });
  const [newSubcategory, setNewSubcategory] = useState({
    slug: "",
    name: "",
  });
  const [newTag, setNewTag] = useState({ slug: "", label: "" });

  // search state
  const [searchCategory, setSearchCategory] = useState("");
  const [searchSubcategory, setSearchSubcategory] = useState("");
  const [searchTag, setSearchTag] = useState("");

  // ce e “target” pentru formuri
  const [selectedCategoryForFormsId, setSelectedCategoryForFormsId] =
    useState(null);
  const [selectedSubcategoryForFormsId, setSelectedSubcategoryForFormsId] =
    useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await getProviderCatalog();
      setCatalog(cats);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la încărcare catalog provideri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // filtre & selecții
  const categoriesFiltered = useMemo(() => {
    const q = searchCategory.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => {
      const name = c.name || "";
      const slug = c.slug || "";
      return (
        name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)
      );
    });
  }, [catalog, searchCategory]);

  const currentCategoryForForms = useMemo(
    () =>
      catalog.find((c) => c.id === Number(selectedCategoryForFormsId)) || null,
    [catalog, selectedCategoryForFormsId]
  );

  const currentSubcategoryForForms = useMemo(() => {
    if (!currentCategoryForForms) return null;
    return (
      currentCategoryForForms.subcategories.find(
        (s) => s.id === Number(selectedSubcategoryForFormsId)
      ) || null
    );
  }, [currentCategoryForForms, selectedSubcategoryForFormsId]);

  // mini-statistici
  const providerCountForCategory = (cat) =>
    cat?._count?.providers ?? cat?.providerCount ?? 0;

  const providerCountForSubcategory = (sub) =>
    sub?._count?.providers ?? sub?.providerCount ?? 0;

  // CREATE handlers
  const handleAddCategory = async () => {
    if (!newCategory.slug || !newCategory.name) return;
    try {
      await adminCreateCategory({
        slug: newCategory.slug,
        name: newCategory.name,
      });
      setNewCategory({ slug: "", name: "" });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la creare categorie");
    }
  };

  const handleAddSubcategory = async () => {
    if (
      !selectedCategoryForFormsId ||
      !newSubcategory.slug ||
      !newSubcategory.name
    )
      return;
    try {
      await adminCreateSubcategory({
        categoryId: Number(selectedCategoryForFormsId),
        slug: newSubcategory.slug,
        name: newSubcategory.name,
      });
      setNewSubcategory({ slug: "", name: "" });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la creare subcategorie");
    }
  };

  const handleAddTag = async () => {
    if (!selectedSubcategoryForFormsId || !newTag.slug || !newTag.label)
      return;
    try {
      await adminCreateTag({
        subcategoryId: Number(selectedSubcategoryForFormsId),
        slug: newTag.slug,
        label: newTag.label,
      });
      setNewTag({ slug: "", label: "" });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la creare tag");
    }
  };

  // TOGGLE handlers
  const toggleCategoryActive = async (cat, e) => {
    if (!cat) return;
    e?.stopPropagation?.();
    try {
      await adminUpdateProviderCategory(cat.id, {
        isActive: !cat.isActive,
      });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la actualizare categorie");
    }
  };

  const toggleSubcategoryActive = async (sub, e) => {
    if (!sub) return;
    e?.stopPropagation?.();
    try {
      await adminUpdateProviderSubcategory(sub.id, {
        isActive: !sub.isActive,
      });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la actualizare subcategorie");
    }
  };

  const toggleTagActive = async (tag, e) => {
    if (!tag) return;
    e?.stopPropagation?.();
    try {
      await adminUpdateProviderTag(tag.id, {
        isActive: !tag.isActive,
      });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la actualizare tag");
    }
  };

  // SEARCH în interiorul acordeoanelor
  const filterSubcategories = (subs) => {
    const q = searchSubcategory.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter((s) => {
      const name = s.name || "";
      const slug = s.slug || "";
      return (
        name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)
      );
    });
  };

  const filterTags = (tags) => {
    const q = searchTag.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => {
      const label = t.label || "";
      const slug = t.slug || "";
      return (
        label.toLowerCase().includes(q) || slug.toLowerCase().includes(q)
      );
    });
  };

  const handleCategoryAccordionChange = (catId) => (_e, expanded) => {
    setExpandedCategoryId(expanded ? catId : null);
    setExpandedSubcategoryId(null);
    setSearchSubcategory("");
    setSearchTag("");
  };

  const handleSubcategoryClick = (subId) => () => {
    setExpandedSubcategoryId((prev) => (prev === subId ? null : subId));
    setSearchTag("");
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Catalog provideri
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Gestionează structura de categorii, subcategorii și tag-uri pentru
        marketplace. Selectezi o categorie → vezi subcategoriile dedesubt →
        selectezi o subcategorie → vezi tag-urile dedesubt.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography>Se încarcă catalogul...</Typography>
      ) : (
        <Grid container spacing={2}>
          {/* COL STÂNGA – FORM CATEGORIE + SEARCH */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Categorii
              </Typography>

              {/* Add category form */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Slug categorie (ex: location, music)"
                    fullWidth
                    size="small"
                    value={newCategory.slug}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Nume categorie"
                    fullWidth
                    size="small"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddCategory}
                  >
                    Adaugă categorie
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 1 }} />

              {/* Search categorii */}
              <TextField
                label="Caută categorie"
                size="small"
                fullWidth
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                sx={{ mb: 1 }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                {categoriesFiltered.length} categorii găsite
              </Typography>
            </Paper>
          </Grid>

          {/* COL DREAPTA – ACCORDION CATEGORIE → SUBCATEGORII → TAGURI */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Structură (acordeon)
              </Typography>

              {categoriesFiltered.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nu există categorii pentru filtrul curent.
                </Typography>
              ) : (
                <Box>
                  {categoriesFiltered.map((cat) => {
                    const isExpanded = expandedCategoryId === cat.id;
                    const subcategories = filterSubcategories(
                      cat.subcategories || []
                    );
                    const catProviderCount = providerCountForCategory(cat);

                    return (
                      <Accordion
                        key={cat.id}
                        expanded={isExpanded}
                        onChange={handleCategoryAccordionChange(cat.id)}
                        disableGutters
                        sx={{ mb: 1, "&:before": { display: "none" } }}
                      >
                        {/* IMPORTANT: în Summary – doar text, fără butoane */}
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1">{cat.name}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {cat.slug} ·{" "}
                              {cat.isActive ? "Activă" : "Inactivă"} ·{" "}
                              {catProviderCount} provideri
                            </Typography>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          {/* BARĂ DE ACȚIUNI PENTRU CATEGORIE */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Acțiuni pentru{" "}
                              <strong>{cat.name}</strong>
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) =>
                                  toggleCategoryActive(cat, e)
                                }
                              >
                                {cat.isActive
                                  ? "Dezactivează"
                                  : "Activează"}
                              </Button>
                              <Button
                                size="small"
                                variant={
                                  selectedCategoryForFormsId === cat.id
                                    ? "contained"
                                    : "text"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategoryForFormsId(cat.id);
                                  setSelectedSubcategoryForFormsId(null);
                                  setExpandedSubcategoryId(null);
                                }}
                              >
                                Folosește la form
                              </Button>
                            </Stack>
                          </Stack>

                          {/* SEARCH SUBCATEGORII */}
                          <Box sx={{ mb: 1 }}>
                            <TextField
                              label="Caută subcategorie"
                              size="small"
                              fullWidth
                              value={searchSubcategory}
                              onChange={(e) =>
                                setSearchSubcategory(e.target.value)
                              }
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {subcategories.length} subcategorii pentru{" "}
                              {cat.name}
                            </Typography>
                          </Box>

                          {/* FORM ADD SUBCATEGORY – doar dacă e selectată la form */}
                          {selectedCategoryForFormsId === cat.id && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                Adăugare subcategorie pentru{" "}
                                <strong>{cat.name}</strong>
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    label="Slug subcategorie"
                                    size="small"
                                    fullWidth
                                    value={newSubcategory.slug}
                                    onChange={(e) =>
                                      setNewSubcategory((prev) => ({
                                        ...prev,
                                        slug: e.target.value,
                                      }))
                                    }
                                  />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    label="Nume subcategorie"
                                    size="small"
                                    fullWidth
                                    value={newSubcategory.name}
                                    onChange={(e) =>
                                      setNewSubcategory((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                  />
                                </Grid>
                                <Grid
                                  item
                                  xs={12}
                                  md={4}
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAddSubcategory}
                                  >
                                    Adaugă subcategorie
                                  </Button>
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          {/* LISTĂ SUBCATEGORII + TAGURI (nested) */}
                          {subcategories.length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Nu există subcategorii pentru această categorie.
                            </Typography>
                          ) : (
                            <List
                              dense
                              subheader={
                                <ListSubheader
                                  component="div"
                                  disableSticky
                                >
                                  Subcategorii
                                </ListSubheader>
                              }
                            >
                              {subcategories.map((sub) => {
                                const isSubExpanded =
                                  expandedSubcategoryId === sub.id;
                                const tagList = filterTags(sub.tags || []);
                                const subProviderCount =
                                  providerCountForSubcategory(sub);

                                return (
                                  <Box key={sub.id} sx={{ mb: 1 }}>
                                    <ListItemButton
                                      selected={isSubExpanded}
                                      onClick={handleSubcategoryClick(
                                        sub.id
                                      )}
                                    >
                                      <ListItemText
                                        primary={sub.name}
                                        secondary={`${sub.slug} · ${
                                          sub.isActive
                                            ? "Activă"
                                            : "Inactivă"
                                        } · ${subProviderCount} provideri`}
                                      />
                                      <ListItemSecondaryAction>
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                        >
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={(e) =>
                                              toggleSubcategoryActive(
                                                sub,
                                                e
                                              )
                                            }
                                          >
                                            {sub.isActive
                                              ? "Dezactivează"
                                              : "Activează"}
                                          </Button>
                                          <Button
                                            size="small"
                                            variant={
                                              selectedSubcategoryForFormsId ===
                                              sub.id
                                                ? "contained"
                                                : "text"
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedCategoryForFormsId(
                                                cat.id
                                              );
                                              setSelectedSubcategoryForFormsId(
                                                sub.id
                                              );
                                            }}
                                          >
                                            Folosește
                                          </Button>
                                        </Stack>
                                      </ListItemSecondaryAction>
                                    </ListItemButton>

                                    {/* TAGURI (vizibile doar dacă subcategoria e “expandată”) */}
                                    {isSubExpanded && (
                                      <Box
                                        sx={{
                                          pl: 4,
                                          pr: 1,
                                          pb: 1,
                                        }}
                                      >
                                        {/* SEARCH TAGS */}
                                        <TextField
                                          label="Caută tag"
                                          size="small"
                                          fullWidth
                                          value={searchTag}
                                          onChange={(e) =>
                                            setSearchTag(e.target.value)
                                          }
                                          sx={{ mb: 1 }}
                                        />

                                        {/* FORM ADD TAG – doar dacă această subcategorie e selectată la form */}
                                        {selectedSubcategoryForFormsId ===
                                          sub.id && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mb: 1 }}
                                            >
                                              Adăugare tag pentru{" "}
                                              <strong>
                                                {sub.name}
                                              </strong>
                                            </Typography>
                                            <Grid
                                              container
                                              spacing={1}
                                            >
                                              <Grid item xs={12} md={4}>
                                                <TextField
                                                  label="Slug tag"
                                                  size="small"
                                                  fullWidth
                                                  value={newTag.slug}
                                                  onChange={(e) =>
                                                    setNewTag((prev) => ({
                                                      ...prev,
                                                      slug: e.target.value,
                                                    }))
                                                  }
                                                />
                                              </Grid>
                                              <Grid item xs={12} md={4}>
                                                <TextField
                                                  label="Label tag"
                                                  size="small"
                                                  fullWidth
                                                  value={newTag.label}
                                                  onChange={(e) =>
                                                    setNewTag((prev) => ({
                                                      ...prev,
                                                      label: e.target.value,
                                                    }))
                                                  }
                                                />
                                              </Grid>
                                              <Grid
                                                item
                                                xs={12}
                                                md={4}
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                              >
                                                <Button
                                                  variant="contained"
                                                  size="small"
                                                  onClick={
                                                    handleAddTag
                                                  }
                                                >
                                                  Adaugă tag
                                                </Button>
                                              </Grid>
                                            </Grid>
                                          </Box>
                                        )}

                                        {/* LISTĂ TAGURI */}
                                        {tagList.length === 0 ? (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            Nu există tag-uri pentru această
                                            subcategorie.
                                          </Typography>
                                        ) : (
                                          <List dense>
                                            {tagList.map((tag) => (
                                              <ListItemButton
                                                key={tag.id}
                                              >
                                                <ListItemText
                                                  primary={tag.label}
                                                  secondary={`${tag.slug} · ${
                                                    tag.isActive
                                                      ? "Activ"
                                                      : "Inactiv"
                                                  }`}
                                                />
                                                <ListItemSecondaryAction>
                                                  <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={(e) =>
                                                      toggleTagActive(
                                                        tag,
                                                        e
                                                      )
                                                    }
                                                  >
                                                    {tag.isActive
                                                      ? "Dezactivează"
                                                      : "Activează"}
                                                  </Button>
                                                </ListItemSecondaryAction>
                                              </ListItemButton>
                                            ))}
                                          </List>
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </List>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
