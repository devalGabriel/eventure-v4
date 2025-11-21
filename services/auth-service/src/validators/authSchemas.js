import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalid"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
  name: z.string().min(2, "Nume prea scurt"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
