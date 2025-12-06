"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

interface InviteMemberDialogProps {
    organizationId: string;
}

export function InviteMemberDialog({ organizationId }: InviteMemberDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"member" | "admin">("member");
    const [loading, setLoading] = useState(false);

    const handleInvite = async () => {
        if (!email) return;

        setLoading(true);
        try {
            await authClient.organization.inviteMember({
                email,
                role,
                organizationId,
            });

            toast.success(`Invitation sent to ${email}`);
            setOpen(false);
            setEmail("");
            setRole("member");
            router.refresh(); // Refresh to show new invitation
        } catch (error) {
            toast.error("Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to join your organization.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as "member" | "admin")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member - Can view and create documents</SelectItem>
                                <SelectItem value="admin">Admin - Can manage documents and members</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={loading || !email}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Invitation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}