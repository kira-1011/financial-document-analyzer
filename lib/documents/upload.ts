"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk/v3";
import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
} from "./constants";
import type { UploadDocumentState } from "@/types";
import { processDocument } from "@/trigger/process-document";

export async function uploadDocumentAction(
    prevState: UploadDocumentState,
    formData: FormData
): Promise<UploadDocumentState> {
    // Get the file from form data
    const file = formData.get("file") as File | null;

    // Validate file exists
    if (!file || file.size === 0) {
        return {
            errors: { file: ["Please select a file to upload"] },
        };
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        return {
            errors: {
                file: ["Invalid file type. Please upload a PDF, JPEG, or PNG file"],
            },
        };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            errors: {
                file: ["File size exceeds 10MB limit"],
            },
        };
    }

    // Get session and active organization
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return {
            message: "You must be logged in to upload documents",
        };
    }

    const activeOrg = await auth.api.getFullOrganization({
        headers: await headers(),
    });

    if (!activeOrg) {
        return {
            message: "No active organization. Please select an organization first.",
        };
    }

    // Generate unique document ID
    const documentId = crypto.randomUUID();

    // Create file path: {organization_id}/{document_id}/{filename}
    const filePath = `${activeOrg.id}/${documentId}/${file.name}`;

    try {
        const supabase = createServerClient();

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("[uploadDocument] Storage error:", uploadError);
            return {
                message: "Failed to upload file. Please try again.",
            };
        }

        // Insert document record into database (status: pending, no document_type yet)
        const { error: dbError } = await supabase.from("documents").insert({
            id: documentId,
            organization_id: activeOrg.id,
            uploaded_by: session.user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: "pending",
        });

        if (dbError) {
            console.error("[uploadDocument] Database error:", dbError);

            // Clean up uploaded file if database insert fails
            await supabase.storage.from("documents").remove([filePath]);

            return {
                message: "Failed to save document. Please try again.",
            };
        }

        // Trigger background processing task
        await tasks.trigger<typeof processDocument>("process-document", { documentId });

        // Revalidate documents page
        revalidatePath("/documents");

        return {
            success: true,
            message: "Document uploaded successfully. Processing started.",
            documentId,
        };
    } catch (error) {
        console.error("[uploadDocument] Unexpected error:", error);
        return {
            message: "An unexpected error occurred. Please try again.",
        };
    }
}


