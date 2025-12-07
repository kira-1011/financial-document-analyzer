"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { deleteDocument } from "./api";

export async function deleteDocumentAction(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Check permission
        const hasPermission = await auth.api.hasPermission({
            headers: await headers(),
            body: {
                permissions: {
                    document: ["delete"],
                },
            },
        });

        if (!hasPermission.success) {
            return { success: false, error: "You don't have permission to delete documents" };
        }

        await deleteDocument(documentId);
        revalidatePath("/documents");
        
        return { success: true };
    } catch (error) {
        console.error("[deleteDocumentAction] Error:", error);
        return { success: false, error: "Failed to delete document" };
    }
}
