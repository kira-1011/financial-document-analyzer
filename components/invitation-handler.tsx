"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { organization } from "@/lib/auth-client";
import { toast } from "sonner";

interface Invitation {
    organizationName: string;
    organizationSlug: string;
    inviterEmail: string;
    id: string;
    status: "pending" | "accepted" | "rejected" | "canceled";
    email: string;
    expiresAt: Date;
    organizationId: string;
    role: string;
    inviterId: string;
}

interface InvitationHandlerProps {
    invitation: Invitation;
    invitationId: string;
}

export function InvitationHandler({ invitation, invitationId }: InvitationHandlerProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
        invitation.status === "pending" ? "pending" : invitation.status as "accepted" | "rejected"
    );
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        const res = await organization.acceptInvitation({
            invitationId,
        });

        if (res.error) {
            toast.error(res.error.message || "Failed to accept invitation");
            setIsAccepting(false);
        } else {
            setStatus("accepted");
            toast.success("Welcome to the organization!");
            setTimeout(() => router.push("/"), 1500);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        const res = await organization.rejectInvitation({
            invitationId,
        });

        if (res.error) {
            toast.error(res.error.message || "Failed to decline invitation");
            setIsRejecting(false);
        } else {
            setStatus("rejected");
        }
    };

    // Already processed invitation
    if (invitation.status !== "pending" && status === "pending") {
        return (
            <Card className="w-full max-w-md relative">
                <CardHeader>
                    <CardTitle>Invitation Already Processed</CardTitle>
                    <CardDescription>
                        This invitation has already been {invitation.status}.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md relative">
            <CardHeader>
                <CardTitle>Organization Invitation</CardTitle>
                <CardDescription>
                    You've been invited to join an organization
                </CardDescription>
            </CardHeader>
            <CardContent>
                {status === "pending" && (
                    <div className="space-y-4">
                        <p>
                            <strong>{invitation.inviterEmail}</strong> has invited you to
                            join <strong>{invitation.organizationName}</strong>.
                        </p>
                        <p>
                            This invitation was sent to{" "}
                            <strong>{invitation.email}</strong>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Role: <span className="capitalize font-medium">{invitation.role}</span>
                        </p>
                    </div>
                )}
                {status === "accepted" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
                            <CheckIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-center">
                            Welcome to {invitation.organizationName}!
                        </h2>
                        <p className="text-center text-muted-foreground">
                            You've successfully joined the organization. Redirecting...
                        </p>
                    </div>
                )}
                {status === "rejected" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-destructive/10 rounded-full">
                            <XIcon className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold text-center">
                            Invitation Declined
                        </h2>
                        <p className="text-center text-muted-foreground">
                            You've declined the invitation to join{" "}
                            {invitation.organizationName}.
                        </p>
                    </div>
                )}
            </CardContent>
            {status === "pending" && (
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={isAccepting || isRejecting}
                    >
                        {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Decline
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={isAccepting || isRejecting}
                    >
                        {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Accept Invitation
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}