import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }




  const stats = [
    { title: "Total Documents", value: "0", description: "Documents uploaded", icon: FileText },
    { title: "Processed", value: "0", description: "Successfully extracted", icon: CheckCircle },
    { title: "Processing", value: "0", description: "Currently analyzing", icon: Clock },
  ];

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name || "User",
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back, {session.user.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-muted-foreground">
                Upload and analyze your financial documents with AI
              </p>
            </div>
            <Button asChild>
              <Link href="/documents/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started by uploading your first document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/documents/upload" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50 transition-colors">
                  <div className="rounded-full bg-primary p-3">
                    <Upload className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <p className="font-medium">Upload Document</p>
                  <p className="text-sm text-muted-foreground">PDF files supported</p>
                </Link>
                <Link href="/documents" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50 transition-colors">
                  <div className="rounded-full bg-primary p-3">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <p className="font-medium">View Documents</p>
                  <p className="text-sm text-muted-foreground">Browse all documents</p>
                </Link>
                <Link href="/search" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50 transition-colors">
                  <div className="rounded-full bg-primary p-3">
                    <CheckCircle className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <p className="font-medium">Search Documents</p>
                  <p className="text-sm text-muted-foreground">Find extracted data</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

