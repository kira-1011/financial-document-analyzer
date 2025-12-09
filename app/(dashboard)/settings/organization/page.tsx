import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { OrganizationForm } from '@/components/organization-form';
import { UserRole } from '@/lib/auth-types';

export default async function OrganizationSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Get full organization with members
  const activeOrg = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrg) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No organization selected.</p>
      </div>
    );
  }

  // Get pending invitations
  const invitations = await auth.api.listInvitations({
    query: { organizationId: activeOrg.id },
    headers: await headers(),
  });

  // Get current user's role in this organization
  const currentMember = activeOrg.members.find((m) => m.userId === session.user.id);
  const userRole: UserRole = (currentMember?.role as UserRole) || 'member';
  const canManage = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  return (
    <OrganizationForm
      organization={activeOrg}
      invitations={invitations || []}
      currentUserId={session.user.id}
      canManage={canManage}
      isOwner={isOwner}
    />
  );
}
