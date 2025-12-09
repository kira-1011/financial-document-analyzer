'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient, organization } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { Invitation } from '@/lib/auth-types';

interface InvitationHandlerProps {
  invitationId: string;
}

export function InvitationHandler({ invitationId }: InvitationHandlerProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<
    | (Invitation & {
        organizationName: string;
        organizationSlug: string;
        inviterEmail: string;
      })
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Invitation['status']>('pending');
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Fetch invitation on mount
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });

        if (res.error) {
          setError(res.error.message || 'Failed to fetch invitation');
        } else {
          setInvitation(res.data);
          if (res.data.status !== 'pending') {
            setStatus(res.data.status as Invitation['status']);
          }
        }
      } catch (error) {
        console.error('[fetchInvitation] Error:', error);
        setError('Failed to fetch invitation');
      }
    };

    fetchInvitation();
  }, [invitationId]);

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    try {
      const res = await organization.acceptInvitation({
        invitationId,
      });

      if (res.error) {
        toast.error(res.error.message || 'Failed to accept invitation');
        return;
      }

      setStatus('accepted');
      toast.success('Invitation accepted!');

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('[handleAcceptInvitation] Error:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInvitation = async () => {
    setIsRejecting(true);
    try {
      const res = await organization.rejectInvitation({
        invitationId,
      });

      if (res.error) {
        toast.error(res.error.message || 'Failed to decline invitation');
        return;
      }

      setStatus('rejected');
      toast.success('Invitation declined');
    } catch (error) {
      console.error('[handleRejectInvitation] Error:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setIsRejecting(false);
    }
  };

  // Loading state
  if (!invitation && !error) {
    return <InvitationSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    );
  }

  // Already processed
  if (invitation && invitation.status !== 'pending' && status === 'pending') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation Already Processed</CardTitle>
          <CardDescription>This invitation has already been {invitation.status}.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Organization Invitation</CardTitle>
        <CardDescription>You've been invited to join an organization</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'pending' && invitation && (
          <div className="space-y-4">
            <p>
              <span className="font-semibold italic">{invitation.inviterEmail}</span> has invited
              you to join{' '}
              <span className="font-semibold italic">{invitation.organizationName}</span>.
            </p>
            <p>
              This invitation was sent to{' '}
              <span className="font-semibold italic">{invitation.email}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Role: <span className="capitalize font-semibold">{invitation.role}</span>
            </p>
          </div>
        )}
        {status === 'accepted' && invitation && (
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
        {status === 'rejected' && invitation && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-destructive/10 rounded-full">
              <XIcon className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-center">Invitation Declined</h2>
            <p className="text-center text-muted-foreground">
              You've declined the invitation to join {invitation.organizationName}.
            </p>
          </div>
        )}
      </CardContent>
      {status === 'pending' && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleRejectInvitation}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Decline
          </Button>
          <Button onClick={handleAcceptInvitation} disabled={isAccepting || isRejecting}>
            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept Invitation
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function InvitationSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}
