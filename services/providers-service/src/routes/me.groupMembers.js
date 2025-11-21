// services/providers-service/src/routes/me.groupMembers.js
import { prisma } from '../lib/prisma.js';

/**
 * Route: /me/groups/:groupId/members
 */
export async function meGroupMembersRoutes(app) {
  // Adăugare membru în grup
  app.post('/me/groups/:groupId/members', {
    schema: {
      body: {
        type: 'object',
        required: ['providerProfileId', 'serviceOfferId'],
        properties: {
          providerProfileId: { type: 'integer' },
          serviceOfferId: { type: 'integer' },
          specializationTag: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEW_ONLY'] },
          shareMode: { type: 'string', enum: ['NONE', 'PERCENT', 'FIXED'], nullable: true },
          shareValue: { type: 'number', nullable: true }
        }
      }
    }
  }, async (request, reply) => {
    const userId = request.user.id; // din JWT, cum ai și în alte rute
    const groupId = Number(request.params.groupId);
    const {
      providerProfileId,
      serviceOfferId,
      specializationTag,
      role = 'MEMBER',
      shareMode = 'NONE',
      shareValue = null
    } = request.body;

    // 1. Validare: user este owner/admin al grupului
    const group = await prisma.providerGroup.findFirst({
      where: {
        id: groupId,
        providerProfile: { userId } // owner-ul grupului trebuie să fie user-ul curent
      },
      select: { id: true }
    });

    if (!group) {
      return reply.code(403).send({ message: 'Nu ai drepturi să modifici acest grup.' });
    }

    // 2. Validare: serviceOffer aparține providerProfile-ului respectiv
    const service = await prisma.serviceOffer.findFirst({
      where: {
        id: serviceOfferId,
        providerProfileId
      },
      select: { id: true, title: true }
    });

    if (!service) {
      return reply.code(400).send({
        message: 'ServiceOffer-ul selectat nu aparține acestui providerProfile.'
      });
    }

    // 3. Creare membru – unic pe (groupId, serviceOfferId)
    try {
      const member = await prisma.providerGroupMember.create({
        data: {
          groupId,
          providerProfileId,
          serviceOfferId,
          specializationTag,
          role,
          shareMode,
          shareValue
        },
        include: {
          providerProfile: true,
          serviceOffer: true
        }
      });

      return reply.code(201).send(member);
    } catch (err) {
      if (err.code === 'P2002') {
        return reply.code(409).send({
          message: 'Acest serviciu este deja adăugat în grup.'
        });
      }
      request.log.error(err);
      return reply.code(500).send({ message: 'Eroare la salvarea membrului de grup.' });
    }
  });

  // alte rute (GET, PATCH, DELETE) pot fi adăugate aici ulterior
}
