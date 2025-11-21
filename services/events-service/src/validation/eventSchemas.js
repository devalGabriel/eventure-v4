import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  notes: z.string().optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  currency: z.string().default('RON')
});

export const updateEventSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.string().min(2).optional(),
  notes: z.string().optional(),
  date: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(['DRAFT','PLANNING','ACTIVE','COMPLETED','CANCELED']).optional()
});
