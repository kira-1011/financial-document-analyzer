import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsNav } from "@/components/settings-nav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

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
                                    <BreadcrumbPage>Settings</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <SidebarHeader />


                <div className="flex flex-1 flex-col gap-6 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Settings
                            </h1>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 px-4 lg:px-6 lg:flex-row">
                        <aside className="lg:w-48 shrink-0">
                            <SettingsNav />
                        </aside>
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}