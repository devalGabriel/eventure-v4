// src/components/provider/ProviderGroupsSection.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  TextField,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getMyProviderGroups,
  createProviderGroup,
  updateProviderGroup,
  searchGroupMembers,
  getProviderServices,
} from "@/lib/api/providersClient";

export default function ProviderGroupsSection() {
  const [groups, setGroups] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [groupedOffers, setGroupedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    id: null,
    name: "",
    description: "",
    isActive: true,
    sharePolicy: "MANUAL",
    members: [],
  });

  // căutare membri
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState(null);

  // servicii per provider pentru selecția în grup
  const [serviceOptionsByProfile, setServiceOptionsByProfile] = useState({});
  const [selectedServiceByProfile, setSelectedServiceByProfile] = useState({});

  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { groups, groupedOffers, memberGroups } =
          await getMyProviderGroups();
        if (!mounted) return;
        setGroups(groups || []);
        setGroupedOffers(groupedOffers || []);
        setMemberGroups(memberGroups || []); // 👈 nou
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Eroare la încărcarea grupurilor");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setGroupForm({
      id: null,
      name: "",
      description: "",
      isActive: true,
      sharePolicy: "MANUAL",
      members: [],
    });
    setMemberSearch("");
    setMemberResults([]);
    setMemberSearchError(null);
    setServiceOptionsByProfile({});
    setSelectedServiceByProfile({});
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (group) => {
    setGroupForm({
      id: group.id,
      name: group.name || "",
      description: group.description || "",
      isActive: group.isActive ?? true,
      sharePolicy: group.sharePolicy || "MANUAL",
      members: (group.members || []).map((m) => ({
        providerProfileId: m.providerProfileId,
        serviceOfferId: m.serviceOfferId,
        displayName: m.providerProfile?.displayName || "",
        email: m.providerProfile?.email || "",
        city: m.providerProfile?.city || "",
        serviceTitle: m.serviceOffer?.title || "",
        tags: (m.serviceOffer?.tags || []).map((t) => ({
          id: t.tagId,
          label: t.tag?.label || "",
        })),
        specializationTag: m.specializationTag || "",
        role: m.role || "MEMBER",
        isActive: m.isActive ?? true,
        shareMode: m.shareMode || "NONE",
        shareValue: m.shareValue ?? "",
      })),
    });
    setMemberSearch("");
    setMemberResults([]);
    setMemberSearchError(null);
    setServiceOptionsByProfile({});
    setSelectedServiceByProfile({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleChangeField = (field) => (e) => {
    const value =
      field === "isActive" ? e.target.value === "active" : e.target.value;
    setGroupForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    setGroupForm((prev) => {
      const members = [...prev.members];
      members[index] = {
        ...members[index],
        [field]: value,
      };
      return { ...prev, members };
    });
  };

  const addMemberRow = () => {
    setGroupForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          providerProfileId: "",
          serviceOfferId: "",
          displayName: "",
          email: "",
          city: "",
          serviceTitle: "",
          specializationTag: "",
          role: "MEMBER",
          isActive: true,
          shareMode: "NONE",
          shareValue: "",
        },
      ],
    }));
  };

  const removeMemberRow = (index) => {
    setGroupForm((prev) => {
      const members = [...prev.members];
      members.splice(index, 1);
      return { ...prev, members };
    });
  };

  // --- căutare membri (nume, email, oraș, tag) ---
  const handleMemberSearch = async () => {
    if (!memberSearch.trim()) return;
    setMemberSearchLoading(true);
    setMemberSearchError(null);
    try {
      const res = await searchGroupMembers({ q: memberSearch.trim() });
      setMemberResults(res.items || []);
    } catch (err) {
      console.error(err);
      setMemberSearchError(err.message || "Eroare la căutarea membrilor");
    } finally {
      setMemberSearchLoading(false);
    }
  };

  const ensureServicesLoaded = async (providerProfileId) => {
    if (serviceOptionsByProfile[providerProfileId]) return;
    try {
      const offers = await getProviderServices(providerProfileId);
      setServiceOptionsByProfile((prev) => ({
        ...prev,
        [providerProfileId]: offers || [],
      }));
    } catch (err) {
      console.error(err);
      setMemberSearchError(
        err.message || "Eroare la încărcarea serviciilor providerului"
      );
    }
  };

  const handleAddMemberFromResult = (user) => {
    const providerProfileId = user.providerProfileId;
    const selectedServiceId = selectedServiceByProfile[providerProfileId];
    if (!selectedServiceId) return;

    const services = serviceOptionsByProfile[providerProfileId] || [];
    const service = services.find(
      (s) => Number(s.id) === Number(selectedServiceId)
    );
    if (!service) return;

    const specializationTag =
      service.tags && service.tags.length
        ? service.tags[0].tag?.label || service.tags[0].label || ""
        : "";

    setGroupForm((prev) => {
      const exists = prev.members.some(
        (m) =>
          Number(m.providerProfileId) === Number(providerProfileId) &&
          Number(m.serviceOfferId) === Number(selectedServiceId)
      );
      if (exists) return prev;

      return {
        ...prev,
        members: [
          ...prev.members,
          {
            providerProfileId,
            serviceOfferId: selectedServiceId,
            displayName: user.displayName || `User #${user.userId}`,
            email: user.email || "",
            city: user.city || "",
            serviceTitle: service.title || "",
            tags:
              (service.tags || []).map((t) => ({
                id: t.tagId,
                label: t.tag?.label || "",
              })) || [],
            specializationTag,
            role: "MEMBER",
            isActive: true,
            shareMode: "NONE",
            shareValue: "",
          },
        ],
      };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: groupForm.name,
        description: groupForm.description,
        isActive: groupForm.isActive,
        sharePolicy: groupForm.sharePolicy || "MANUAL",
        members: groupForm.members
          .filter((m) => m.providerProfileId && m.serviceOfferId)
          .map((m) => ({
            providerProfileId: Number(m.providerProfileId),
            serviceOfferId: Number(m.serviceOfferId),
            specializationTag: m.specializationTag || null,
            role: m.role || "MEMBER",
            isActive: m.isActive,
            shareMode: m.shareMode || "NONE",
            shareValue:
              m.shareMode === "NONE" || m.shareValue === ""
                ? null
                : Number(m.shareValue),
          })),
      };

      let result;
      if (groupForm.id) {
        result = await updateProviderGroup(groupForm.id, payload);
        setGroups((prev) => prev.map((g) => (g.id === result.id ? result : g)));
      } else {
        result = await createProviderGroup(payload);
        setGroups((prev) => [result, ...prev]);
      }

      resetForm();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la salvarea grupului");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">
          Grupuri & Membri (formații / echipe)
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={openNewDialog}
        >
          Grup nou
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography>Se încarcă...</Typography>
      ) : (
        <>
          {/* Grupuri create de tine */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Grupuri create de tine
            </Typography>

            {groups.length === 0 ? (
              <Typography variant="body2">
                Nu ai creat încă niciun grup.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nume</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Politică</TableCell>
                    <TableCell>Nr. Membri</TableCell>
                    <TableCell>Servicii asociate</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((g) => {
                    const offersForGroup = groupedOffers.filter(
                      (o) => o.groupId === g.id
                    );
                    const groupLink = `${pathname}/${g.id}`;
                    return (
                      <TableRow key={g.id}>
                        <TableCell>
                          <Link href={groupLink}>
                            {g.name || `Grup #${g.id}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={g.isActive ? "Activ" : "Inactiv"}
                            size="small"
                            color={g.isActive ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell>{g.sharePolicy}</TableCell>
                        <TableCell>
                          {g.members?.length
                            ? `${g.members.length} ${
                                g.members.length === 1 ? "membru" : "membri"
                              }`
                            : "—"}
                        </TableCell>

                        <TableCell>
                          {offersForGroup.length > 0
                            ? offersForGroup.map((o) => o.title).join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(g)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>

          {/* Grupuri în care ești membru */}
          {memberGroups.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Grupuri în care ești membru
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nume</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Nr. Membri</TableCell>
                    <TableCell>Rolul meu</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memberGroups.map((g) => {
                    const groupLink = `${pathname}/${g.id}`;
                    const myInfo = (g.myMemberships || [])
                      .map((m) => {
                        const role = m.role || "MEMBRU";
                        if (m.shareValue == null) return role;
                        return `${role} – ${m.shareMode || ""} ${m.shareValue}`;
                      })
                      .join(", ");

                    return (
                      <TableRow key={g.id}>
                        <TableCell>
                          <Link href={groupLink}>
                            {g.name || `Grup #${g.id}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={g.isActive ? "Activ" : "Inactiv"}
                            size="small"
                            color={g.isActive ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell>
                          {g.members?.length
                            ? `${g.members.length} ${
                                g.members.length === 1 ? "membru" : "membri"
                              }`
                            : "—"}
                        </TableCell>
                        <TableCell>{myInfo || "MEMBRU"}</TableCell>
                        <TableCell align="right">
                          {/* aici în viitor putem pune buton "Părăsește grupul" */}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}

          {groups.length === 0 && memberGroups.length === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Nu ai creat și nu faci parte încă din niciun grup.
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* DIALOG create/edit grup */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="lg">
        <DialogTitle>{groupForm.id ? "Editează grup" : "Grup nou"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nume grup (ex: Crystal Band)"
                fullWidth
                margin="normal"
                value={groupForm.name}
                onChange={handleChangeField("name")}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Status"
                fullWidth
                margin="normal"
                value={groupForm.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    isActive: e.target.value === "active",
                  }))
                }
              >
                <MenuItem value="active">Activ</MenuItem>
                <MenuItem value="inactive">Inactiv</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Politică împărțire"
                fullWidth
                margin="normal"
                value={groupForm.sharePolicy || "MANUAL"}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    sharePolicy: e.target.value,
                  }))
                }
                helperText="EQUAL = toți membrii activi împart egal. MANUAL = stabilești tu procent/sumă."
              >
                <MenuItem value="MANUAL">MANUAL – setez manual share</MenuItem>
                <MenuItem value="EQUAL">EQUAL – împărțire egală</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descriere"
                fullWidth
                multiline
                minRows={2}
                margin="normal"
                value={groupForm.description}
                onChange={handleChangeField("description")}
              />
            </Grid>
          </Grid>

          {/* Căutare membri */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Caută provideri (nume, specializare, email, oraș) și alege
              serviciul pentru grup
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ mt: 1 }}
              alignItems="flex-start"
            >
              <TextField
                label="Cuvinte cheie"
                fullWidth
                size="small"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleMemberSearch}
                disabled={memberSearchLoading || !memberSearch.trim()}
              >
                {memberSearchLoading ? "Se caută..." : "Caută"}
              </Button>
            </Stack>
            {memberSearchError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {memberSearchError}
              </Typography>
            )}
            {memberResults.length > 0 && (
              <Box
                sx={{
                  mt: 1,
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {memberResults.map((u) => {
                  const providerProfileId = u.providerProfileId;
                  const services =
                    serviceOptionsByProfile[providerProfileId] || [];
                  const selectedServiceId =
                    selectedServiceByProfile[providerProfileId] || "";
                  const already =
                    selectedServiceId &&
                    groupForm.members.some(
                      (m) =>
                        Number(m.providerProfileId) ===
                          Number(providerProfileId) &&
                        Number(m.serviceOfferId) === Number(selectedServiceId)
                    );

                  return (
                    <Box
                      key={`${u.providerProfileId}-${u.userId}`}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        py: 0.5,
                        borderBottom: "1px dashed",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {u.displayName || `User #${u.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.email || "—"} · {u.city || "—"}
                          </Typography>
                          {u.tags?.length ? (
                            <Box
                              sx={{
                                mt: 0.5,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {u.tags.map((t) => (
                                <Chip
                                  key={t.id}
                                  size="small"
                                  label={t.label}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          ) : null}
                        </Box>

                        <Box sx={{ minWidth: 260 }}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            label="Serviciu pentru grup"
                            value={selectedServiceId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedServiceByProfile((prev) => ({
                                ...prev,
                                [providerProfileId]: val,
                              }));
                            }}
                            SelectProps={{
                              onOpen: () =>
                                ensureServicesLoaded(providerProfileId),
                            }}
                            helperText="Alege serviciul concret (pianist, DJ, MC etc.)"
                          >
                            {services.length === 0 ? (
                              <MenuItem value="">
                                {`Nu există servicii sau se încarcă...`}
                              </MenuItem>
                            ) : (
                              services.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                  {s.title}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ mt: 0.5 }}
                            onClick={() => handleAddMemberFromResult(u)}
                            disabled={already || !selectedServiceId}
                          >
                            {already ? "Deja în grup" : "Adaugă în grup"}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Membri grup – tabel editabil */}
          <Box sx={{ mt: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle2">Membri grup</Typography>
              <Button size="small" variant="text" onClick={addMemberRow}>
                Adaugă membru manual
              </Button>
            </Stack>

            {groupForm.members.length === 0 ? (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Nu există membri încă. Poți căuta provideri mai sus și le poți
                asocia serviciile lor în grup.
              </Typography>
            ) : (
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Membru</TableCell>
                    <TableCell>Serviciu</TableCell>
                    <TableCell>Specializare</TableCell>
                    <TableCell>Rol în grup</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tip share</TableCell>
                    <TableCell>Valoare</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupForm.members.map((m, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2">
                          {m.displayName || `Profil #${m.providerProfileId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.email || "—"} · {m.city || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.serviceTitle || `Serviciu #${m.serviceOfferId}`}
                        </Typography>
                        {m.tags && m.tags.length > 0 && (
                          <Box
                            sx={{
                              mt: 0.5,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                            }}
                          >
                            {m.tags.map((t) => (
                              <Chip
                                key={t.id}
                                size="small"
                                label={t.label}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={m.specializationTag || ""}
                          onChange={(e) =>
                            handleMemberChange(
                              idx,
                              "specializationTag",
                              e.target.value
                            )
                          }
                          placeholder="ex: pianist, voce, MC"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={m.role || "MEMBER"}
                          onChange={(e) =>
                            handleMemberChange(idx, "role", e.target.value)
                          }
                        >
                          <MenuItem value="ADMIN">Administrator grup</MenuItem>
                          <MenuItem value="MEMBER">Membru</MenuItem>
                          <MenuItem value="MEMBER_NO_CHAT">
                            Membru fără chat
                          </MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={m.isActive ? "active" : "inactive"}
                          onChange={(e) =>
                            handleMemberChange(
                              idx,
                              "isActive",
                              e.target.value === "active"
                            )
                          }
                        >
                          <MenuItem value="active">Activ</MenuItem>
                          <MenuItem value="inactive">Inactiv</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={m.shareMode || "NONE"}
                          onChange={(e) =>
                            handleMemberChange(idx, "shareMode", e.target.value)
                          }
                        >
                          <MenuItem value="NONE">NONE</MenuItem>
                          <MenuItem value="PERCENTAGE">
                            PERCENTAGE (% din încasare)
                          </MenuItem>
                          <MenuItem value="FIXED_AMOUNT">
                            FIXED_AMOUNT (sumă fixă)
                          </MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={m.shareValue ?? ""}
                          onChange={(e) =>
                            handleMemberChange(
                              idx,
                              "shareValue",
                              e.target.value
                            )
                          }
                          disabled={m.shareMode === "NONE"}
                          placeholder={
                            m.shareMode === "PERCENTAGE"
                              ? "ex: 25 = 25%"
                              : m.shareMode === "FIXED_AMOUNT"
                              ? "ex: 500 (sumă fixă)"
                              : ""
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeMemberRow(idx)}
                        >
                          Șterge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Anulează</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? "Se salvează..." : "Salvează grup"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
