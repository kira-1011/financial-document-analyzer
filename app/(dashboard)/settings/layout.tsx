import { SettingsNav } from "@/components/settings-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // No auth check needed - parent (dashboard) layout handles it
    // No SidebarProvider/AppSidebar needed - parent layout provides it

    return (
        <>
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

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and organization</p>
                </div>
                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="lg:w-48 shrink-0">
                        <SettingsNav />
                    </aside>
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}