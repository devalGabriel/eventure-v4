// services/notifications-service/src/subscribers/providers.js

async function createNotification({ userId, title, message, meta }) {
  const { prisma } = fastify; // tu deja ai fixat fastify aici

  if (!userId) return;
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      meta: meta ? JSON.stringify(meta) : null,
      read: false
    }
  });
}

export async function registerProviderSubscribers(nc, env = process.env) {
  if (!nc) return;

  // când user aplică -> notifică adminii
  const subApply = nc.subscribe(env.NATS_TOPIC_PROVIDER_APPLY || 'provider.apply.created');
  (async () => {
    for await (const m of subApply) {
      try {
        const payload = JSON.parse(m.data.toString('utf8'));
        const adminId = env.ADMIN_USER_ID || null;
        if (adminId) {
          await createNotification({
            userId: adminId,
            title: 'Provider application',
            message: `User ${payload.userId} has applied to become a provider.`,
            meta: {
              type: 'provider-application-admin',
              applicationId: payload.applicationId || payload.id,
              applicantUserId: payload.userId,
            }
          });
        }
      } catch {}
    }
  })();

  // când admin decide -> notifică aplicantul
  const subDecided = nc.subscribe(env.NATS_TOPIC_PROVIDER_DECIDED || 'provider.apply.decided');
  (async () => {
    for await (const m of subDecided) {
      try {
        const payload = JSON.parse(m.data.toString('utf8'));
        const isApproved = payload.status === 'approved';

        await createNotification({
          userId: payload.userId,
          title: isApproved
            ? 'Cererea de provider a fost aprobată'
            : 'Cererea de provider a fost respinsă',
          message: isApproved
            ? 'Poți accesa acum funcționalitățile de furnizor.'
            : `Cererea ta a fost respinsă.${payload.reasonText ? ` Motiv: ${payload.reasonText}` : ''}`,
          meta: {
            type: 'provider-application-user',
            applicationId: payload.applicationId,
            status: payload.status,
            reasonCode: payload.reasonCode || null,
            reasonText: payload.reasonText || null,
          }
        });
      } catch {}
    }
  })();
}
