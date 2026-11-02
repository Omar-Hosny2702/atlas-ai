export async function runAutomaticMemoryExtraction<T>(
  enabled: boolean,
  extract: () => Promise<T[]>,
  save: (memories: T[]) => Promise<void>
): Promise<void> {
  if (!enabled) return;

  const memories = await extract();
  await save(memories);
}
