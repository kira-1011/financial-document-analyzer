'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, Users, Mail, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { InviteMemberDialog } from '@/components/invite-member-dialog';
import {
  updateOrganizationAction,
  updateMemberRoleAction,
  removeMemberAction,
  cancelInvitationAction,
  deleteOrganizationAction,
} from '@/app/(dashboard)/settings/organization/actions';
import type { OrgState } from '@/types';
import type { OrganizationFormProps } from '@/types';

export function OrganizationForm({
  organization,
  invitations,
  currentUserId,
  canManage,
  isOwner,
}: OrganizationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Bind orgId to the action
  const boundUpdateAction = updateOrganizationAction.bind(null, organization.id);

  const [orgState, orgAction, isOrgPending] = useActionState<OrgState, FormData>(
    boundUpdateAction,
    {}
  );

  // Handle toast notifications for org updates
  useEffect(() => {
    if (orgState.success) {
      toast.success(orgState.message);
      router.refresh();
    } else if (orgState.message && !orgState.success) {
      toast.error(orgState.message);
    }
  }, [orgState, router]);

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    startTransition(async () => {
      const result = await updateMemberRoleAction(memberId, newRole);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    startTransition(async () => {
      const result = await removeMemberAction(memberId, organization.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    startTransition(async () => {
      const result = await cancelInvitationAction(invitationId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDeleteOrg = async () => {
    startTransition(async () => {
      const result = await deleteOrganizationAction();
      if (result?.message) {
        toast.error(result.message);
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const pendingInvitations = invitations?.filter((inv) => inv.status === 'pending');

  return (
    <div className="space-y-6 lg:max-w-2xl">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            {canManage
              ? 'Update your organization information'
              : 'View your organization information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={orgAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" name="name" defaultValue={organization.name} disabled={!canManage} />
              {orgState.errors?.name && (
                <p className="text-sm text-destructive">{orgState.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={organization.slug} disabled={!canManage} />
              {orgState.errors?.slug && (
                <p className="text-sm text-destructive">{orgState.errors.slug[0]}</p>
              )}
              <p className="text-xs text-muted-foreground">Used in URLs and must be unique</p>
            </div>
            {canManage && (
              <Button type="submit" disabled={isOrgPending}>
                {isOrgPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>
              {organization.members?.length} member{organization.members?.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {canManage && <InviteMemberDialog organizationId={organization.id} />}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organization.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {member.user.name}
                      {member.userId === currentUserId && (
                        <span className="text-muted-foreground ml-1">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                  {canManage && member.role !== 'owner' && member.userId !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleRoleChange(
                              member.id,
                              member.role === 'admin' ? 'member' : 'admin'
                            )
                          }
                        >
                          Make {member.role === 'admin' ? 'Member' : 'Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove from organization
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations?.length} pending invitation
              {pendingInvitations?.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations?.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">Invited as {invitation.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Permanently delete this organization and all its data</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                if (!isPending) {
                  setDeleteDialogOpen(open);
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Organization</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the organization{' '}
                    <strong>{organization.name}</strong> and remove all members and associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOrg}
                    disabled={isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Organization
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
