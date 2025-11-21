"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
} from "@mui/material";

import {
  getMyProviderGroups,
  updateProviderGroup,
  searchGroupMembers,
} from "@/lib/api/providersClient";

export default function ProviderGroupEditPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params?.groupId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [ownerGroups, setOwnerGroups] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);

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

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!groupId) return;
      setLoading(true);
      setError(null);
      try {
        const { groups, memberGroups } = await getMyProviderGroups();

        if (!mounted) return;
        setOwnerGroups(groups || []);
        setMemberGroups(memberGroups || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Eroare la încărcarea grupului");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [groupId]);

  // găsim grupul + rolul meu în el
  const { group, isOwner, myMembershipInfo } = useMemo(() => {
    const owner = ownerGroups.find((g) => Number(g.id) === groupId);
    if (owner) {
      return {
        group: owner,
        isOwner: true,
        myMembershipInfo: null,
      };
    }

    const member = memberGroups.find((g) => Number(g.id) === groupId);
    if (member) {
      const info = (member.myMemberships || []).map((m) => ({
        role: m.role || "MEMBER",
        shareMode: m.shareMode || "NONE",
        shareValue: m.shareValue,
        specializationTag: m.specializationTag || null,
      }));
      return {
        group: member,
        isOwner: false,
        myMembershipInfo: info,
      };
    }

    return { group: null, isOwner: false, myMembershipInfo: null };
  }, [ownerGroups, memberGroups, groupId]);

  const canManageGroup = useMemo(() => {
    if (isOwner) return true;
    if (!myMembershipInfo || myMembershipInfo.length === 0) return false;
    return myMembershipInfo.some((m) => m.role === "ADMIN");
  }, [isOwner, myMembershipInfo]);

  // când avem grupul și avem drepturi, populăm formularul
  useEffect(() => {
    if (!group || !canManageGroup) return;
    setGroupForm({
      id: group.id,
      name: group.name || "",
      description: group.description || "",
      isActive: group.isActive ?? true,
      sharePolicy: group.sharePolicy || "MANUAL",
      members: (group.members || []).map((m) => ({
        // pe frontend folosim userId ca "providerProfileId"
        userId: m.providerProfileId,
        displayName: m.providerProfile?.displayName || "",
        email: m.providerProfile?.email || "",
        city: m.providerProfile?.city || "",
        tags: [], // se poate popula ulterior
        role: m.role || "MEMBER",
        isActive: m.isActive ?? true,
        shareMode: m.shareMode || "NONE",
        shareValue: m.shareValue ?? "",
        specializationTag: m.specializationTag || "",
        serviceOfferId: m.serviceOfferId || null,
      })),
    });
  }, [group, canManageGroup]);

  const handleChangeField = (field) => (e) => {
    const value =
      field === "isActive" ? e.target.value === "active" : e.target.value;
    setGroupForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    setGroupForm((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, members };
    });
  };

  const addMemberRow = () => {
    setGroupForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          userId: "",
          displayName: "",
          email: "",
          city: "",
          tags: [],
          role: "MEMBER",
          isActive: true,
          shareMode: "NONE",
          shareValue: "",
          specializationTag: "",
          serviceOfferId: null,
        },
      ],
    }));
  };

  const removeMemberRow = (idx) => {
    setGroupForm((prev) => {
      const members = [...prev.members];
      members.splice(idx, 1);
      return { ...prev, members };
    });
  };

  // căutare membri (pe profil)
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

  const handleAddMemberFromResult = (user) => {
    setGroupForm((prev) => {
      const exists = prev.members.some(
        (m) => Number(m.userId) === Number(user.providerProfileId)
      );
      if (exists) return prev;
      return {
        ...prev,
        members: [
          ...prev.members,
          {
            userId: user.providerProfileId,
            displayName: user.displayName || "",
            email: user.email || "",
            city: user.city || "",
            tags: user.tags || [],
            role: "MEMBER",
            isActive: true,
            shareMode: "NONE",
            shareValue: "",
            specializationTag: "",
            serviceOfferId: null,
          },
        ],
      };
    });
  };

  const handleSubmit = async () => {
    if (!groupForm.id) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: groupForm.name,
        description: groupForm.description,
        isActive: groupForm.isActive,
        sharePolicy: groupForm.sharePolicy || "MANUAL",
        members: groupForm.members
          .filter((m) => m.userId)
          .map((m) => ({
            userId: Number(m.userId), // backend mapează la providerProfileId
            role: m.role || "MEMBER",
            isActive: m.isActive,
            shareMode: m.shareMode || "NONE",
            shareValue:
              m.shareMode === "NONE" || m.shareValue === ""
                ? null
                : Number(m.shareValue),
            specializationTag: m.specializationTag || null,
            serviceOfferId: m.serviceOfferId ? Number(m.serviceOfferId) : null,
          })),
      };

      const updated = await updateProviderGroup(groupForm.id, payload);
      // opțional: poți updata local sau pur și simplu mergi înapoi la detalii
      router.push(`/ro/dashboard/provider/groups/${groupForm.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Eroare la salvarea grupului");
    } finally {
      setSaving(false);
    }
  };

  // --- render states ---
  if (!groupId) {
    return (
      <Box p={3}>
        <Typography color="error">
          ID de grup invalid sau lipsă în URL.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Se încarcă editorul de grup...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Înapoi
        </Button>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Grupul nu a fost găsit.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Nu ai drepturi asupra acestui grup sau nu mai există.
        </Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Înapoi la listă
        </Button>
      </Box>
    );
  }

  if (!canManageGroup) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Nu ai drepturi de administrare pentru acest grup.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Doar owner-ul și membrii cu rol ADMIN pot modifica structura grupului.
        </Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Înapoi
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Editează grupul: {groupForm.name || `Grup #${groupForm.id}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aici poți modifica numele, descrierea, politica de împărțire și
            componența grupului.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              router.push(`/ro/dashboard/provider/groups/${groupForm.id}`)
            }
          >
            Vezi detalii grup
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Se salvează..." : "Salvează modificările"}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Nume grup"
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
      </Paper>

      {/* Căutare membri & tabel membri – poți rafina ulterior */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <TextField
            label="Caută membri (nume, email, oraș)"
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
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {memberSearchError}
          </Typography>
        )}

        {memberResults.length > 0 && (
          <Box
            sx={{
              mb: 2,
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
            }}
          >
            {memberResults.map((u) => {
              const already = groupForm.members.some(
                (m) => Number(m.userId) === Number(u.providerProfileId)
              );
              return (
                <Box
                  key={`${u.providerProfileId}-${u.userId}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 0.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {u.displayName || `Provider #${u.providerProfileId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.email || "—"} · {u.city || "—"}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleAddMemberFromResult(u)}
                    disabled={already}
                  >
                    {already ? "În grup" : "Adaugă"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">Membri grup</Typography>
          <Button size="small" variant="text" onClick={addMemberRow}>
            Adaugă membru
          </Button>
        </Stack>

        {groupForm.members.length === 0 ? (
          <Typography variant="body2">
            Nu există membri încă. Adaugă colegi cu rol PROVIDER din catalog.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Membru</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tip share</TableCell>
                <TableCell>Valoare share</TableCell>
                <TableCell>Specializare</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupForm.members.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography variant="body2">
                      {m.displayName || `Provider #${m.userId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.email || "—"} · {m.city || "—"}
                    </Typography>
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
                      <MenuItem value="ADMIN">ADMIN</MenuItem>
                      <MenuItem value="MEMBER">MEMBER</MenuItem>
                      <MenuItem value="MEMBER_NO_CHAT">
                        MEMBER_NO_CHAT
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
                      <MenuItem value="PERCENTAGE">PERCENTAGE</MenuItem>
                      <MenuItem value="FIXED_AMOUNT">FIXED_AMOUNT</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={m.shareValue ?? ""}
                      onChange={(e) =>
                        handleMemberChange(idx, "shareValue", e.target.value)
                      }
                      disabled={m.shareMode === "NONE"}
                    />
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
                      placeholder="ex: saxofon, MC"
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
      </Paper>
    </Box>
  );
}
