# N8N Webhook Workflow - Kompletní příklad

## Proč Webhook místo Chat Trigger?

| Feature | Chat Trigger | Webhook Node |
|---------|--------------|--------------|
| Use case | Embedded chat UI | API volání |
| Mode | "Hosted Chat" | POST/GET |
| Odpověď | Asynchronní (executionStarted) | Synchronní |
| Složitost | Vysoká | Nízká |
| **Pro vaši aplikaci** | ❌ Zbytečně složité | ✅ Ideální |

## Kompletní workflow konfigurace

### Node 1: Webhook (Trigger)

```yaml
Node Type: Webhook
Name: "SEO Chat Webhook"

Parameters:
  HTTP Method: POST
  Path: chat
  Authentication: None
  Respond: "When Last Node Finishes"
  Response Mode: "Last Node"
  Response Data: "All Entries"
```

**Co tento node dělá:**
- Přijímá POST requesty na `/webhook/xxxxx/chat`
- Data dostupná v `$json.body`
- Čeká na dokončení celého workflow před odpovědí

### Node 2: Function nebo Code (Příprava dat)

```yaml
Node Type: Code
Name: "Extract Context"
Language: JavaScript
```

```javascript
// Extrahujte data z requestu
const message = $input.item.json.body.message;
const mode = $input.item.json.body.mode;
const context = $input.item.json.body.context;
const sessionId = $input.item.json.body.sessionId;

// Vytvořte prompt pro AI
const systemPrompt = `You are an expert SEO consultant specializing in Czech market.

Client Context:
- Domain: ${context.domain}
- Market: ${context.market}
- Goals: ${context.goals.join(', ')}
- Analysis Mode: ${mode}
${context.notes ? `- Additional Notes: ${context.notes}` : ''}

Instructions:
- Provide detailed SEO analysis in markdown format
- Include actionable recommendations
- Focus on the specific goals mentioned
${mode === 'quick' ? '- Keep response concise (1500 tokens max)' : '- Provide comprehensive analysis (3500 tokens max)'}
- Write in Czech if the client's domain suggests Czech market
- Structure response with headers, bullet points, and clear sections`;

return {
  systemPrompt,
  userMessage: message,
  mode,
  sessionId,
  maxTokens: mode === 'full' ? 3500 : 1500
};
```

### Node 3: HTTP Request (OpenAI API)

```yaml
Node Type: HTTP Request
Name: "OpenAI GPT-4"

Parameters:
  Method: POST
  URL: https://api.openai.com/v1/chat/completions
  Authentication: Generic Credential Type
    - Credential Type: Header Auth
    - Name: Authorization
    - Value: Bearer YOUR_OPENAI_API_KEY

  Send Body: Yes
  Body Content Type: JSON

  Specify Body: Using JSON
```

**Body:**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "={{ $json.systemPrompt }}"
    },
    {
      "role": "user",
      "content": "={{ $json.userMessage }}"
    }
  ],
  "max_tokens": "={{ $json.maxTokens }}",
  "temperature": 0.7
}
```

**Options:**
- Timeout: 120000 (120 seconds)

### Node 4: Set (Formátování odpovědi)

```yaml
Node Type: Set
Name: "Format Response"

Fields to Set:
  - Name: output
    Type: String
    Value: ={{ $json.choices[0].message.content }}
```

**Výsledek:**
```json
{
  "output": "# SEO Analýza\n\nVaše kompletní odpověď..."
}
```

## Alternativa: Použití AI Agent Node

Pokud chcete použít n8n AI Agent (jednodušší):

### Node 2: AI Agent

```yaml
Node Type: AI Agent
Name: "SEO Analyst Agent"

Agent:
  - Type: Conversational Agent

Model:
  - Model: OpenAI GPT-4o
  - Temperature: 0.7
  - Max Tokens: ={{ $('Webhook').item.json.body.mode === 'full' ? 3500 : 1500 }}

Prompt:
  System Message:
    You are an expert SEO consultant.

    Context:
    - Domain: {{ $('Webhook').item.json.body.context.domain }}
    - Market: {{ $('Webhook').item.json.body.context.market }}
    - Goals: {{ $('Webhook').item.json.body.context.goals.join(', ') }}
    - Mode: {{ $('Webhook').item.json.body.mode }}

    Provide detailed SEO analysis in markdown format.

  Chat Input:
    {{ $('Webhook').item.json.body.message }}

Memory (Optional):
  - Type: Window Buffer Memory
  - Session Key: {{ $('Webhook').item.json.body.sessionId }}
  - Context Window Size: 10
```

### Node 3: Set (pro AI Agent output)

```yaml
Fields to Set:
  - Name: output
    Value: ={{ $('AI Agent').item.json.output }}
```

## Úplná struktura Workflow

```
1. Webhook (POST /chat)
   ↓
2. Code nebo Function (Extract & Prepare)
   ↓
3a. HTTP Request (OpenAI API)
    NEBO
3b. AI Agent (with Memory)
   ↓
