// eventure-ui/src/lib/notificationRoutes.js
export function notificationTarget(notification, locale = 'ro') {
  const meta = notification?.meta || notification?.data || {};
  const type = notification?.type || meta.type;

  switch (type) {
    // 🔹 Notificare pentru admin când cineva aplică ca provider
    case 'PROVIDER_APPLY':
    case 'provider-application-admin':
      // listă aplicații, admin decide de acolo
      return `/${locale}/admin/providers/applications`;

    // 🔹 Notificare pentru user când cererea lui de provider a fost decisă
    case 'PROVIDER_DECISION':
    case 'provider-application-user': {
      const status = (meta.status || '').toUpperCase();

      // dacă e aprobat → du-l direct la profilul de furnizor
      if (status === 'APPROVED') {
        return `/${locale}/dashboard/provider/profile`;
      }

      // dacă e respins sau altceva → la pagina de apply, să poată re-aplica / vedea mesajul
      return `/${locale}/profile/provider/apply`;
    }
    case "EVENT_INVITATION_SENT": {
      // provider invitat la un eveniment
      if (meta.eventId) {
        return `/${locale}/dashboard/provider/invitations`;
      }
      return `/${locale}/dashboard/provider/invitations`;
    }

    case "EVENT_INVITATION_DECIDED": {
      // client află că providerul a acceptat/declinat
      if (meta.eventId) {
        return `/${locale}/events/${meta.eventId}`;
      }
      return `/${locale}/events`;
    }

    case "EVENT_OFFER_SUBMITTED":
    case "EVENT_OFFER_REVISED": {
      // client – ofertă nouă / revizuită
      if (meta.eventId) {
        return `/${locale}/events/${meta.eventId}`;
      }
      return `/${locale}/events`;
    }

    case "EVENT_OFFER_DECIDED": {
      // provider – oferta lui a fost acceptată / respinsă
      if (meta.eventId) {
        return `/${locale}/dashboard/provider/events`;
      }
      return `/${locale}/dashboard/provider`;
    }

    case "EVENT_PROVIDER_SELECTED": {
      // provider selectat / confirmat pre-contract
      if (meta.eventId) {
        return `/${locale}/dashboard/provider/events`;
      }
      return `/${locale}/dashboard/provider`;
    }

    // 🔹 Notificări de plată (ex: facturi)
    case 'payment':
      if (meta.invoiceId) {
        return `/${locale}/billing/invoices/${meta.invoiceId}`;
      }
      return `/${locale}/billing`;

    // 🔹 Mesaje / conversații
    case 'message':
      if (meta.threadId) {
        return `/${locale}/messages/${meta.threadId}`;
      }
      return `/${locale}/messages`;

    // fallback: nimic specific, rămâne în pagina curentă
    default:
      return null;
  }
}
