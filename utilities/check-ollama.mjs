#!/usr/bin/env node
/**
 * utilities/check-ollama.mjs
 *
 * Standalone health check for the Ollama connection Atlas AI depends on.
 * Useful for debugging without starting the full backend, and safe to wire
 * into CI or a pre-flight npm script.
 *
 * Usage: node utilities/check-ollama.mjs [host]
 *   host defaults to http://127.0.0.1:11434 (or $OLLAMA_HOST if set)
 */

const host = process.argv[2] || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

async function main() {
  console.log(`Checking Ollama at ${host} …`);

  let res;
  try {
    res = await fetch(`${host}/api/tags`);
  } catch (err) {
    console.error(`\n✗ Could not reach Ollama at ${host}.`);
    console.error(`  Is it running? Start it with: ollama serve`);
    console.error(`  (${err.message})`);
    process.exitCode = 1;
    return;
  }

  if (!res.ok) {
    console.error(`\n✗ Ollama responded with an error: ${res.status} ${res.statusText}`);
    process.exitCode = 1;
    return;
  }

  const data = await res.json();
  const models = (data.models ?? []).map((m) => m.name);

  console.log(`\n✓ Ollama is reachable.`);
  if (models.length === 0) {
    console.log(`  No models are pulled yet. Try: ollama pull llama3.1:8b`);
  } else {
    console.log(`  Pulled models:`);
    for (const name of models) console.log(`    - ${name}`);
  }
}

main();
