// src/components/provider/invitations/ProviderInvitationHeader.jsx
"use client";

import { Card, CardContent, Typography } from "@mui/material";

export default function ProviderInvitationHeader({ invitation, event }) {
  const ev = event || {};
  const eventDate = ev.date ? new Date(ev.date) : null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1">Detalii eveniment</Typography>
        <Typography variant="body2" color="text.secondary">
          {ev.type && `Tip: ${ev.type} • `}
          {eventDate && `Data: ${eventDate.toLocaleDateString()} • `}
          {ev.location && `Locație: ${ev.location}`}
          {ev.city && ` (${ev.city})`}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {invitation.message || invitation.note || "Fără mesaj"}
        </Typography>
        {invitation.proposedBudget && (
          <Typography variant="body2" color="text.secondary">
            Buget propus de client: {invitation.proposedBudget}{" "}
            {invitation.budgetCurrency || ""}
          </Typography>
        )}
        {invitation.replyDeadline && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Termen răspuns:{" "}
            {new Date(invitation.replyDeadline).toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
