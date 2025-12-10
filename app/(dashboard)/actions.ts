'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { CreateOrgState } from '@/types';

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export async function createOrganizationAction(
  prevState: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  // Validate input
  const validatedFields = createOrgSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, slug } = validatedFields.data;

  try {
    // Check if slug is already taken
    const slugCheck = await auth.api.checkOrganizationSlug({
      body: { slug },
      headers: await headers(),
    });

    if (!slugCheck.status) {
      return {
        errors: { slug: ['This slug is already taken'] },
      };
    }

    // Create organization using Better Auth API
    await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
      },
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Organization created successfully!',
    };
  } catch (error) {
    console.error('[createOrganization] Error:', error);
    return {
      message: 'Failed to create organization. Please try again.',
    };
  }
}
