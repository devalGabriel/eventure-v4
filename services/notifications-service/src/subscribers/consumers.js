// services/notifications-service/src/subscribers/consumers.js
module.exports.registerConsumers = async function registerConsumers(fastify) {
  const { prisma } = fastify;
  const nc = fastify.nats;
  if (!nc) {
    fastify.log.warn('NATS not connected, skipping notification consumers');
    return;
  }

  // Util: helper pentru creare notificare
  async function createNotification({ authUserId, title, body, data, type }) {
    if (!authUserId) return;
    await prisma.notification.create({
      data: {
        authUserId: String(authUserId),
        title,
        body,
        data: data || {},
        type: type || 'GENERIC',
      },
    });
  }

  // ---- TOPICURI GENERICE ----
  const genericTopics = [
    process.env.NATS_TOPIC_NOTIFY_GENERIC || 'notify.generic',
    process.env.NATS_TOPIC_USERS_PROFILE_UPDATED || 'users.profile.updated',
  ];

  for (const subj of genericTopics) {
    const sub = nc.subscribe(subj);
    (async () => {
      for await (const m of sub) {
        try {
          const payload = JSON.parse(m.data?.toString() || '{}');
          const { authUserId, userId, title, body, data, type } = payload || {};
          const targetId = String(authUserId || userId || '');
          if (!targetId || !title || !body) continue;

          await createNotification({
            authUserId: targetId,
            title,
            body,
            data,
            type: type || subj,
          });
        } catch (err) {
          fastify.log.error({ err }, `Failed to process ${subj}`);
        }
      }
    })();
  }

  // ---- PROVIDER APPLY / DECISION / ROLE UPDATED ----
  const providerTopics = [
    process.env.NATS_TOPIC_PROVIDER_APPLY || 'provider.apply.created',
    process.env.NATS_TOPIC_PROVIDER_DECIDED || 'provider.apply.decided',
    process.env.NATS_TOPIC_USERS_ROLE_UPDATED || 'users.role.updated',
  ];

  for (const subj of providerTopics) {
    const sub = nc.subscribe(subj);
    (async () => {
      for await (const m of sub) {
        try {
          const evt = JSON.parse(m.data?.toString() || '{}');
          const { userId, status, note } = evt || {};

          // 1) user a aplicat -> notificăm adminii
          if (subj.endsWith('provider.apply.created')) {
            const ids = (process.env.ADMIN_USER_IDS || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            for (const id of ids) {
              await createNotification({
                authUserId: id,
                title: 'Cerere nouă de furnizor',
                body: `Un utilizator (${userId}) a trimis o cerere de activare ca furnizor.${
                  note ? ` Notă: ${note}` : ''
                }`,
                data: evt,
                type: 'PROVIDER_APPLY',
              });
            }
          }
          // 2) admin a decis -> notificăm aplicantul
          else if (subj.endsWith('provider.apply.decided')) {
            if (userId) {
              const approved = status === 'APPROVED';
              await createNotification({
                authUserId: userId,
                title: approved
                  ? 'Cererea ta de furnizor a fost aprobată'
                  : 'Cererea ta de furnizor a fost respinsă',
                body: approved
                  ? 'Felicitări! Poți să îți configurezi profilul de furnizor și să adaugi servicii.'
                  : 'Cererea ta de furnizor a fost respinsă. Poți încerca din nou după ce actualizezi informațiile din cont.',
                data: evt,
                type: 'PROVIDER_DECISION',
              });
            }
          }
          // 3) rol actualizat explicit (din users-service)
          else if (subj.endsWith('users.role.updated')) {
            if (userId) {
              await createNotification({
                authUserId: userId,
                title: 'Rol actualizat',
                body: 'Drepturile tale în aplicație au fost actualizate. Este posibil să vezi meniuri și funcționalități noi.',
                data: evt,
                type: 'ROLE_UPDATED',
              });
            }
          }
        } catch (err) {
          fastify.log.error({ err }, `Failed to process ${subj}`);
        }
      }
    })();
  }
    // ---- MESAJ NOU ÎN THREAD DE EVENIMENT / OFERTĂ ----
  // Ascultăm topic-ul pentru mesaje create, în cazul în care vrem să derivăm notificări
  // suplimentare din NATS. În prezent, events-service trimite notificările principale
  // prin HTTP (/internal/notify), deci aici doar pregătim mecanismul pentru orice
  // extensii viitoare (ex: push, log suplimentar etc.).
  (function subscribeEventMessages() {
    const subj = process.env.NATS_TOPIC_EVENT_MESSAGE || 'message.created';
    const sub = nc.subscribe(subj);
    (async () => {
      for await (const m of sub) {
        try {
          const payload = JSON.parse(m.data?.toString() || '{}');
          const { eventId, offerId, messageId, by, recipients } = payload || {};

          // Dacă nu avem destinatari expliciți, nu creăm notificări aici
          // (events-service a trimis deja notificările esențiale via HTTP).
          if (!Array.isArray(recipients) || !recipients.length) {
            fastify.log.info(
              { eventId, offerId, messageId },
              'EVENT_MESSAGE from NATS (fără recipients) – skip notificări duplicate'
            );
            continue;
          }

          // Exemplu de creare de notificări suplimentare (dacă vrei să folosești acest canal):
          for (const authUserId of recipients) {
            await createNotification({
              authUserId,
              title: 'Mesaj nou la eveniment',
              body: 'Ai un mesaj nou într-un thread de eveniment.',
              data: { eventId, offerId: offerId || null, messageId },
              type: 'EVENT_MESSAGE',
            });
          }
        } catch (err) {
          fastify.log.error({ err }, 'Failed to process EVENT_MESSAGE (message.created)');
        }
      }
    })();
  })();

};
