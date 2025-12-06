import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { InvitationHandler } from "@/components/invitation-handler";
import { InvitationError } from "@/components/invitiation-error";
import { Brand } from "@/components/brand";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                {/* Brand at top */}
                <div className="absolute top-6 left-6">
                    <Brand size="md" />
                </div>
                <InvitationError
                    error="Please sign in to view and accept this invitation"
                    showAuthLinks
                    invitationId={id}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Brand at top */}
            <div className="absolute top-6 left-6">
                <Brand size="md" />
            </div>
            <InvitationHandler invitationId={id} />
        </div>
    );
}