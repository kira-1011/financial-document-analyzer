"use client"

import * as React from "react"
import {
  FileText,
  LayoutDashboard,
  Settings,
  HelpCircle,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { Brand } from "@/components/brand"

const data = {
  navMain: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, isActive: true },
    { title: "Documents", url: "/documents", icon: FileText },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  navSecondary: [ ]
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    image?: string | null
  }
  organizations: Organization[]
  activeOrganization: Organization | null
}

export function AppSidebar({ user, organizations, activeOrganization, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <Brand size="sm" />
        <NavUser user={{
          name: user.name,
          email: user.email,
          avatar: user.image || "",
        }} />

      </SidebarFooter>
    </Sidebar>
  )
}
