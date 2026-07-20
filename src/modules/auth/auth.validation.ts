import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "A senha deve ter ao menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve ter ao menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve ter ao menos um número"),
    name: z.string().min(2).max(100).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
