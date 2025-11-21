import { z } from 'zod';

export const addAttachmentSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  url: z.string().url()
});
