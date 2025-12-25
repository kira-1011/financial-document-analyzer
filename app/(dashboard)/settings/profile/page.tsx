import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile-form';
import { auth } from '@/lib/auth';

export default async function ProfileSettingsPage() {
  const reqHeaders = await headers();

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect('/login');
  }

  // Check if user has a password (credential account)
  const accounts = await auth.api.listUserAccounts({
    headers: reqHeaders,
  });

  const hasPassword = accounts.some((account) => account.providerId === 'credential');

  return (
    <div className="space-y-6">
      <ProfileForm user={session.user} hasPassword={hasPassword} />
    </div>
  );
}
