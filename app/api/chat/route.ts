import { validateUIMessages } from 'ai';
import { createDocumentAssistant } from '@/lib/agents/document-assistant';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const agent = await createDocumentAssistant();

    // Use respond() for UI message handling
    return agent.respond({
      messages: await validateUIMessages({ messages }),
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
