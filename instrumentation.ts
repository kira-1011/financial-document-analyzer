import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { setSpanProcessor } from "@/lib/telemetry";

const isLangfuseEnabled = !!(
	process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY
);

if (isLangfuseEnabled) {
	const spanProcessor = new LangfuseSpanProcessor();
	const tracerProvider = new NodeTracerProvider({
		spanProcessors: [spanProcessor],
	});
	tracerProvider.register();
	setSpanProcessor(spanProcessor);
}
