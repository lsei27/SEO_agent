# N8N Chat Trigger - Kompletní průvodce napojením

## Co je Chat Trigger v n8n?

**Chat Trigger** je specializovaný node v n8n určený pro vytváření AI chatbotů a embedded chat rozhraní. Liší se od běžného Webhook node:

| Vlastnost | Chat Trigger | Webhook Node |
|-----------|--------------|--------------|
| Účel | AI chatboty, embedded chat | API volání, obecné webhooky |
| Formát dat | Specifický pro chat (action, sessionId) | Libovolný JSON |
| Odpověď | Respond to Webhook/Respond to Chat | Přímá odpověď nebo "When Last Node Finishes" |
| Streaming | Podporuje streaming odpovědí | Nepodporuje streaming |
| AI Agent integrace | Nativní integrace | Manuální konfigurace |

## Vaše webhook URL

```
https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat
```

## Konfigurace n8n Workflow s Chat Trigger

### 1. Struktura Workflow

Doporučená struktura pro SEO Chat:

```
┌─────────────────┐
│  Chat Trigger   │
│                 │
│ Mode: Chat      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Agent       │
│                 │
│ Tools: Custom   │
│ Memory: Yes     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Respond to      │
│ Webhook         │
└─────────────────┘
```

### 2. Chat Trigger Node - Nastavení

#### Basic Parameters

```yaml
Mode: Chat
Authentication: None  # nebo Basic Auth podle potřeby
Options:
  - Allow File Uploads: false
  - Public: true (pokud není potřeba auth)
```

#### Advanced - Chat Input Key

Chat Trigger očekává specifické klíče v request body:

- **Default chat input key**: `chatInput` nebo `message`
- **Default session key**: `sessionId`

### 3. Zpracování Request Body

Vaše aplikace posílá tento formát:

```json
{
  "sessionId": "abc123",
  "message": "Co je SEO?",
  "mode": "quick",
  "context": {
    "domain": "example.com",
    "market": "e-commerce",
    "goals": ["increase traffic"],
    "notes": "Focus on Czech market"
  }
}
```

#### Mapping v n8n

V **AI Agent node** musíte namapovat data:

1. Přejděte na AI Agent node
2. V sekci **Chat** nastavte:
   - **Chat Messages**: `{{ $json.body.message }}` nebo `{{ $('Chat Trigger').item.json.chatInput }}`

3. Pro přístup ke kontextu použijte v System Message:

```
You are an expert SEO consultant.

Client Context:
- Domain: {{ $('Chat Trigger').item.json.body.context.domain }}
- Market: {{ $('Chat Trigger').item.json.body.context.market }}
- Goals: {{ $('Chat Trigger').item.json.body.context.goals }}
- Analysis Mode: {{ $('Chat Trigger').item.json.body.mode }}

{{ $('Chat Trigger').item.json.body.context.notes ? 'Additional Notes: ' + $('Chat Trigger').item.json.body.context.notes : '' }}

Provide detailed SEO analysis in markdown format with actionable insights.
```

### 4. AI Agent Node - Konfigurace

#### Model Selection

```yaml
Model: OpenAI GPT-4o  # nebo Claude, Gemini podle preferencí
Temperature: 0.7
Max Tokens: 4000  # pro "full" mode, 2000 pro "quick"
```

#### Dynamic Response Length

Pro dynamickou délku odpovědi založenou na `mode`:

```javascript
// V Code node před AI Agent
const mode = $('Chat Trigger').item.json.body.mode;
const maxTokens = mode === 'full' ? 4000 : 2000;

return {
  maxTokens: maxTokens
};
```

#### Memory Configuration

Pro udržování konverzační historie:

1. Přidejte **Window Buffer Memory** node
2. Nastavte:
   - **Session Key**: `{{ $('Chat Trigger').item.json.body.sessionId }}`
   - **Context Window**: 10 (posledních 10 zpráv)

### 5. Respond to Webhook Node - Kritické nastavení

#### DŮLEŽITÉ: Response Configuration

V **Chat Trigger node** musí být nastaveno:

```yaml
Respond: "Using 'Respond to Webhook' Node"
```

Ne "When Last Node Finishes"!

#### Respond to Webhook Node

```yaml
Response Mode: "First Incoming Data"
Response Data Source: "Using Fields Below"

Response Body:
{
  "output": "={{ $json.output }}"
}
```

Nebo pro AI Agent output:

```json
{
  "output": "={{ $('AI Agent').item.json.output }}"
}
```

### 6. Podmíněné zpracování podle Mode

Přidejte **Switch node** pro rozlišení quick/full režimu:

```yaml
Mode: Rules
Rules:
  - Value 1: {{ $('Chat Trigger').item.json.body.mode }}
    Operation: Equals
    Value 2: "quick"
    Output: 0 (Quick Analysis)

  - Value 1: {{ $('Chat Trigger').item.json.body.mode }}
    Operation: Equals
    Value 2: "full"
    Output: 1 (Full Analysis)
```

## Integrace s aplikací

### 1. Aktualizace .env souboru

```bash
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat
N8N_WEBHOOK_TOKEN=  # pokud máte auth token
```

### 2. Ověření API kompatibility

Aplikace posílá standardní HTTP POST s JSON body. Chat Trigger to automaticky zpracuje.

**Žádné úpravy v aplikaci nejsou potřeba** - Chat Trigger přijímá běžný JSON formát.

### 3. Restart serveru

```bash
npm run dev
```

## Testování

### 1. Test v n8n UI

