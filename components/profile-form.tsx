"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ProfileState, PasswordState, DeleteAccountState } from "@/types";
import {
    updateProfileAction,
    changePasswordAction,
    deleteAccountAction,
} from "@/app/settings/profile/actions";

interface ProfileFormProps {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();

    // Profile form state
    const [profileState, profileAction, isProfilePending] = useActionState<ProfileState, FormData>(
        updateProfileAction,
        {}
    );

    // Password form state
    const [passwordState, passwordAction, isPasswordPending] = useActionState<PasswordState, FormData>(
        changePasswordAction,
        {}
    );

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
            // Reset password form by refreshing
            router.refresh();
        } else if (passwordState.message && !passwordState.success) {
            toast.error(passwordState.message);
        }
    }, [passwordState, router]);

    useEffect(() => {
        if (deleteState.message) {
            toast.error(deleteState.message);
        }
    }, [deleteState]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
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
                    <CardDescription>
                        Update your personal information
                    </CardDescription>
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
                            <Input
                                id="name"
                                name="name"
                                defaultValue={user.name}
                            />
                            {profileState.errors?.name && (
                                <p className="text-sm text-destructive">{profileState.errors.name[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>
                        <Button type="submit" disabled={isProfilePending}>
                            {isProfilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={passwordAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                            />
                            {passwordState.errors?.currentPassword && (
                                <p className="text-sm text-destructive">{passwordState.errors.currentPassword[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                            />
                            {passwordState.errors?.newPassword && (
                                <p className="text-sm text-destructive">{passwordState.errors.newPassword[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                            />
                            {passwordState.errors?.confirmPassword && (
                                <p className="text-sm text-destructive">{passwordState.errors.confirmPassword[0]}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={isPasswordPending}>
                            {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanently delete your account and all associated data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove all your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <form action={deleteAction}>
                                <div className="space-y-4 py-4">
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
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
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