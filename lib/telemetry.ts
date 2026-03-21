import type { AttributeValue } from '@opentelemetry/api';

type TelemetryConfig = {
  experimental_telemetry: {
    isEnabled: true;
    functionId: string;
    metadata: Record<string, AttributeValue>;
  };
};

export function isLangfuseEnabled(): boolean {
  return !!(process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY);
}

export function createTelemetryConfig(
  options?: { functionId?: string; metadata?: Record<string, AttributeValue> }
): TelemetryConfig | Record<string, never> {
  if (!isLangfuseEnabled()) return {};

  return {
    experimental_telemetry: {
      isEnabled: true,
      functionId: options?.functionId ?? 'unknown',
      metadata: options?.metadata ?? {},
    },
  };
}

let initialized = false;

export async function initLangfuse() {
  if (initialized || !isLangfuseEnabled()) return null;

  try {
    const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
    const { LangfuseSpanProcessor } = await import('@langfuse/otel');

    const spanProcessor = new LangfuseSpanProcessor();
    const tracerProvider = new NodeTracerProvider({
      spanProcessors: [spanProcessor],
    });
    tracerProvider.register();

    initialized = true;
    return { tracerProvider, spanProcessor };
  } catch (error) {
    console.warn('[telemetry] Failed to initialize Langfuse:', error);
    return null;
  }
}

let langfuseInstance: Awaited<ReturnType<typeof initLangfuse>> = null;

export async function getOrInitProvider() {
  if (!langfuseInstance) {
    langfuseInstance = await initLangfuse();
  }
  return langfuseInstance;
}

export async function forceFlushTelemetry() {
  if (langfuseInstance?.spanProcessor) {
    await langfuseInstance.spanProcessor.forceFlush();
  }
}
