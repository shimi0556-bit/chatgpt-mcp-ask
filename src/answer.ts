/**
 * Deterministic answering from operator instructions only (no external LLM).
 */

const HEBREW_RE = /[\u0590-\u05FF]/;

export function isHebrew(text: string): boolean {
  return HEBREW_RE.test(text);
}

export function answerFromInstructions(question: string, instructions: string): string {
  const he = isHebrew(question);
  const trimmed = instructions.trim();

  if (!trimmed) {
    return he
      ? 'אין כרגע הוראות מפעיל. על המפעיל לקרוא לכלי set_instructions תחילה ולהגדיר כיצד לענות על שאלות.'
      : 'No operator instructions are set yet. The operator should call set_instructions first to define how questions are answered.';
  }

  // Deterministic: the answer is strictly the operator instructions applied to the question.
  // No external facts; ChatGPT must not invent beyond this payload.
  if (he) {
    return [
      'תשובה לפי הוראות המפעיל בלבד (ללא מקורות חיצוניים):',
      '',
      '— שאלת המשתמש —',
      question.trim(),
      '',
      '— הוראות המפעיל (מקור התשובה היחיד) —',
      trimmed,
      '',
      'יש לענות על השאלה אך ורק על סמך ההוראות לעיל. אם ההוראות אינן מספיקות לשאלה — ציין זאת במפורש ולא להמציא עובדות.'
    ].join('\n');
  }

  return [
    'Answer governed solely by operator instructions (no external sources):',
    '',
    '— User question —',
    question.trim(),
    '',
    '— Operator instructions (sole answer source) —',
    trimmed,
    '',
    'Answer the question using only the instructions above. If they are insufficient, say so explicitly and do not invent facts.'
  ].join('\n');
}
