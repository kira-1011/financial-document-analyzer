import { google } from '@ai-sdk/google';
import {
  Experimental_Agent as Agent,
  type Experimental_InferAgentUIMessage as InferAgentUIMessage,
  stepCountIs,
} from 'ai';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createSearchDocumentsTool } from './tools/search-documents';

const SYSTEM_PROMPT = `You are a helpful financial document assistant. You help users find and analyze their invoices, receipts, and bank statements.

Guidelines:
- Use searchDocuments tool when users ask about their documents
- Be concise and format monetary values properly (e.g., $1,234.56)
- When listing documents, summarize key info: vendor/merchant, date, total
- If you can't find results, suggest alternative searches`;
export async function createDocumentAssistant() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    throw new Error('No active organization');
  }

  const organizationId = session.session.activeOrganizationId;

  return new Agent({
    model: google(process.env.AI_MODEL || 'gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    tools: {
      searchDocuments: createSearchDocumentsTool(organizationId),
    },
    stopWhen: stepCountIs(10),
  });
}

// Export inferred UIMessage type for type safety
export type DocumentAssistantUIMessage = InferAgentUIMessage<
  ReturnType<typeof createDocumentAssistant>
>;
