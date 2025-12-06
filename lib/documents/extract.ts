import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { bankStatementSchema, invoiceSchema, receiptSchema } from "./schemas";
import { ROUTER_SYSTEM_PROMPT, EXTRACTION_PROMPTS } from "./prompts";
import { AI_MODEL } from "./constants";

// ============================================
// Router Classification Schema
// ============================================
const routerSchema = z.object({
    reasoning: z.string().describe("Brief explanation of why this document type was chosen"),
    documentType: z.enum(["bank_statement", "invoice", "receipt"]).describe("The classified document type"),
    confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
});

export type RouterResult = z.infer<typeof routerSchema>;

// ============================================
// Extraction Schemas (Routing Lookup)
// ============================================
const EXTRACTION_SCHEMAS = {
    bank_statement: bankStatementSchema,
    invoice: invoiceSchema,
    receipt: receiptSchema,
} as const;

// ============================================
// Helper Functions
// ============================================
function createDocumentPart(fileUrl: string, mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return {
            type: "image" as const,
            image: fileUrl,
        };
    }
    return {
        type: "file" as const,
        data: new URL(fileUrl),
        mediaType: mimeType,
    };
}

// ============================================
// Main Extraction Function (Router + Extract)
// ============================================
export async function extractDocument(fileUrl: string, mimeType: string) {
    const documentPart = createDocumentPart(fileUrl, mimeType);
    const model = google(AI_MODEL);

    try {
        // Step 1: Classify the document
        const { object: classification } = await generateObject({
            model,
            schema: routerSchema,
            system: ROUTER_SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Classify this financial document:" },
                        documentPart,
                    ],
                },
            ],
        });

        // Step 2: Route to appropriate extractor based on classification
        const { object: extractedData } = await generateObject({
            model,
            schema: EXTRACTION_SCHEMAS[classification.documentType],
            system: EXTRACTION_PROMPTS[classification.documentType],
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract all information from this document:" },
                        documentPart,
                    ],
                },
            ],
        });

        return {
            classification,
            extractedData,
        };
    } catch (error) {
        console.error("[extractDocument] Error:", error);
        throw error;
    }
}