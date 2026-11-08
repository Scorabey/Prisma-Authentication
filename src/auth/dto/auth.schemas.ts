import { z } from "zod";

export const signInSchema = z.object({
    email: z.email(),
    password: z.string()
})

export const signUpSchema = z.object({
    email: z.email(),
    password: z.string().min(12).max(128)
})

export type SignInDto = z.infer<typeof signInSchema>;
export type SignUpDto = z.infer<typeof signUpSchema>;