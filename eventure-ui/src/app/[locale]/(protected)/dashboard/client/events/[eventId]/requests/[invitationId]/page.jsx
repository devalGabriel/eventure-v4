// src/app/[locale]/(protected)/dashboard/client/events/[eventId]/requests/[invitationId]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  LinearProgress,
  Typography,
  Alert,
} from "@mui/material";

import EventRequestDetail from "@/components/events/EventRequestDetail";
import { getEventRequestDetail } from "@/lib/api/eventsClient";

export default function ClientEventRequestDetailPage() {
  const params = useParams();
  const router = useRouter();

  const locale = Array.isArray(params?.locale)
    ? params.locale[0]
    : params?.locale;

  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params?.eventId;

  const invitationId = Array.isArray(params?.invitationId)
    ? params.invitationId[0]
    : params?.invitationId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [event, setEvent] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!eventId || !invitationId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/events/${eventId}/invitations/${invitationId}`,
          { cache: "no-store" }
        );
        const txt = await res.text();
        if (!res.ok) {
          throw new Error(txt || `Failed with status ${res.status}`);
        }

        const json = txt ? JSON.parse(txt) : null;
        if (!json || cancelled) return;

        setEvent(json.event || null);
        setInvitation(json.invitation || null);
        setOffers(Array.isArray(json.offers) ? json.offers : json.offers?.rows || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(String(err?.message || err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, invitationId]);

  const handleBackToEvent = () => {
    if (!eventId || !locale) return;
    router.push(`/${locale}/dashboard/client/events/${eventId}`);
  };

  if (loading && !invitation) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !invitation) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!invitation) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Request (invitație) inexistent(ă) sau inaccesibil(ă).</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <EventRequestDetail
        event={event}
        invitation={invitation}
        offers={offers}
        onBackToEvent={handleBackToEvent}
      />
    </Box>
  );
}
