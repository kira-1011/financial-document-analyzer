import { task } from "@trigger.dev/sdk/v3";
import { createServerClient } from "@/lib/supabase/server";
import { extractDocument } from "@/lib/documents/extract";
import { AI_MODEL } from "@/lib/documents/constants";

export const processDocument = task({
    id: "process-document",
    run: async (payload: { documentId: string }) => {
        const supabase = createServerClient();

        // 1. Fetch document
        const { data: document, error } = await supabase
            .from("documents")
            .select("*")
            .eq("id", payload.documentId)
            .single();

        if (error || !document) {
            throw new Error(`Document not found: ${payload.documentId}`);
        }

        // 2. Update status to processing
        await supabase
            .from("documents")
            .update({ status: "processing" })
            .eq("id", payload.documentId);

        try {
            // 3. Get signed URL
            const { data: urlData } = await supabase.storage
                .from("documents")
                .createSignedUrl(document.file_path, 3600);

            if (!urlData?.signedUrl) {
                throw new Error("Failed to get signed URL");
            }

            // 4. Extract document (uses extract.ts)
            const { classification, extractedData } = await extractDocument(
                urlData.signedUrl,
                document.mime_type || "application/pdf"
            );

            // 5. Update with results
            await supabase
                .from("documents")
                .update({
                    document_type: classification.documentType,
                    extracted_data: extractedData,
                    extraction_confidence: classification.confidence,
                    ai_model: AI_MODEL,
                    status: "completed",
                    processed_at: new Date().toISOString(),
                })
                .eq("id", payload.documentId);

            return {
                success: true,
                documentType: classification.documentType,
                confidence: classification.confidence,
            };
        } catch (error) {
            await supabase
                .from("documents")
                .update({
                    status: "failed",
                    error_message: error instanceof Error ? error.message : "Unknown error",
                })
                .eq("id", payload.documentId);
            throw error;
        }
    },
});
