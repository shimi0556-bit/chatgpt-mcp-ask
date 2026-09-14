import type { Request, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createAskServer } from './server.js';
import { initInstructionsStore, INSTRUCTIONS_PATH } from './instructionsStore.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

async function main(): Promise<void> {
  await initInstructionsStore();

  const allowedHosts = process.env.ALLOWED_HOSTS
    ? process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
    : undefined;

  // On Render / public hosts, also allow the incoming Host header when listed,
  // and treat ALLOWED_HOSTS=* as “any host” by omitting the allowlist.
  const allowAnyHost = allowedHosts?.includes('*');
  const app = createMcpExpressApp({
    host: HOST,
    ...(!allowAnyHost && allowedHosts ? { allowedHosts } : {})
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      name: 'shimi-ask',
      version: '1.0.0',
      mcp: '/mcp'
    });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = createAskServer();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        });
      }
    }
  });

  app.get('/mcp', (_req: Request, res: Response) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null
      })
    );
  });

  app.delete('/mcp', (_req: Request, res: Response) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null
      })
    );
  });

  app.listen(PORT, HOST, () => {
    console.log(`shimi-ask MCP listening on http://${HOST}:${PORT}`);
    console.log(`  MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`  Health:       http://${HOST}:${PORT}/health`);
    console.log(`  Instructions: ${INSTRUCTIONS_PATH}`);
  });
}

process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
