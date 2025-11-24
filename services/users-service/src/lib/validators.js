const { z } = require('zod');

const userIdParam = z.object({ id: z.string().uuid() });

// pentru rută byAuthId – aici id-ul este authUserId (string, de obicei număr)
const authUserIdParam = z.object({
  id: z.string(), // dacă vrei doar numere: z.string().regex(/^\d+$/)
});

const updateProfileBody = z.object({
  fullName: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  locale: z.string().min(2).max(10).optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field required');

const roleMutationBody = z.object({
  add: z.array(z.enum(['ADMIN','CLIENT','PROVIDER'])).optional(),
  remove: z.array(z.enum(['ADMIN','CLIENT','PROVIDER'])).optional(),
}).refine(
  (d) => (d.add && d.add.length) || (d.remove && d.remove.length),
  'add or remove required'
);

module.exports = { userIdParam, authUserIdParam, updateProfileBody, roleMutationBody };
