import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/server';
import { bankStatementSchema, invoiceSchema, receiptSchema } from '@/lib/documents/schemas';

// ============================================
// Generate Schema Context from Zod Schemas
// ============================================
function generateSchemaContext({ organizationId }: { organizationId: string }): string {
  const invoiceJsonSchema = z.toJSONSchema(invoiceSchema);
  const receiptJsonSchema = z.toJSONSchema(receiptSchema);
  const bankStatementJsonSchema = z.toJSONSchema(bankStatementSchema);

  return `
You are a PostgreSQL expert generating SELECT queries for a financial document system.

## Table Schema

TABLE: documents
- id: uuid (primary key)
- "organizationId": text (tenant ID - ALWAYS filter by this)
- "uploadedBy": text (user ID, nullable)
- "fileName": text
- "filePath": text
- "fileSize": integer
- "mimeType": text
- "documentType": enum('invoice', 'bank_statement', 'receipt', 'unknown')
- "status": enum('pending', 'processing', 'completed', 'failed')
- "extractedData": jsonb (contains extracted fields, schema varies by documentType)
- "extractionConfidence": real
- "aiModel": text
- "runId": text
- "errorMessage": text
- "createdAt": timestamptz
- "updatedAt": timestamptz
- "processedAt": timestamptz

## JSONB extractedData Schemas

### For documentType = 'invoice':
${JSON.stringify(invoiceJsonSchema, null, 2)}

### For documentType = 'receipt':
${JSON.stringify(receiptJsonSchema, null, 2)}

### For documentType = 'bank_statement':
${JSON.stringify(bankStatementJsonSchema, null, 2)}

## CRITICAL RULES

1. ALWAYS include this filter: "organizationId" = '${organizationId}' AND "status" = 'completed'
2. Only generate SELECT queries - never UPDATE, DELETE, INSERT, DROP, ALTER, TRUNCATE
3. Use ILIKE for case-insensitive text searches: "extractedData"->>'vendor_name' ILIKE '%search%'
4. Cast JSONB numbers for comparisons: ("extractedData"->>'total')::numeric > 1000
5. Access nested JSONB fields: "extractedData"->'statement_period'->>'start_date'
6. Search in JSONB arrays using EXISTS:
   EXISTS (
     SELECT 1 FROM jsonb_array_elements("extractedData"->'transactions') t 
     WHERE t->>'description' ILIKE '%search%'
   )
7. Handle dates in extractedData as strings: "extractedData"->>'invoice_date' >= '2024-01-01'
8. ORDER BY "createdAt" DESC by default
9. Always select: id, "fileName", "documentType", "extractedData", "createdAt"
10. Double-quote column names with mixed case: "fileName", "documentType", "extractedData"
11. Do NOT include a trailing semicolon at the end of the query
`;
}

// ============================================
// SQL Query Result Schema
// ============================================
const sqlQueryResultSchema = z.object({
  sql: z.string().describe('The PostgreSQL SELECT query'),
  explanation: z.string().describe('Brief explanation of what the query does'),
});

// ============================================
// Text-to-SQL Function
// ============================================
export async function textToSql(
  userQuery: string,
  organizationId: string
): Promise<{
  sql: string;
  explanation: string;
}> {
  const { object } = await generateObject({
    model: google(process.env.AI_MODEL || 'gemini-2.5-flash'),
    schema: sqlQueryResultSchema,
    system: generateSchemaContext({ organizationId }),
    prompt: `Generate a PostgreSQL SELECT query for this user request:

"${userQuery}"

Remember:
- Filter by "organizationId" = '${organizationId}' AND "status" = 'completed'
- Use proper JSONB operators (->> for text, -> for objects)
- Select: id, "fileName", "documentType", "extractedData", "createdAt"
- Be precise with the query based on the user's intent`,
  });

  return object;
}

// ============================================
// Document Search Result Type
// ============================================
export interface DocumentSearchResult {
  id: string;
  fileName: string;
  documentType: string | null;
  extractedData: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================
// Execute Search Query
// ============================================
async function executeSearchQuery(sql: string): Promise<{
  documents: DocumentSearchResult[];
  error: string | null;
}> {
  try {
    // Strip trailing semicolon if present
    const cleanSql = sql.replace(/;\s*$/, '');

    const { data, error } = await supabase.rpc('execute_document_query', {
      query_text: cleanSql,
    });

    if (error) {
      console.error('[executeSearchQuery] RPC Error:', error);
      return { documents: [], error: error.message };
    }

    // Parse JSONB result - it's an array of documents
    const documents = (data as unknown as DocumentSearchResult[]) || [];

    return { documents, error: null };
  } catch (err) {
    console.error('[executeSearchQuery] Exception:', err);
    return { documents: [], error: 'Failed to execute query' };
  }
}

// ============================================
// Search Documents Tool
// ============================================
export function createSearchDocumentsTool(organizationId: string) {
  return tool({
    description: `Search and query financial documents using natural language.
Use this tool to find invoices, receipts, and bank statements based on user criteria.

Examples of queries you can handle:
- "Find all invoices from Acme Corp"
- "Receipts over $500 from 2024"
- "Bank statements with transactions to Amazon"
- "Invoices due next month"
- "Find receipts paid by credit card"
- "Bank statements with balance over $10000"`,
    inputSchema: z.object({
      query: z.string().describe('Natural language search query from the user'),
    }),
    execute: async ({ query }) => {
      try {
        // Step 1: Generate SQL from natural language
        const { sql, explanation } = await textToSql(query, organizationId);

        console.log('[searchDocuments] Generated SQL:', sql);
        console.log('[searchDocuments] Explanation:', explanation);

        // Step 2: Execute the query via RPC (RPC handles validation)
        const { documents, error } = await executeSearchQuery(sql);

        if (error) {
          return {
            success: false,
            error,
            message: 'Failed to search documents. Please try rephrasing your query.',
          };
        }

        // Step 3: Format results for the agent
        if (documents.length === 0) {
          return {
            success: true,
            found: 0,
            explanation,
            message: 'No documents found matching your criteria.',
            documents: [],
          };
        }

        return {
          success: true,
          found: documents.length,
          explanation,
          documents,
        };
      } catch (err) {
        console.error('[searchDocuments] Error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred',
          message: 'Failed to search documents.',
        };
      }
    },
  });
}
