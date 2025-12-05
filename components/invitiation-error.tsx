import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface InvitationErrorProps {
    error?: string;
    showAuthLinks?: boolean;
    invitationId?: string;
}

export function InvitationError({ error, showAuthLinks, invitationId }: InvitationErrorProps) {
    return (
        <Card className="w-full max-w-md mx-auto relative">
            <CardHeader>
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-destructive/10 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-center">
                    {showAuthLinks ? "Sign In Required" : "Invalid Invitation"}
                </CardTitle>
                <CardDescription className="text-center">
                    {error || "This invitation link is invalid or has expired."}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
                {showAuthLinks ? (
                    <p>Please sign in or create an account to accept this invitation.</p>
                ) : (
                    <p>
                        The invitation may have been revoked, already used, or the link might be incorrect.
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex justify-center gap-2">
                {showAuthLinks ? (
                    <>
                        <Button asChild variant="outline">
                            <Link href={`/login?redirect=/accept-invitation/${invitationId}`}>
                                Sign In
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/signup?redirect=/accept-invitation/${invitationId}`}>
                                Create Account
                            </Link>
                        </Button>
                    </>
                ) : (
                    <Button asChild>
                        <Link href="/">Go to Dashboard</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}