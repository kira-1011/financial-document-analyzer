import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchDocuments } from "@/lib/documents/api";
import { UploadDocumentDialog } from "@/components/upload-document-dialog";
import { DocumentList } from "@/components/document-list";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function DocumentsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const activeOrg = await auth.api.getFullOrganization({
        headers: await headers(),
    });

    if (!activeOrg) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Please select an organization first.</p>
            </div>
        );
    }

    const documents = await fetchDocuments(activeOrg.id);

    // Check delete permission on server
    const canDelete = await auth.api.hasPermission({
        headers: await headers(),
        body: {
            permissions: {
                document: ["delete"],
            },
        },
    });

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Documents</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Documents</h1>
                        <p className="text-muted-foreground">
                            {documents.length} document{documents.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <UploadDocumentDialog />
                </div>

                <DocumentList 
                    initialDocuments={documents} 
                    organizationId={activeOrg.id}
                    canDelete={canDelete?.success ?? false}
                />
            </div>
        </>
    );
}
