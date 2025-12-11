'use server';

import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import type { DeleteAccountState, PasswordState, ProfileState } from '@/types';

// Schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm deletion'),
});

// Actions
export async function updateProfileAction(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;

  try {
    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    });

    revalidatePath('/settings/profile');

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (_error) {
    return {
      message: 'Failed to update profile',
    };
  }
}

export async function changePasswordAction(
  prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('[changePasswordAction] Error changing password:', error);
    return {
      message:
        error instanceof APIError
          ? error.message
          : 'Failed to change password. Check your current password.',
    };
  }
}

export async function deleteAccountAction(
  prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const validatedFields = deleteAccountSchema.safeParse({
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await auth.api.deleteUser({
      body: {
        password: validatedFields.data.password,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error('[deleteAccountAction] Error deleting account:', error);
    return {
      message:
        error instanceof APIError
          ? error.message
          : 'Failed to delete account. Check your password.',
    };
  }

  redirect('/login');
}
