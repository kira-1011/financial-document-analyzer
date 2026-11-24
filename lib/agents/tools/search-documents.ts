import { google } from '@ai-sdk/google';
import { generateText, Output, tool } from 'ai';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { bankStatementSchema, invoiceSchema, receiptSchema } from '@/lib/documents/schemas';
import prisma from '@/lib/prisma';

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
  const { output } = await generateText({
    model: google(process.env.AI_MODEL || 'gemini-2.5-flash'),
    output: Output.object({ schema: sqlQueryResultSchema }),
    system: generateSchemaContext({ organizationId }),
    prompt: `Generate a PostgreSQL SELECT query for this user request:

"${userQuery}"

Remember:
- Filter by "organizationId" = '${organizationId}' AND "status" = 'completed'
- Use proper JSONB operators (->> for text, -> for objects)
- Select: id, "fileName", "documentType", "extractedData", "createdAt"
- Be precise with the query based on the user's intent`,
  });

  if (!output) {
    throw new Error('Failed to generate SQL query');
  }

  return output;
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
const MAX_SEARCH_ROWS = 50;

// Columns of the per-query temp table. Enums become text so the generated SQL
// can compare them to plain strings.
const TEMP_TABLE_DDL = `CREATE TEMP TABLE documents (
  id uuid, "organizationId" text, "uploadedBy" text, "fileName" text, "filePath" text,
  "fileSize" integer, "mimeType" text, "errorMessage" text, "extractedData" jsonb,
  "extractionConfidence" real, "aiModel" text, "createdAt" timestamptz, "updatedAt" timestamptz,
  "processedAt" timestamptz, "documentType" text, status text, "runId" text
) ON COMMIT DROP`;

let searchPool: Pool | null = null;

function getSearchPool(): Pool {
  if (!searchPool) {
    const connectionString = process.env.SEARCH_DATABASE_URL;
    if (!connectionString) {
      throw new Error('SEARCH_DATABASE_URL is not set. Run `pnpm db:search-role`.');
    }
    searchPool = new Pool({ connectionString, max: 3 });
  }
  return searchPool;
}

// Runs model-written SQL so that it can only ever see one organization's data.
// The organization's completed documents are loaded by Prisma (filtered in
// code) into a temp table, in a session logged in as docufinance_search: a role
// with no table privileges and no role memberships, so the SQL can neither
// reach the real tables nor switch to a role that can. The transaction is
// always rolled back, which drops the temp table.
export async function executeSearchQuery(
  sql: string,
  organizationId: string
): Promise<{
  documents: DocumentSearchResult[];
  error: string | null;
}> {
  const cleanSql = sql.trim().replace(/;\s*$/, '');

  if (!/^(select|with)\b/i.test(cleanSql) || cleanSql.includes(';')) {
    return { documents: [], error: 'Only a single SELECT query is allowed' };
  }

  let client: PoolClient | null = null;
  try {
    const orgDocuments = await prisma.documents.findMany({
      where: { organizationId, status: 'completed' },
    });

    client = await getSearchPool().connect();
    await client.query('BEGIN');
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query(TEMP_TABLE_DDL);
    await client.query(
      'INSERT INTO documents SELECT * FROM json_populate_recordset(NULL::documents, $1::json)',
      [JSON.stringify(orgDocuments)]
    );

    // A bound parameter forces the extended query protocol, which rejects
    // multiple statements. jsonb_agg keeps dates and numbers serializable.
    const { rows } = await client.query<{ results: DocumentSearchResult[] }>(
      `SELECT COALESCE(jsonb_agg(q), '[]'::jsonb) AS results FROM (SELECT * FROM (${cleanSql}) AS generated LIMIT $1) AS q`,
      [MAX_SEARCH_ROWS]
    );

    return { documents: rows[0]?.results ?? [], error: null };
  } catch (err) {
    console.error('[executeSearchQuery] Error:', err);
    return {
      documents: [],
      error: err instanceof Error ? err.message : 'Failed to execute query',
    };
  } finally {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
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

        // Step 2: Execute the query against this organization's documents only
        const { documents, error } = await executeSearchQuery(sql, organizationId);

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
