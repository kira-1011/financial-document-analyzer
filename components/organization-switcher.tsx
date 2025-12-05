"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { organization, useListOrganizations, useActiveOrganization } from "@/lib/auth-client";
import { toast } from "sonner";

export function OrganizationSwitcher() {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const [isPending, setIsPending] = React.useState(false);

    // Use Better Auth client hooks
    const { data: organizations, isPending: isLoadingOrgs } = useListOrganizations();
    const { data: activeOrganization } = useActiveOrganization();

    // activate the first organization by default
    React.useEffect(() => {
        if (organizations && organizations.length > 0) {
            organization.setActive({ organizationId: organizations[0].id });
        }
    }, [organizations]);

    const handleSwitch = async (orgId: string) => {
        if (orgId === activeOrganization?.id) return;

        setIsPending(true);
        try {
            await organization.setActive({ organizationId: orgId });
            router.refresh();
            toast.success("Switched organization");
        } catch (error) {
            toast.error("Failed to switch organization");
        } finally {
            setIsPending(false);
        }
    };

    // Loading state with Skeleton
    if (isLoadingOrgs) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" disabled>
                        <Skeleton className="size-8 rounded-lg" />
                        <div className="grid flex-1 gap-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    // No organizations
    if (!organizations || organizations.length === 0) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        onClick={() => router.push("/settings/organization/new")}
                    >
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Plus className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">Create Organization</span>
                            <span className="truncate text-xs text-muted-foreground">
                                Get started
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            disabled={isPending}
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {activeOrganization?.name || "No Organization"}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {organizations.length} workspace{organizations.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Organizations
                        </DropdownMenuLabel>
                        {organizations.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => handleSwitch(org.id)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                    <Building2 className="size-3.5 shrink-0" />
                                </div>
                                <span className="flex-1 truncate">{org.name}</span>
                                {activeOrganization?.id === org.id && (
                                    <span className="text-xs text-primary">Active</span>
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 p-2"
                            onClick={() => router.push("/settings/organization/new")}
                        >
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                <Plus className="size-4" />
                            </div>
                            <span className="text-muted-foreground font-medium">
                                Create Organization
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
