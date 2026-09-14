import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Project root (parent of src/ or dist/) */
const PROJECT_ROOT = path.resolve(__dirname, '..');
export const INSTRUCTIONS_PATH = path.join(PROJECT_ROOT, 'data', 'instructions.txt');

let cached: string | null = null;

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(path.dirname(INSTRUCTIONS_PATH), { recursive: true });
}

export async function loadInstructions(): Promise<string> {
  if (cached !== null) return cached;
  try {
    const text = await fs.readFile(INSTRUCTIONS_PATH, 'utf8');
    cached = text;
    return text;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      cached = '';
      return '';
    }
    throw err;
  }
}

export async function saveInstructions(instructions: string): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(INSTRUCTIONS_PATH, instructions, 'utf8');
  cached = instructions;
}

export function getCachedInstructions(): string {
  return cached ?? '';
}

export async function initInstructionsStore(): Promise<string> {
  await ensureDataDir();
  try {
    await fs.access(INSTRUCTIONS_PATH);
  } catch {
    const starter =
      'שימי מגדיר כאן את הפקודות וההנחיות.\n' +
      'כאן נכתבות ההוראות שעל פיהן יש לענות על שאלות דרך הכלי ask_question.\n' +
      'עדכן את הטקסט הזה (או השתמש ב-set_instructions) כדי לשלוט בתשובות.\n';
    await fs.writeFile(INSTRUCTIONS_PATH, starter, 'utf8');
  }
  return loadInstructions();
}
