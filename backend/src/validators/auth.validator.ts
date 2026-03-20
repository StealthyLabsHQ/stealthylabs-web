import { z } from 'zod';

// Register validation schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').min(5).max(255),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  displayName: z.string()
    .min(3, 'Display name must be at least 3 characters')
    .max(50, 'Display name must not exceed 50 characters')
    .optional(),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;