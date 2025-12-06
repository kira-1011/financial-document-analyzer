import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfileSettingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <ProfileForm user={session.user} />
        </div>
    );
}