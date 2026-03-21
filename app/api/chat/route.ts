import { createAgentUIStreamResponse } from 'ai';
import { after } from 'next/server';
import { createDocumentAssistant } from '@/lib/agents/document-assistant';
import { forceFlushTelemetry } from '@/lib/telemetry';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const agent = await createDocumentAssistant();

    // Use createAgentUIStreamResponse for UI message handling (AI SDK 6.0)
    after(async () => {
      await forceFlushTelemetry();
    });

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error);

    if (error instanceof Error && error.message === 'No active organization') {
      return new Response(JSON.stringify({ error: 'No active organization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
