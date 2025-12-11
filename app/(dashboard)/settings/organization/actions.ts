'use server';

import { APIError } from 'better-auth/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import type { MemberActionState, OrgState } from '@/types';

// Schemas
const updateOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

// Actions
export async function updateOrganizationAction(
  orgId: string,
  prevState: OrgState,
  formData: FormData
): Promise<OrgState> {
  const validatedFields = updateOrgSchema.safeParse({
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
    // Get current organization to check if slug changed
    const currentOrg = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    // Only check slug if it's different from the current one
    if (currentOrg && slug !== currentOrg.slug) {
      const slugCheck = await auth.api.checkOrganizationSlug({
        body: { slug },
      });

      // slugCheck.status true means the slug is available
      if (!slugCheck.status) {
        return {
          errors: {
            slug: ['This slug is already taken. Please choose a different one.'],
          },
        };
      }
    }

    await auth.api.updateOrganization({
      body: {
        organizationId: orgId,
        data: { name, slug },
      },
      headers: await headers(),
    });

    revalidatePath('/settings/organization');

    return {
      success: true,
      message: 'Organization updated successfully',
    };
  } catch (error) {
    console.error('[updateOrganizationAction] Error:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to update organization',
    };
  }
}

// Update member role
export async function updateMemberRoleAction(
  memberId: string,
  role: 'admin' | 'member'
): Promise<MemberActionState> {
  try {
    await auth.api.updateMemberRole({
      body: { memberId, role },
      headers: await headers(),
    });

    revalidatePath('/settings/organization');

    return {
      success: true,
      message: 'Member role updated',
    };
  } catch (error) {
    console.error('[updateMemberRoleAction] Error:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to update role',
    };
  }
}

// Remove member from organization
export async function removeMemberAction(
  memberIdOrEmail: string,
  organizationId: string
): Promise<MemberActionState> {
  try {
    await auth.api.removeMember({
      body: { memberIdOrEmail, organizationId },
      headers: await headers(),
    });

    revalidatePath('/settings/organization');

    return {
      success: true,
      message: 'Member removed',
    };
  } catch (error) {
    console.error('[removeMemberAction] Error:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to remove member',
    };
  }
}

// Cancel invitation
export async function cancelInvitationAction(invitationId: string): Promise<MemberActionState> {
  try {
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: await headers(),
    });

    revalidatePath('/settings/organization');

    return {
      success: true,
      message: 'Invitation cancelled',
    };
  } catch (error) {
    console.error('[cancelInvitationAction] Error:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to cancel invitation',
    };
  }
}

// Delete organization
export async function deleteOrganizationAction(): Promise<MemberActionState> {
  try {
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!org) {
      return { message: 'Organization not found' };
    }

    await auth.api.deleteOrganization({
      body: { organizationId: org.id },
      headers: await headers(),
    });
  } catch (error) {
    console.error('[deleteOrganizationAction] Error:', error);
    return {
      message: error instanceof APIError ? error.message : 'Failed to delete organization',
    };
  }

  redirect('/');
}
