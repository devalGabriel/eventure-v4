import { z } from 'zod';

export const inviteSchema = z.object({
  invitedId: z.string().min(1),
  role: z.enum(['CLIENT','PROVIDER','GUEST','STAFF']).default('PROVIDER'),
  message: z.string().optional()
});

export const respondInviteSchema = z.object({
  status: z.enum(['ACCEPTED','DECLINED'])
});
