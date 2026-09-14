import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { answerFromInstructions } from './answer.js';
import { loadInstructions, saveInstructions } from './instructionsStore.js';

const MCP_INSTRUCTIONS =
  'Use ask_question for user questions; answers follow operator instructions only. ' +
  'Use set_instructions to replace those instructions, get_instructions to inspect them. ' +
  'Do not invent facts outside current instructions; if empty/insufficient, say so.';

export function createAskServer(): McpServer {
  const server = new McpServer(
    { name: 'shimi-ask', version: '1.0.0' },
    { instructions: MCP_INSTRUCTIONS.slice(0, 512) }
  );

  server.registerTool(
    'ask_question',
    {
      title: 'Ask question',
      description:
        'Use when the user asks something that should be answered per the operator’s current instructions. Do not invent facts outside those instructions; if empty/insufficient, say so.',
      inputSchema: {
        question: z.string().describe('The user question to answer per operator instructions')
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      }
    },
    async ({ question }) => {
      const instructions = await loadInstructions();
      const text = answerFromInstructions(question, instructions);
      return { content: [{ type: 'text' as const, text }] };
    }
  );

  server.registerTool(
    'set_instructions',
    {
      title: 'Set instructions',
      description:
        'Use when the operator wants to command how future questions are answered. Replaces full instruction text.',
      inputSchema: {
        instructions: z.string().describe('Full replacement operator instruction text')
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    async ({ instructions }) => {
      await saveInstructions(instructions);
      const he = /[\u0590-\u05FF]/.test(instructions);
      const text = he
        ? `ההוראות עודכנו ונשמרו (${instructions.length} תווים). שאלות עתידיות דרך ask_question יענו לפיהן.`
        : `Instructions updated and saved (${instructions.length} characters). Future ask_question calls will use them.`;
      return { content: [{ type: 'text' as const, text }] };
    }
  );

  server.registerTool(
    'get_instructions',
    {
      title: 'Get instructions',
      description: 'Read current operator instructions.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true
      }
    },
    async () => {
      const instructions = await loadInstructions();
      const trimmed = instructions.trim();
      if (!trimmed) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No instructions set. Use set_instructions to define them. / אין הוראות. השתמש ב-set_instructions.'
            }
          ]
        };
      }
      return { content: [{ type: 'text' as const, text: trimmed }] };
    }
  );

  return server;
}
