import { supabase } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type Document = Database["public"]["Tables"]["documents"]["Row"];

export async function fetchDocuments(organizationId: string): Promise<Document[]> {
    try {
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[fetchDocuments] Error:", error);
            throw new Error("Failed to fetch documents");
        }

        return data || [];
    } catch (error) {
        console.error("[fetchDocuments] Error:", error);
        throw error;
    }
}

export async function fetchDocument(documentId: string): Promise<Document | null> {
    try {
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .single();

        if (error) {
            console.error("[fetchDocument] Error:", error);
            throw new Error("Failed to fetch document");
        }

        return data || null;
    } catch (error) {
        console.error("[fetchDocument] Error:", error);
        throw error;
    }
}

export interface DocumentStats {
    total: number;
    completed: number;
    processing: number;
    pending: number;
    failed: number;
}

export async function fetchDocumentStats(organizationId: string): Promise<DocumentStats> {
    // Fetch all counts in parallel
    const [totalResult, completedResult, processingResult, pendingResult, failedResult] = await Promise.all([
        supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId),
        supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "completed"),
        supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "processing"),
        supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "pending"),
        supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "failed"),
    ]);

    return {
        total: totalResult.count || 0,
        completed: completedResult.count || 0,
        processing: processingResult.count || 0,
        pending: pendingResult.count || 0,
        failed: failedResult.count || 0,
    };
}


export async function uploadFileToStorage(filePath: string, file: File): Promise<boolean> {
    try {
        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("[uploadDocument] Storage error:", uploadError);
            throw new Error("Failed to upload file. Please try again.");
        }

        return true;

    } catch (error) {
        console.error("[uploadFileToStorage] Error:", error);
        throw error;
    }
}


export async function createDocument(
    {
        id,
        organizationId,
        uploadedBy,
        fileName,
        filePath,
        fileSize,
        mimeType,
        status,
    }: Database["public"]["Tables"]["documents"]["Insert"]
): Promise<void> {
    const { error } = await supabase.from("documents").insert({
        id,
        organizationId,
        uploadedBy,
        fileName,
        filePath,
        fileSize,
        mimeType,
        status,
    });

    if (error) {
        console.error("[createDocument] Database error:", error);
        throw new Error("Failed to save document. Please try again.");
    }
}
