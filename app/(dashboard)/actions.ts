'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { deleteDocument, fetchDocument } from '@/lib/documents/api';
import { runs } from '@trigger.dev/sdk/v3';
import type { CreateOrgState } from '@/types';

// ============================================================================
// Organization Actions
// ============================================================================

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
    const slugCheck = await auth.api.checkOrganizationSlug({
      body: { slug },
      headers: await headers(),
    });

    if (!slugCheck.status) {
      return {
        errors: { slug: ['This slug is already taken'] },
      };
    }

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

// ============================================================================
// Document Actions
// ============================================================================

export async function deleteDocumentAction(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          document: ['delete'],
        },
      },
    });

    if (!hasPermission.success) {
      return { success: false, error: "You don't have permission to delete documents" };
    }

    await deleteDocument(documentId);
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('[deleteDocumentAction] Error:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

export async function reprocessDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const document = await fetchDocument(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    if (document.runId) {
      await runs.replay(document.runId);
    }

    return { success: true };
  } catch (error) {
    console.error('[reprocessDocumentAction] Error:', error);
    return { success: false, error: 'Failed to reprocess document' };
  }
}
