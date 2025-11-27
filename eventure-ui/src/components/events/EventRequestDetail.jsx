// src/components/events/EventRequestDetail.jsx
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  invitationStatusColor,
  offerStatusColor,
} from "./eventStatusHelpers";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ro-RO");
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ro-RO");
}

function formatCurrency(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return "-";
  return `${Number(amount).toLocaleString("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || "RON"}`;
}

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

export default function EventRequestDetail({
  event,
  invitation,
  offers,
  onBackToEvent,
}) {
  const ev = event || {};
  const inv = invitation || {};
  const eventCurrency = ev.currency || "RON";

  const requestTitle =
    inv.roleHint ||
    ev.type ||
    "Cerere ofertă";

  const eventMeta = [
    {
      label: "Nume eveniment",
      value: ev.name,
    },
    {
      label: "Tip eveniment",
      value: ev.type,
    },
    {
      label: "Data eveniment",
      value: formatDate(ev.date),
    },
    {
      label: "Locație",
      value: ev.location,
    },
    {
      label: "Oraș",
      value: ev.city,
    },
    {
      label: "Număr invitați",
      value: ev.guestCount != null ? String(ev.guestCount) : null,
    },
    {
      label: "Buget general (brief)",
      value:
        ev.budgetPlanned != null
          ? formatCurrency(ev.budgetPlanned, eventCurrency)
          : null,
    },
  ];

  const proposedBudget =
    inv.proposedBudget != null ? Number(inv.proposedBudget) : null;
  const budgetCurrency = inv.budgetCurrency || eventCurrency;

  const requestMeta = [
    {
      label: "Rol / categorie",
      value: inv.roleHint,
    },
    {
      label: "Buget propus pentru această solicitare",
      value:
        proposedBudget != null
          ? formatCurrency(proposedBudget, budgetCurrency)
          : null,
    },
    {
      label: "Monedă buget",
      value: budgetCurrency,
    },
    {
      label: "Deadline răspuns",
      value: inv.replyDeadline ? formatDate(inv.replyDeadline) : null,
    },
    {
      label: "Status invitație",
      value: inv.status,
      isStatus: true,
    },
  ];

  const offersCount = Array.isArray(offers) ? offers.length : 0;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToEvent}
          size="small"
        >
          Înapoi la eveniment
        </Button>
        <Box sx={{ flex: 1 }} />
      </Stack>

      <Box>
        <Typography variant="h5" gutterBottom>
          Cerere ofertă – {requestTitle}
        </Typography>
        {ev.name && (
          <Typography variant="subtitle1" color="text.secondary">
            Eveniment: {ev.name}
          </Typography>
        )}
      </Box>

      {/* Eveniment */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Detalii eveniment
          </Typography>
          <Stack spacing={0.5}>
            {eventMeta
              .filter((m) => m.value !== null && m.value !== undefined && m.value !== "")
              .map((m) => (
                <Typography key={m.label} variant="body2">
                  <strong>{m.label}:</strong> {m.value}
                </Typography>
              ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Request / invitație */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Detalii cerere ofertă
          </Typography>

          <Stack spacing={0.5} sx={{ mb: 1 }}>
            {requestMeta
              .filter((m) => m.value !== null && m.value !== undefined && m.value !== "")
              .map((m) =>
                m.isStatus ? (
                  <Stack
                    key={m.label}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography variant="body2">
                      <strong>{m.label}:</strong>
                    </Typography>
                    <Chip
                      size="small"
                      color={invitationStatusColor(inv.status)}
                      label={String(m.value)}
                    />
                  </Stack>
                ) : (
                  <Typography key={m.label} variant="body2">
                    <strong>{m.label}:</strong> {m.value}
                  </Typography>
                )
              )}
          </Stack>

          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Mesaj către provideri:</strong>{" "}
            {inv.message || inv.note || "Fără mesaj specificat."}
          </Typography>

          {inv.createdAt && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              Invitație creată la: {formatDateTime(inv.createdAt)}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Oferte pentru acest request */}
      <Card>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="subtitle1">
                Oferte primite pentru această cerere
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ai {offersCount} ofertă(e) pentru această solicitare de ofertă.
              </Typography>
            </Box>
          </Stack>

          {!offersCount && (
            <Typography variant="body2" color="text.secondary">
              Nu ai primit încă oferte pentru această cerere. Poți aștepta
              răspunsurile providerilor sau poți trimite invitații suplimentare
              din pagina principală a evenimentului.
            </Typography>
          )}

          <Stack spacing={1} sx={{ mt: 1 }}>
            {offers.map((o) => {
              const price =
                o.priceTotal ??
                o.totalCost ??
                o.price ??
                o.total ??
                null;
              const currency =
                o.currency || inv.budgetCurrency || eventCurrency;

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
                      </Stack>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Total ofertă: {formatCurrency(price, currency)}
                      </Typography>

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
                              const qty =
                                line.qty != null ? Number(line.qty) : 1;
                              const amount =
                                line.amount != null
                                  ? Number(line.amount)
                                  : 0;
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

                      {o.notes && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Notă furnizor: {o.notes}
                        </Typography>
                      )}

                      {o.createdAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          Ofertă trimisă la: {formatDateTime(o.createdAt)}
                        </Typography>
                      )}
                    </Box>

                    {/* În viitor putem adăuga acțiuni (accept / shortlist) direct aici */}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
