import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { InvitationHandler } from "@/components/invitation-handler";
import { InvitationError } from "@/components/invitiation-error";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
    const { id } = await params;

    // Check if user is logged in
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Fetch invitation server-side
    let invitation = null;
    let error = null;

    try {
        invitation = await auth.api.getInvitation({
            query: { id },
            headers: await headers(),
        });
    } catch (e) {
        error = "Failed to fetch invitation";
    }

    // If no invitation found
    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="absolute pointer-events-none inset-0 flex items-center justify-center" />
                <InvitationError error={error || "Invitation not found"} />
            </div>
        );
    }

    // If user not logged in, show login prompt
    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="absolute pointer-events-none inset-0 flex items-center justify-center" />
                <InvitationError
                    error="Please sign in to accept this invitation"
                    showAuthLinks
                    invitationId={id}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center"/>
            <InvitationHandler invitation={invitation} invitationId={id} />
        </div>
    );
}