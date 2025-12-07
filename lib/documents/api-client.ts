import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentStatus = Pick<Document, "id" | "status" | "documentType">;

export async function fetchDocumentStatuses(organizationId: string): Promise<DocumentStatus[]> {
    try {
        const { data, error } = await supabase
            .from("documents")
            .select("id, status, documentType")
            .eq("organizationId", organizationId);

        if (error) {
            console.error("[fetchDocumentStatuses] Error:", error);
            throw new Error("Failed to fetch document statuses");
        }

        return data || [];
    } catch (error) {
        console.error("[fetchDocumentStatuses] Error:", error);
        throw error;
    }
}
