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

    // If not logged in, show login prompt
    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <InvitationError
                    error="Please sign in to view and accept this invitation"
                    showAuthLinks
                    invitationId={id}
                />
            </div>
        );
    }

    // User is logged in - let client component handle the rest
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <InvitationHandler invitationId={id} />
        </div>
    );
}