1. Otevřete workflow v n8n
2. Klikněte na Chat Trigger node
3. Klikněte na **Test** tab
4. Použijte "Test in Chat" pro manuální test

### 2. Test z aplikace

1. Otevřete `http://localhost:3000`
2. Vyplňte SEO Context:
   - Domain: `example.com`
   - Market: `e-commerce`
   - Goals: `increase organic traffic`
3. Napište: "Jaká je strategie pro SEO v e-commerce?"
4. Zkontrolujte response

### 3. Test pomocí curl

```bash
curl -X POST \
  https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "message": "Co je SEO?",
    "mode": "quick",
    "context": {
      "domain": "test.com",
      "market": "technology",
      "goals": ["traffic", "conversions"],
      "notes": "Focus on B2B"
    }
  }'
```

Očekávaná odpověď:

```json
{
  "output": "# SEO Analýza\n\nSEO (Search Engine Optimization) je..."
}
```

## Troubleshooting

### Chyba: "n8n workflow is configured for asynchronous execution"

**Příčina**: Chat Trigger má špatně nastavený Response mode.

**Řešení**:
1. Otevřete Chat Trigger node
2. Změňte **Respond** na: `"Using 'Respond to Webhook' Node"`
3. Ujistěte se, že máte **Respond to Webhook** node na konci workflow

### Chyba: "Unexpected response format"

**Příčina**: Respond to Webhook vrací nesprávný formát.

**Řešení**: Ujistěte se, že response obsahuje jedno z těchto polí:
- `output` (doporučeno)
- `reply`
- `message`
- `text`
- `response`

### Timeout Error

**Příčina**: AI model trvá > 120 sekund.

**Řešení**:
1. Použijte rychlejší model (GPT-4o místo O1)
2. Snižte max_tokens v "quick" režimu
3. Implementujte streaming response

### SessionId není zachován

**Příčina**: Memory node nemá správně nakonfigurovaný Session Key.

**Řešení**:
```javascript
// V Memory node
Session Key: {{ $('Chat Trigger').item.json.body.sessionId }}
```

## Pokročilé funkce

### 1. Streaming Responses

Pro real-time streaming (postupné zobrazování odpovědi):

```yaml
Chat Trigger node:
  Options:
    - Enable Streaming: true

Respond to Webhook:
  Response Mode: "Stream Response"
```

Aplikace zatím streaming nepodporuje, ale můžete jej přidat pomocí Server-Sent Events (SSE).

### 2. File Uploads

Chat Trigger podporuje nahrávání souborů (např. pro analýzu screenshotů webu):

```yaml
Chat Trigger node:
  Options:
    - Allow File Uploads: true
    - Max File Size: 10 MB
```

### 3. Rate Limiting v n8n

Pro ochranu před nadměrným používáním:

```
┌─────────────────┐
│  Chat Trigger   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limit     │  <- Přidat tento node
│  (HTTP Request) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Agent       │
└─────────────────┘
```

### 4. Logging & Analytics

Pro trackování použití:

```javascript
// Code node po Chat Trigger
const logEntry = {
  timestamp: new Date().toISOString(),
  sessionId: $('Chat Trigger').item.json.body.sessionId,
  domain: $('Chat Trigger').item.json.body.context.domain,
  mode: $('Chat Trigger').item.json.body.mode,
  messageLength: $('Chat Trigger').item.json.body.message.length
};

// Uložit do Google Sheets nebo databáze
return { logEntry };
```

## Doporučené nastavení pro produkci

### Performance

```yaml
AI Agent:
  Model: GPT-4o-mini  # pro quick mode
  Model: GPT-4o       # pro full mode
  Temperature: 0.7
  Max Tokens:
    - Quick: 1500
    - Full: 3500

Memory:
  Window Size: 8 messages
  Session Timeout: 1 hour
```

### Security

```yaml
Chat Trigger:
  Authentication: Basic Auth
  Username: {{ $env.CHAT_USER }}
  Password: {{ $env.CHAT_PASSWORD }}

  Options:
    - Rate Limiting: true
    - Max Requests per Minute: 20
```

### Monitoring

Přidejte Error Trigger pro monitoring selhání:

```
Error Trigger → Send notification (Email/Slack)
```

## Srovnání: Chat Trigger vs. Webhook Node

### Kdy použít Chat Trigger:

✅ Chatbot s AI Agent
✅ Potřeba session management
✅ Streaming responses
✅ File uploads v chatu
✅ Embedded chat interface

### Kdy použít Webhook Node:

✅ Jednoduchá API volání
✅ Synchronní odpovědi bez streaming
✅ Nepotřebujete AI Agent integraci
✅ Vlastní formát odpovědi

**Pro vaši SEO aplikaci**: Chat Trigger je lepší volba, pokud plánujete používat AI Agent s memory. Pokud chcete pouze jednoduché API, Webhook node stačí.

## Další kroky

1. ✅ Nakonfigurujte Chat Trigger node podle tohoto návodu
2. ✅ Přidejte AI Agent s Memory pro konverzační kontext
3. ✅ Nastavte Respond to Webhook s formátem `{"output": "..."}`
4. ✅ Aktivujte workflow (toggle vpravo nahoře)
5. ✅ Aktualizujte `.env` s webhook URL
6. ✅ Testujte z aplikace

## Reference & Zdroje

- [Chat Trigger node documentation | n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/)
- [Respond to Webhook | n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [n8n Community - Chat Trigger Examples](https://community.n8n.io/t/how-to-respond-to-chat-trigger-via-respond-to-webhook-node/247432)

---

Vytvořeno: 2026-01-11
Pro: SEO Specialist Chat Application
