export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getOrInitProvider } = await import('@/lib/telemetry');
    await getOrInitProvider();
  }
}
