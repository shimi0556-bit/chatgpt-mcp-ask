import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAskServer } from './server.js';
import { initInstructionsStore } from './instructionsStore.js';

async function main(): Promise<void> {
  await initInstructionsStore();
  const server = createAskServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
