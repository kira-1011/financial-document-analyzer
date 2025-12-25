'use client';

import { Loader2, Lock, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  changePasswordAction,
  deleteAccountAction,
  setPasswordAction,
  updateProfileAction,
} from '@/app/(dashboard)/settings/profile/actions';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  DeleteAccountState,
  PasswordState,
  ProfileFormProps,
  ProfileState,
  SetPasswordState,
} from '@/types';

export function ProfileForm({ user, hasPassword }: ProfileFormProps) {
  const router = useRouter();

  // Profile form state
  const [profileState, profileAction, isProfilePending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {}
  );

  // Password form state (for users with password)
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(changePasswordAction, {});

  // Set password form state (for OAuth users without password)
  const [setPasswordState, setPasswordFormAction, isSetPasswordPending] = useActionState<
    SetPasswordState,
    FormData
  >(setPasswordAction, {});

  // Delete account state
  const [deleteState, deleteAction, isDeletePending] = useActionState<DeleteAccountState, FormData>(
    deleteAccountAction,
    {}
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handle toast notifications
  useEffect(() => {
    if (profileState.success) {
      toast.success(profileState.message);
      router.refresh(); // Add this line to refetch page data
    } else if (profileState.message && !profileState.success) {
      toast.error(profileState.message);
    }
  }, [profileState, router]); // Add router to dependencies

  useEffect(() => {
    if (passwordState.success) {
      toast.success(passwordState.message);
      router.refresh();
    } else if (passwordState.message && !passwordState.success) {
      toast.error(passwordState.message);
    }
  }, [passwordState, router]);

  useEffect(() => {
    if (setPasswordState.success) {
      toast.success(setPasswordState.message);
      router.refresh();
    } else if (setPasswordState.message && !setPasswordState.success) {
      toast.error(setPasswordState.message);
    }
  }, [setPasswordState, router]);

  useEffect(() => {
    if (deleteState.message) {
      toast.error(deleteState.message);
    }
  }, [deleteState]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 lg:max-w-2xl">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <form action={profileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} />
              {profileState.errors?.name && (
                <p className="text-sm text-destructive">{profileState.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Section - Different UI based on hasPassword */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {hasPassword ? 'Change Password' : 'Set Password'}
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? 'Update your password to keep your account secure'
              : 'Add a password to sign in with email and password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            <form action={passwordAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" />
                {passwordState.errors?.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordState.errors.currentPassword[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" />
                {passwordState.errors?.newPassword && (
                  <p className="text-sm text-destructive">{passwordState.errors.newPassword[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" />
                {passwordState.errors?.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordState.errors.confirmPassword[0]}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          ) : (
            <form action={setPasswordFormAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You signed in with Google. Set a password to also sign in with your email.
              </p>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" />
                {setPasswordState.errors?.newPassword && (
                  <p className="text-sm text-destructive">
                    {setPasswordState.errors.newPassword[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" />
                {setPasswordState.errors?.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {setPasswordState.errors.confirmPassword[0]}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSetPasswordPending}>
                {isSetPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              // Prevent closing while deletion is in progress
              if (!isDeletePending) {
                setDeleteDialogOpen(open);
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form action={deleteAction}>
                <input type="hidden" name="hasPassword" value={hasPassword.toString()} />
                <div className="space-y-4 py-4">
                  {hasPassword ? (
                    <div className="space-y-2">
                      <Label htmlFor="delete-password">Enter your password to confirm</Label>
                      <Input
                        id="delete-password"
                        name="password"
                        type="password"
                        placeholder="Your password"
                      />
                      {deleteState.errors?.password && (
                        <p className="text-sm text-destructive">{deleteState.errors.password[0]}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="delete-email">
                        Enter your email <span className="font-mono text-muted-foreground">({user.email})</span> to confirm
                      </Label>
                      <Input
                        id="delete-email"
                        name="email"
                        type="email"
                        placeholder={user.email}
                      />
                      {deleteState.errors?.email && (
                        <p className="text-sm text-destructive">{deleteState.errors.email[0]}</p>
                      )}
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button" disabled={isDeletePending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="submit"
                    disabled={isDeletePending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
