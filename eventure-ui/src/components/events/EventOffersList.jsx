// src/components/events/EventOffersList.jsx
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
  offerStatusColor,
  assignmentStatusLabel,
  invitationStatusColor,
} from "./eventStatusHelpers";

function normalizeOfferDetails(detailsJson) {
  if (!detailsJson) return null;

  let details = detailsJson;
  if (typeof detailsJson === "string") {
    try {
      details = JSON.parse(detailsJson);
    } catch {
      return { raw: detailsJson };
    }
  }

  if (Array.isArray(details?.lines)) {
    return { lines: details.lines, terms: details.terms || "" };
  }

  return { raw: JSON.stringify(details) };
}

function formatCurrency(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return "-";
  return `${Number(amount).toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || "RON"}`;
}

export default function EventOffersList({
  offers,
  assignmentsByKey,
  invitationsById,
  role,
  selectedInvitationId,
  totalInvitations,
  onAssignmentFromOffer,
  onOfferDecision,
  onClearSelection,
}) {
  const filteredOffers = selectedInvitationId
    ? offers.filter((o) => o.invitationId === selectedInvitationId)
    : offers;

  const offerCount = filteredOffers.length;
  const hasSelection = !!selectedInvitationId;

  const headerSubtitle = hasSelection
    ? `Ai ${offerCount} ofertă(e) pentru invitația selectată, din ${totalInvitations} invitații trimise pentru acest eveniment.`
    : `Ai ${offerCount} ofertă(e) pentru toate invitațiile trimise la acest eveniment.`;

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="subtitle1">Oferte primite</Typography>
            <Typography variant="body2" color="text.secondary">
              {headerSubtitle}
            </Typography>
          </Box>
          {hasSelection && (
            <Button size="small" onClick={onClearSelection}>
              Vezi toate ofertele
            </Button>
          )}
        </Stack>

        {!hasSelection && !offers.length && (
          <Typography variant="body2" color="text.secondary">
            Nu există încă oferte pentru acest eveniment.
          </Typography>
        )}

        {hasSelection && !filteredOffers.length && (
          <Typography variant="body2" color="text.secondary">
            Nu există încă oferte pentru invitația selectată. Poți aștepta
            răspunsurile providerilor sau poți trimite noi invitații.
          </Typography>
        )}

        {!hasSelection && offers.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, mt: 1 }}
          >
            Selectează o invitație din lista de sus pentru a vedea doar
            ofertele aferente ei.
          </Typography>
        )}

        <Stack spacing={1} sx={{ mt: 1 }}>
          {filteredOffers.map((o) => {
            const key =
              o.providerId ||
              (o.providerGroupId ? `group:${o.providerGroupId}` : null);
            const assignment = key ? assignmentsByKey[key] : null;

            const invitation = o.invitationId
              ? invitationsById[o.invitationId]
              : null;

            const price =
              o.priceTotal ?? o.price ?? o.totalCost ?? o.total ?? null;
            const currency = o.currency || invitation?.budgetCurrency || "RON";

            const details = normalizeOfferDetails(o.detailsJson);

            let title = "Ofertă";
            if (o.title) {
              title = o.title;
            } else if (o.providerName) {
              title = `Ofertă de la ${o.providerName}`;
            } else if (o.providerId) {
              title = `Ofertă de la provider #${o.providerId}`;
            }

            return (
              <Box
                key={o.id}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2">{title}</Typography>
                      {o.status && (
                        <Chip
                          size="small"
                          color={offerStatusColor(o.status)}
                          label={o.status}
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

                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Total ofertă: {formatCurrency(price, currency)}
                    </Typography>

                    {invitation && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Pentru invitația:{" "}
                          {invitation.roleHint || "serviciu"} • Buget propus:{" "}
                          {invitation.proposedBudget != null
                            ? formatCurrency(
                                invitation.proposedBudget,
                                invitation.budgetCurrency || currency
                              )
                            : "nespecificat"}
                        </Typography>
                        {invitation.status && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color={invitationStatusColor(invitation.status)}
                            label={invitation.status}
                          />
                        )}
                      </Stack>
                    )}

                    {details?.lines?.length ? (
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Detalii pachet:
                        </Typography>
                        <Stack
                          component="ul"
                          spacing={0.5}
                          sx={{ pl: 2, mt: 0.5 }}
                        >
                          {details.lines.map((line, idx) => {
                            const qty = line.qty != null ? line.qty : 1;
                            const amount =
                              line.amount != null ? Number(line.amount) : 0;
                            const base =
                              line.baseAmount != null
                                ? Number(line.baseAmount)
                                : null;

                            return (
                              <Typography
                                key={idx}
                                component="li"
                                variant="body2"
                                color="text.secondary"
                              >
                                {qty} x {line.label || "Serviciu"} –{" "}
                                {formatCurrency(amount, currency)}
                                {base != null && base !== amount && (
                                  <>
                                    {" "}
                                    (preț listă{" "}
                                    {formatCurrency(base, currency)})
                                  </>
                                )}
                              </Typography>
                            );
                          })}
                        </Stack>
                        {details.terms && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            Termeni: {details.terms}
                          </Typography>
                        )}
                      </>
                    ) : details?.raw ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Detalii pachet: {details.raw}
                      </Typography>
                    ) : null}
                  </Box>

                  {role === "client" && (
                    <Stack spacing={1} alignItems="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          onAssignmentFromOffer &&
                          onAssignmentFromOffer(o, "SHORTLISTED")
                        }
                      >
                        Add to shortlist
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          onAssignmentFromOffer &&
                          onAssignmentFromOffer(o, "SELECTED")
                        }
                      >
                        Select as chosen provider
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          onOfferDecision &&
                          onOfferDecision(o.id, "ACCEPTED_BY_CLIENT")
                        }
                      >
                        Acceptă oferta
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() =>
                          onOfferDecision &&
                          onOfferDecision(o.id, "REJECTED_BY_CLIENT")
                        }
                      >
                        Respinge
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
