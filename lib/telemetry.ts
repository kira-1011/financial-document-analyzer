import type { AttributeValue } from "@opentelemetry/api";

type TelemetryConfig = {
	experimental_telemetry: {
		isEnabled: true;
		functionId: string;
		metadata: Record<string, AttributeValue>;
	};
};

export function isLangfuseEnabled(): boolean {
	return !!(
		process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY
	);
}

export function createTelemetryConfig(options?: {
	functionId?: string;
	metadata?: Record<string, AttributeValue>;
}): TelemetryConfig | Record<string, never> {
	if (!isLangfuseEnabled()) return {};

	return {
		experimental_telemetry: {
			isEnabled: true,
			functionId: options?.functionId ?? "unknown",
			metadata: options?.metadata ?? {},
		},
	};
}

// Holds a reference to the span processor for flushing.
// Set by instrumentation.ts (Next.js) or initLangfuseForTask (Trigger.dev).
let _spanProcessor: { forceFlush(): Promise<void> } | null = null;

export function setSpanProcessor(
	processor: { forceFlush(): Promise<void> } | null,
) {
	_spanProcessor = processor;
}

/**
 * Initialize Langfuse tracing for non-Next.js runtimes (e.g. Trigger.dev).
 * In Next.js, instrumentation.ts handles this automatically.
 */
export async function initLangfuseForTask() {
	if (_spanProcessor || !isLangfuseEnabled()) return;

	const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");
	const { LangfuseSpanProcessor } = await import("@langfuse/otel");

	const spanProcessor = new LangfuseSpanProcessor();
	const tracerProvider = new NodeTracerProvider({
		spanProcessors: [spanProcessor],
	});
	tracerProvider.register();

	_spanProcessor = spanProcessor;
}

export async function forceFlushTelemetry() {
	await _spanProcessor?.forceFlush();
}
