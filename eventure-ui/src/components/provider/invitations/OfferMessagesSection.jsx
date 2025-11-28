// src/components/provider/invitations/OfferMessagesSection.jsx
"use client";

import MessagesThread from "@/components/shared/MessagesThread";
import { getOfferMessages, postOfferMessage } from "@/lib/api/eventsClient";

export default function OfferMessagesSection({ offerId }) {
  if (!offerId) return null;

  return (
    <MessagesThread
      context={{ offerId }}
      fetchMessages={() => getOfferMessages(offerId)}
      sendMessage={(body) => postOfferMessage(offerId, body)}
      title="Mesaje / negocieri"
    />
  );
}
