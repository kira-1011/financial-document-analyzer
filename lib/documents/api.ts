import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type Document = Database["public"]["Tables"]["documents"]["Row"];

const supabase = createServerClient();

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
