import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { fetchDocumentStats } from '@/lib/documents/api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';
import Link from 'next/link';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';
import { DocumentStatsCards } from '@/components/document-stats';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const activeOrg = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  // Fetch document stats if org is active
  const stats = activeOrg
    ? await fetchDocumentStats(activeOrg.id)
    : {
        total: 0,
        byStatus: { completed: 0, processing: 0, pending: 0, failed: 0 },
        byType: { bank_statement: 0, invoice: 0, receipt: 0, unknown: 0 },
      };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {session?.user.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Upload and analyze your financial documents with AI
            </p>
          </div>
          <UploadDocumentDialog />
        </div>

        {/* Stats Dashboard */}
        <DocumentStatsCards stats={stats} />

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started by uploading your first document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/documents/upload"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full bg-primary p-3">
                  <Upload className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-medium">Upload Document</p>
                <p className="text-sm text-muted-foreground">PDF files supported</p>
              </Link>
              <Link
                href="/documents"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full bg-primary p-3">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-medium">View Documents</p>
                <p className="text-sm text-muted-foreground">Browse all documents</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
