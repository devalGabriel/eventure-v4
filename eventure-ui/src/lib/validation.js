import { z } from 'zod';

export const schemaLogin = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere')
});

export const schemaRegister = z.object({
  name: z.string().min(2, 'Numele e prea scurt'),
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere')
});

export const schemaForgot = z.object({
  email: z.string().email('Email invalid')
});
