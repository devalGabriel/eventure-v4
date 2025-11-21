"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Button,
    Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { getMyProviderGroups, leaveProviderGroupMembership } from "@/lib/api/providersClient";
import { useNotify } from "@/components/providers/NotificationProvider";

export default function ProviderGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params?.groupId);
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerGroups, setOwnerGroups] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [groupedOffers, setGroupedOffers] = useState([]);
  const [groupPackages, setGroupPackages] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!groupId) return;
      setLoading(true);
      setError(null);
      try {
        const {
          groups,
          memberGroups,
          groupedOffers,
          groupPackages,
        } = await getMyProviderGroups();

        if (!mounted) return;
        setOwnerGroups(groups || []);
        setMemberGroups(memberGroups || []);
        setGroupedOffers(groupedOffers || []);
        setGroupPackages(groupPackages || []);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err.message || "Eroare la încărcarea grupului");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [groupId]);

  const { group, isOwner, myMembershipInfo } = useMemo(() => {
    // caz 1: sunt owner al grupului
    const owner = ownerGroups.find((g) => Number(g.id) === groupId);
    if (owner) {
      return {
        group: owner,
        isOwner: true,
        myMembershipInfo: null,
      };
    }

    // caz 2: sunt membru în grup
    const member = memberGroups.find((g) => Number(g.id) === groupId);
    if (member) {
      const info = (member.myMemberships || []).map((m) => ({
        membershipId: m.membershipId,
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

  // 🔹 sunt admin desemnat (dar nu owner)?
  const isAdminMember =
    !isOwner &&
    !!myMembershipInfo &&
    myMembershipInfo.some((info) => info.role === "ADMIN");

    // 🔹 cine poate gestiona grupul (panou avansat + sume): owner + admin
  const canManageGroup = useMemo(() => {
    if (isOwner) return true;
    if (!myMembershipInfo || myMembershipInfo.length === 0) return false;
    return myMembershipInfo.some((m) => m.role === "ADMIN");
  }, [isOwner, myMembershipInfo]);

  const primaryMembershipId =
    myMembershipInfo && myMembershipInfo.length > 0
      ? myMembershipInfo[0].membershipId
      : null;

  const [leaving, setLeaving] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);

  const openConfirmLeave = () => {
    if (!primaryMembershipId) return;
    setConfirmOpen(true);
  };

  const closeConfirmLeave = () => {
    if (leaving) return; // nu închidem cât timp procesăm
    setConfirmOpen(false);
  };

  async function handleConfirmLeave() {
    if (!primaryMembershipId) return;
    try {
      setLeaving(true);
      await leaveProviderGroupMembership(primaryMembershipId);
      setConfirmOpen(false);
      notify("Ai parasit grupul cu succes!", "success")
      router.push("/ro/dashboard/provider/groups");
    } catch (err) {
      console.error(err);
      alert(err.message || "Eroare la părăsirea grupului");
    } finally {
      setLeaving(false);
    }
  }

  const servicesForGroup = useMemo(() => {
    if (!group) return [];
    return (groupedOffers || []).filter(
      (o) => Number(o.groupId) === Number(group.id)
    );
  }, [groupedOffers, group]);

  const packagesForGroup = useMemo(() => {
    if (!group) return [];
    return (groupPackages || []).filter((pkg) =>
      (pkg.items || []).some(
        (it) =>
          it.serviceOffer &&
          Number(it.serviceOffer.groupId) === Number(group.id)
      )
    );
  }, [groupPackages, group]);

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
        <Typography>Se încarcă detaliile grupului...</Typography>
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

  return (
    <Box p={3}>
      {/* Dialog confirmare părăsire grup */}
      <Dialog open={confirmOpen} onClose={closeConfirmLeave}>
        <DialogTitle>Părăsești grupul?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Ești pe cale să părăsești acest grup. Nu vei mai vedea evenimentele,
            discuțiile sau împărțirea sumelor pentru acest grup.
            <br />
            <br />
            Ești sigur că vrei să continui?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmLeave} disabled={leaving}>
            Anulează
          </Button>
          <Button
            onClick={handleConfirmLeave}
            color="error"
            variant="contained"
            disabled={leaving}
          >
            {leaving ? "Se procesează..." : "Părăsește grupul"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Header grup */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            {group.name || `Grup #${group.id}`}
          </Typography>
          {group.description && (
            <Typography variant="body2" color="text.secondary">
              {group.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            <Chip
              label={group.isActive ? "Activ" : "Inactiv"}
              color={group.isActive ? "success" : "default"}
              size="small"
            />
            <Chip
              label={
                group.sharePolicy === "EQUAL"
                  ? "Împărțire egală"
                  : "Împărțire manuală"
              }
              size="small"
            />

            {isOwner && (
              <Chip
                label="Owner"
                color="primary"
                variant="outlined"
                size="small"
              />
            )}

            {!isOwner && isAdminMember && (
              <Chip
                label="Admin grup"
                color="primary"
                variant="outlined"
                size="small"
              />
            )}

            {!isOwner && !isAdminMember && (
              <Chip
                label="Membru"
                color="secondary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Box>

                <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => router.back()}>
            Înapoi la grupuri
          </Button>

          {canManageGroup && (
            <Button
              variant="contained"
              onClick={() =>
                router.push(`/ro/dashboard/provider/groups/${group.id}/edit`)
              }
            >
              Gestionează grupul
            </Button>
          )}

          {!canManageGroup && (
            <Button
              variant="outlined"
              color="error"
              onClick={openConfirmLeave}
              disabled={!primaryMembershipId || leaving}
              title={
                !primaryMembershipId
                  ? "Nu s-a putut determina membership-ul tău în grup"
                  : "Părăsește acest grup"
              }
            >
              {leaving ? "Se procesează..." : "Părăsește grupul"}
            </Button>
          )}
        </Stack>

      </Stack>

      <GroupLayout
        group={group}
        servicesForGroup={servicesForGroup}
        packagesForGroup={packagesForGroup}
        myMembershipInfo={myMembershipInfo}
        isOwner={isOwner}
        isAdminMember={isAdminMember}
        canManageGroup={canManageGroup}
      />
    </Box>
  );
}

function GroupLayout({
  group,
  servicesForGroup,
  packagesForGroup,
  myMembershipInfo,
  isOwner,
  isAdminMember,
  canManageGroup,
}) {
  const members = group.members || [];
  console.log("members: ", members);

  return (
    <Stack spacing={3}>
      {/* Membri grup */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Membri grup
        </Typography>

        {members.length > 0 ? (
          <>
            {!canManageGroup && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Grupul are {members.length} membri activi.
              </Typography>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Membru</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Specializare</TableCell>
                  {/* doar cei care pot gestiona grupul (owner + admin) văd coloanele financiare */}
                  {canManageGroup && <TableCell>Tip share</TableCell>}
                  {canManageGroup && <TableCell>Valoare share</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {/* în viitor: Link spre profilul public al providerului */}
                      <Typography
                        variant="body2"
                        sx={{ cursor: "default" }} // devine pointer când avem link
                      >
                        {m.providerProfile?.displayName || `Membru #${m.id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{m.role || "MEMBER"}</TableCell>
                    <TableCell>{m.isActive ? "Activ" : "Inactiv"}</TableCell>
                    <TableCell>{m.specializationTag || "—"}</TableCell>
                    {canManageGroup && (
                      <TableCell>{m.shareMode || "NONE"}</TableCell>
                    )}
                    {canManageGroup && (
                      <TableCell>
                        {m.shareValue != null ? m.shareValue : "—"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Typography variant="body2">
            Nu există membri înregistrați în acest grup.
          </Typography>
        )}

        {/* Rolul / share-ul utilizatorului curent – vizibil și pentru membri */}
        {myMembershipInfo && myMembershipInfo.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Rolul tău în acest grup
            </Typography>
            {myMembershipInfo.map((info, idx) => (
              <Typography key={idx} variant="body2">
                {info.role}
                {info.specializationTag
                  ? ` – ${info.specializationTag}`
                  : ""}
                {info.shareMode !== "NONE" && info.shareValue != null
                  ? ` · ${info.shareMode} ${info.shareValue}`
                  : ""}
              </Typography>
            ))}
          </>
        )}
      </Paper>

      {/* Servicii livrate de acest grup */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Servicii livrate de acest grup
        </Typography>
        {servicesForGroup && servicesForGroup.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Titlu serviciu</TableCell>
                <TableCell>Preț</TableCell>
                <TableCell>Monedă</TableCell>
                <TableCell>Unitate preț</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servicesForGroup.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.title}</TableCell>
                  <TableCell>{s.basePrice ?? "—"}</TableCell>
                  <TableCell>{s.currency || "RON"}</TableCell>
                  <TableCell>{s.pricingUnit || "eveniment"}</TableCell>
                  <TableCell>{s.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2">
            Momentan nu există servicii marcate ca livrate de acest grup.
          </Typography>
        )}
      </Paper>

      {/* Pachete care includ acest grup */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Pachete care includ acest grup
        </Typography>
        {packagesForGroup && packagesForGroup.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nume pachet</TableCell>
                <TableCell>Preț</TableCell>
                <TableCell>Monedă</TableCell>
                <TableCell>Servicii</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packagesForGroup.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.name}</TableCell>
                  <TableCell>{pkg.basePrice ?? "—"}</TableCell>
                  <TableCell>{pkg.currency || "RON"}</TableCell>
                  <TableCell>
                    {(pkg.items || [])
                      .map((it) => it.serviceOffer?.title)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2">
            Nu există încă pachete care includ servicii ale acestui grup.
          </Typography>
        )}
      </Paper>

      {/* Placeholder Chat */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Chat grup (în curând)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aici va fi zona de chat în timp real pentru coordonarea dintre
          membrii grupului (discuții despre oferte, repertoriu, logistică
          etc.).
        </Typography>
      </Paper>

      {/* Placeholder Calendar */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Calendar grup (în curând)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aici va fi afișat calendarul centralizat al grupului: evenimente
          confirmate, blocări de date și sincronizare cu disponibilitatea
          fiecărui membru.
        </Typography>
      </Paper>
    </Stack>
  );
}
