import { z } from 'zod';

const phoneRegex = /^\+7\d{10}$/;
const passwordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
  .regex(/[0-9]/, 'Пароль должен содержать цифру');

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(50),
  email: z.string().email('Некорректный email').optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Некорректный номер телефона. Формат: +7XXXXXXXXXX'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Введите email или телефон'),
  password: z.string().min(1, 'Введите пароль'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Токен обязателен'),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Токен обязателен'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50).optional(),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(50).optional(),
  email: z.string().email('Некорректный email').optional().nullable(),
  phone: z.string().regex(phoneRegex, 'Некорректный номер телефона. Формат: +7XXXXXXXXXX').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
