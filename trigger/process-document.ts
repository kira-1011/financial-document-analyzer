import { task } from "@trigger.dev/sdk/v3";
import { extractDocument } from "@/lib/documents/extract";
import { AI_MODEL } from "@/lib/documents/constants";
import { fetchDocument, updateDocument } from "@/lib/documents/api";

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
            await updateDocument(payload.documentId, {
                documentType: classification.documentType,
                extractedData: extractedData,
                extractionConfidence: classification.confidence,
                aiModel: AI_MODEL,
                status: "completed",
                processedAt: new Date().toISOString(),
            });

            return {
                success: true,
                documentType: classification.documentType,
                confidence: classification.confidence,
            };
        } catch (error) {
            await updateDocument(payload.documentId, {
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "Unexpected error",
            });
            throw error;
        }
    },
});
