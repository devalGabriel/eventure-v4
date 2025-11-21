import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: z.string().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(['TODO','IN_PROGRESS','DONE','BLOCKED']).optional()
});
