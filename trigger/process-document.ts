import { task } from "@trigger.dev/sdk/v3";
import { supabase } from "@/lib/supabase/server";
import { extractDocument } from "@/lib/documents/extract";
import { AI_MODEL } from "@/lib/documents/constants";
import { fetchDocument } from "@/lib/documents/api";

export const processDocument = task({
    id: "process-document",
    run: async (payload: { documentId: string }) => {
        // 1. Fetch document
        const document = await fetchDocument(payload.documentId);

        if (!document) {
            throw new Error(`Document not found: ${payload.documentId}`);
        }

        try {
            const { classification, extractedData } = await extractDocument(
                document.filePath,
                document.mimeType || "application/pdf"
            );

            // 5. Update with results
            await supabase
                .from("documents")
                .update({
                    documentType: classification.documentType,
                    extracted_data: extractedData,
                    extractionConfidence: classification.confidence,
                    aiModel: AI_MODEL,
                    status: "completed",
                    processedAt: new Date().toISOString(),
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
