import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AIChat } from '@/components/ai-chat';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch organizations ONCE for all dashboard pages
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  const activeOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name || 'User',
          email: session.user.email,
          image: session.user.image,
        }}
        organizations={organizations || []}
        activeOrganization={activeOrganization}
      />
      <SidebarInset>
        {children}
        <AIChat />
      </SidebarInset>
    </SidebarProvider>
  );
}
