import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { EXTRACTION_PROMPTS, ROUTER_SYSTEM_PROMPT } from './prompts';
import {
  bankStatementSchema,
  invoiceSchema,
  receiptSchema,
  type ExtractedData,
} from './schemas';

const DEFAULT_AI_MODEL = 'gemini-2.5-flash-lite';

// ============================================
// Router Classification Schema
// ============================================
const routerSchema = z.object({
  reasoning: z.string().describe('Brief explanation of why this document type was chosen'),
  documentType: z
    .enum(['bank_statement', 'invoice', 'receipt', 'unknown'])
    .describe(
      "The classified document type. Use 'unknown' if the document is not a financial document or cannot be classified"
    ),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 to 1'),
});

export type RouterResult = z.infer<typeof routerSchema>;

// ============================================
// Extraction Result Type
// ============================================
export type ExtractDocumentResult = {
  classification: RouterResult;
  extractedData: ExtractedData | null;
  aiModel: string;
};

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
  if (mimeType.startsWith('image/')) {
    return {
      type: 'image' as const,
      image: fileUrl,
    };
  }
  return {
    type: 'file' as const,
    data: new URL(fileUrl),
    mediaType: mimeType,
  };
}

// ============================================
// Main Extraction Function (Router + Extract)
// ============================================
export async function extractDocument(
  fileUrl: string,
  mimeType: string
): Promise<ExtractDocumentResult> {
  const documentPart = createDocumentPart(fileUrl, mimeType);
  const aiModel = process.env.AI_MODEL || DEFAULT_AI_MODEL;
  const model = google(aiModel);

  try {
    // Step 1: Classify the document
    const { output: classification } = await generateText({
      model,
      output: Output.object({ schema: routerSchema }),
      system: ROUTER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this document and determine if it is a financial document. If it is, classify its type:',
            },
            documentPart,
          ],
        },
      ],
    });

    // Step 2: Skip extraction for unknown documents
    if (classification.documentType === 'unknown') {
      return {
        classification,
        extractedData: null,
        aiModel,
      };
    }

    // Step 3: Route to appropriate extractor based on classification
    const { output: extractedData } = await generateText({
      model,
      output: Output.object({ schema: EXTRACTION_SCHEMAS[classification.documentType] as z.ZodSchema }),
      system: EXTRACTION_PROMPTS[classification.documentType],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all information from this document:' },
            documentPart,
          ],
        },
      ],
    });

    return {
      classification,
      extractedData: extractedData as ExtractedData,
      aiModel,
    };
  } catch (error) {
    console.error('[extractDocument] Error:', error);
    throw error;
  }
}
