import { createServerClient } from "../supabase/server";

// Helper function to get a signed URL for a document
export async function getDocumentUrl(filePath: string): Promise<string | null> {
    try {
        const supabase = createServerClient();

        const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
            console.error("[getDocumentUrl] Error:", error);
            return null;
        }

        return data.signedUrl;
    } catch (error) {
        console.error("[getDocumentUrl] Unexpected error:", error);
        return null;
    }
}