4. Set (Format Response: {"output": "..."})
```

## Testování Workflow

### 1. Test v n8n UI

1. Klikněte na Webhook node
2. Klikněte **"Listen for Test Event"**
3. V terminálu:

```bash
curl -X POST https://n8n.couldbe.cz/webhook/xxxxx/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test",
    "message": "Co je SEO?",
    "mode": "quick",
    "context": {
      "domain": "test.cz",
      "market": "e-commerce",
      "goals": ["traffic"],
      "notes": ""
    }
  }'
```

4. Zkontrolujte output v n8n - měli byste vidět data procházet všemi nodes

### 2. Aktivace Workflow

1. Klikněte **"Stop Listening"**
2. Zapněte workflow (toggle vpravo nahoře)
3. Zkopírujte Production Webhook URL

### 3. Test z aplikace

```bash
# Aktualizujte .env
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/NOVA_URL/chat

# Restartujte server
npm run dev

# Testujte
node test-webhook.js
```

## Očekávaná odpověď

**Úspěch:**
```json
{
  "output": "# SEO Analýza pro test.cz\n\n## Úvod\nSEO (Search Engine Optimization)..."
}
```

**Chyba (pokud Respond není správně nastaveno):**
```json
{
  "executionStarted": true,
  "executionId": "123"
}
```

## Pokročilé: Podmíněné zpracování

Pro rozdílné zpracování quick vs. full mode:

```
Webhook
  ↓
Switch (IF node)
  ├─ mode === "quick" → Quick Analysis (1500 tokens)
  └─ mode === "full"  → Full Analysis (3500 tokens)
  ↓
Set (Format Output)
```

### Switch/IF Node

```yaml
Node Type: IF
Name: "Check Mode"

Conditions:
  - Value 1: {{ $json.body.mode }}
    Operation: Equal
    Value 2: quick
```

## Rate Limiting (doporučeno)

Přidejte před HTTP Request:

```yaml
Node Type: Code
Name: "Rate Limit Check"
```

```javascript
// Jednoduchý in-memory rate limit
const rateLimits = globalThis.rateLimits || {};
globalThis.rateLimits = rateLimits;

const sessionId = $input.item.json.sessionId;
const now = Date.now();
const windowMs = 10 * 60 * 1000; // 10 minut
const maxRequests = 30;

if (!rateLimits[sessionId]) {
  rateLimits[sessionId] = [];
}

// Vyčistit staré requesty
rateLimits[sessionId] = rateLimits[sessionId].filter(
  time => now - time < windowMs
);

if (rateLimits[sessionId].length >= maxRequests) {
  throw new Error('Rate limit exceeded. Try again later.');
}

rateLimits[sessionId].push(now);

return $input.all();
```

## Error Handling

Přidejte Error Trigger workflow:

```
Error Trigger
  ↓
Send Email nebo Slack notification
```

## Monitoring & Logging

```yaml
Node Type: Set
Name: "Log Request"

Fields to Set:
  - timestamp: ={{ new Date().toISOString() }}
  - sessionId: ={{ $('Webhook').item.json.body.sessionId }}
  - domain: ={{ $('Webhook').item.json.body.context.domain }}
  - mode: ={{ $('Webhook').item.json.body.mode }}
  - messageLength: ={{ $('Webhook').item.json.body.message.length }}
```

Pak uložte do Google Sheets nebo databáze.

## Checklist

- [ ] Webhook node má `Respond: "When Last Node Finishes"`
- [ ] Poslední node vrací `{"output": "..."}`
- [ ] OpenAI API key je nastavený
- [ ] Workflow je aktivní (ne test mode)
- [ ] Production Webhook URL je zkopírovaná
- [ ] `.env` má novou URL
- [ ] `node test-webhook.js` vrací úspěšnou odpověď

## Troubleshooting

### ❌ Stále dostávám `executionStarted: true`

**Řešení:** Zkontrolujte, že Webhook má:
```
Respond: "When Last Node Finishes"
Response Mode: "Last Node"
```

### ❌ Prázdná odpověď nebo `{}`

**Řešení:** Poslední node nevrací data. Ujistěte se, že Set node má:
```yaml
output: ={{ váš výstup }}
```

### ❌ Timeout po 120 sekundách

**Řešení:**
- Použijte rychlejší model (gpt-4o místo gpt-4)
- Snižte max_tokens
- Zkontrolujte, že OpenAI API odpovídá rychle

### ❌ OpenAI API chyba

**Řešení:**
- Zkontrolujte API key
- Zkontrolujte kredit v OpenAI účtu
- Zkontrolujte rate limits na OpenAI

## Doporučené nastavení pro produkci

```yaml
Model:
  Quick mode: gpt-4o-mini (levnější, rychlejší)
  Full mode: gpt-4o

Max Tokens:
  Quick: 1500
  Full: 3500

Temperature: 0.7

Timeout: 120 seconds

Rate Limit: 30 requests / 10 minutes
```

---

**Důležité:** Toto je mnohem jednodušší řešení než Chat Trigger pro váš use case!
