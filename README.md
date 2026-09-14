# shimi-ask — MCP Ask Server

שרת MCP מקומי (Streamable HTTP) שמאפשר ל־ChatGPT לענות על שאלות לפי הוראות שהמפעיל (שימי) מגדיר.

A local MCP server so ChatGPT (Developer Mode) can answer questions according to operator-controlled instructions. No OpenAI API key required on the server.

## התקנה והרצה / Install & run

```bash
cd /workspace/chatgpt-mcp-ask
npm install
npm run build
npm start
```

פיתוח עם reload:

```bash
npm run dev
```

- **MCP URL (מקומי):** `http://localhost:3000/mcp`
- **Health:** `http://localhost:3000/health`
- **פורט:** `3000` (או משתנה סביבה `PORT`)
- **Host:** ברירת מחדל `127.0.0.1` (`HOST=0.0.0.0` ל־Docker / גישה חיצונית)

משתני סביבה אופציונליים:

| משתנה | ברירת מחדל | תיאור |
|--------|------------|--------|
| `PORT` | `3000` | פורט האזנה |
| `HOST` | `127.0.0.1` | כתובת bind |
| `ALLOWED_HOSTS` | (אוטומטי ל־localhost) | רשימה מופרדת בפסיקים ל־Host header (למשל דומיין של tunnel) |

## כלים / Tools

1. **`ask_question`** — עונה לשאלה לפי ההוראות השמורות בלבד (ללא LLM חיצוני בשרת).
2. **`set_instructions`** — מחליף את מלוא טקסט ההוראות ושומר ל־`data/instructions.txt`.
3. **`get_instructions`** — קורא את ההוראות הנוכחיות.

## חיבור ל־ChatGPT (Developer Mode)

1. Settings → **Security and login** → הפעל **Developer mode**.
2. לך ל־**Plugins** → **+** → הוסף אפליקציית developer-mode.
3. כתובת ה־MCP חייבת להיות **HTTPS ציבורי** שמסתיים ב־`/mcp`, **או** השתמש ב־**Secure MCP Tunnel** לשרת מקומי.

### מקומי עם Tunnel

השרת אצלך רץ על `http://localhost:3000/mcp`. ChatGPT לא יכול לגשת ל־localhost ישירות — צריך:

- Secure MCP Tunnel (אם זמין בחשבון), **או**
- Tunnel חיצוני (למשל Cloudflare Tunnel / ngrok) שמפרסם HTTPS ל־`/mcp`.

אם ה־Host של ה־tunnel אינו localhost, הגדר למשל:

```bash
HOST=0.0.0.0 ALLOWED_HOSTS=your-tunnel.example.com,localhost,127.0.0.1 npm start
```

### אחרי החיבור

1. קרא ל־`set_instructions` עם ההנחיות שלך (או ערוך את `data/instructions.txt` והפעל מחדש).
2. שאל שאלות — ChatGPT אמור להשתמש ב־`ask_question`.

## קבצים חשובים

- `src/index.ts` — Express + Streamable HTTP על `/mcp`
- `src/server.ts` — רישום הכלים + `instructions` ל־MCP
- `src/answer.ts` — מענה דטרמיניסטי לפי ההוראות
- `src/instructionsStore.ts` — טעינה/שמירה ל־`data/instructions.txt`
- `data/instructions.txt` — הוראות המפעיל

## Docker (אופציונלי)

```bash
docker build -t shimi-ask .
docker run --rm -p 3000:3000 -v "$(pwd)/data:/app/data" -e HOST=0.0.0.0 shimi-ask
```

## הערות

- אין OAuth / אימות ב־v1.
- אין צורך במפתח OpenAI בשרת — התשובות נגזרות מהוראות המפעיל בלבד.
- פרויקט מקומי בלבד (ללא git / GitHub / Origin אלא אם תוסיף בעצמך).
