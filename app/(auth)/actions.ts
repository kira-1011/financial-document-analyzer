'use server';

import { APIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import type { LoginState, SignupState } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  callbackUrl: z.string().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    callbackUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    callbackUrl: formData.get('callbackUrl'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, callbackUrl } = validatedFields.data;

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
        callbackURL: callbackUrl,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error('[loginAction] Error logging in:', error);

    return {
      message: error instanceof APIError ? error.message : 'Invalid email or password',
    };
  }

  // Redirect to callbackUrl or home
  redirect(callbackUrl || '/');
}

export async function signupAction(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    callbackUrl: formData.get('callbackUrl'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, callbackUrl } = validatedFields.data;

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        callbackURL: callbackUrl,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error('[signupAction] Error creating account:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to create account',
    };
  }

  // Redirect to callbackUrl or home
  redirect(callbackUrl || '/');
}
