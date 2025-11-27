// src/components/events/EventInvitationsList.jsx
"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  invitationStatusColor,
  assignmentStatusLabel,
} from "./eventStatusHelpers";
import { useRouter } from "next/navigation";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

export default function EventInvitationsList({
  invitations,
  assignmentsByKey,
  loading,
  role,
  selectedInvitationId,
  onSelectInvitation,
}) {
    const { push } = useRouter();
    const pathname = useRouter().pathname;
    const {locale, path} = extractLocaleAndPath(pathname)
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Invitații trimise
        </Typography>

        {role === "client" && !invitations?.length && !loading && (
          <Typography variant="body2" color="text.secondary">
            Nu ai trimis încă invitații. Poți invita provideri punctual sau în
            masă, pe baza categoriilor de servicii.
          </Typography>
        )}

        <Stack spacing={1} sx={{ mt: 1 }}>
          {invitations.map((inv) => {
            const key =
              inv.providerId ||
              (inv.providerGroupId ? `group:${inv.providerGroupId}` : null);
            const assignment = key ? assignmentsByKey[key] : null;

            const budget =
              inv.proposedBudget != null ? Number(inv.proposedBudget) : null;
            const budgetCurrency = inv.budgetCurrency || "RON";

            let title = "Invitație";
            if (inv.providerProfile?.displayName || inv.providerProfile?.name) {
              title = inv.providerProfile.displayName || inv.providerProfile.name;
            } else if (inv.providerName) {
              title = inv.providerName;
            } else if (inv.providerId) {
              title = `Provider #${inv.providerId}`;
            } else if (inv.providerGroup?.name) {
              title = inv.providerGroup.name;
            } else if (inv.providerGroupId) {
              title = `Grup provider #${inv.providerGroupId}`;
            }

            const selected = inv.id === selectedInvitationId;

            return (
              <Box
                key={inv.id}
                onClick={() =>
                  onSelectInvitation && onSelectInvitation(inv.id)
                }
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected
                    ? "action.selected"
                    : "background.paper",
                  cursor: "pointer",
                  transition: "background-color 0.15s, border-color 0.15s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: selected
                      ? "action.selected"
                      : "action.hover",
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2">{title}</Typography>
                      {inv.status && (
                        <Chip
                          size="small"
                          color={invitationStatusColor(inv.status)}
                          label={inv.status}
                        />
                      )}
                      {assignment && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={assignmentStatusLabel(assignment.status)}
                        />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {inv.roleHint && `Rol: ${inv.roleHint} • `}
                      {inv.message || inv.note || "Fără mesaj"}
                    </Typography>

                    {budget != null && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Buget propus: {budget} {budgetCurrency}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                    alignItems="center"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexGrow: 1 }}
                  > 
                    Trimis la:{" "}
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
                {/* buton la capat pentru acces ruta */}
                <Box sx={{ textAlign: "right", mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                        push(`/${locale}/dashboard/${role}/events/${inv.eventId}/requests/${inv.id}`);
                        e.stopPropagation();
                    }}
                  >
                    Vezi detalii
                  </Button>
                </Box>
              </Box>
            );
          })}

          {!invitations.length && !loading && (
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Nu există invitații pentru acest eveniment.
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
