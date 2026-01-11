# Přístup k datům ve vašem n8n Workflow

## ✅ Aplikace byla upravena pro Embedded Chat protokol

Aplikace nyní posílá správný formát pro **Embedded Chat** mode:

```json
{
  "action": "sendMessage",
  "chatInput": "Co je SEO?",
  "sessionId": "unique-id",
  "mode": "quick",
  "context": {
    "domain": "example.com",
    "market": "e-commerce",
    "goals": ["increase traffic"],
    "notes": "..."
  }
}
```

## Přístup k datům v n8n nodes

### V Chat Trigger node

Data jsou dostupná v `$json`:

```javascript
// Uživatelova zpráva (NOVĚ: chatInput místo message)
{{ $json.chatInput }}

// Session ID
{{ $json.sessionId }}

// SEO Context
{{ $json.context.domain }}
{{ $json.context.market }}
{{ $json.context.goals }}        // Array
{{ $json.context.notes }}

// Analysis Mode
{{ $json.mode }}                 // "quick" nebo "full"

// Action (vždy "sendMessage")
{{ $json.action }}
```

### V dalších nodes

Pokud potřebujete přistupovat k datům z Chat Trigger v dalších nodes:

```javascript
// Referenční syntax
{{ $('Chat Trigger').item.json.chatInput }}
{{ $('Chat Trigger').item.json.context.domain }}
{{ $('Chat Trigger').item.json.mode }}
```

## Příklady použití ve workflow

### 1. Code/Function Node - Příprava AI Promptu

```javascript
// Extrahujte data z Chat Trigger
const chatInput = $input.item.json.chatInput;
const mode = $input.item.json.mode;
const context = $input.item.json.context;

// Sestavte system prompt
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
${mode === 'quick' ? '- Keep response concise (max 1500 tokens)' : '- Provide comprehensive analysis (max 3500 tokens)'}
- Write in Czech if domain suggests Czech market
`;

return {
  systemPrompt,
  userMessage: chatInput,
  mode,
  maxTokens: mode === 'full' ? 3500 : 1500
};
```

### 2. AI Agent Node - Direct Prompt

V **System Message**:

```
You are an expert SEO consultant.

Context:
- Domain: {{ $json.context.domain }}
- Market: {{ $json.context.market }}
- Goals: {{ $json.context.goals.join(', ') }}
- Mode: {{ $json.mode }}

{{ $json.context.notes ? 'Notes: ' + $json.context.notes : '' }}

Provide detailed SEO analysis in markdown format.
```

V **Chat Input**:

```
{{ $json.chatInput }}
```

### 3. HTTP Request Node - OpenAI API

**URL:** `https://api.openai.com/v1/chat/completions`

**Body:**

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "={{ 'You are an SEO expert. Domain: ' + $('Chat Trigger').item.json.context.domain + ', Market: ' + $('Chat Trigger').item.json.context.market }}"
    },
    {
      "role": "user",
      "content": "={{ $('Chat Trigger').item.json.chatInput }}"
    }
  ],
  "max_tokens": "={{ $('Chat Trigger').item.json.mode === 'full' ? 3500 : 1500 }}",
  "temperature": 0.7
}
```

### 4. Respond to Webhook Node

**Response Body** (to, co se vrátí do aplikace):

```json
{
  "output": "={{ $json.choices[0].message.content }}"
}
```

Nebo pokud máte text přímo:

```json
{
  "output": "={{ $json.output }}"
}
```

**DŮLEŽITÉ:** Pole **MUSÍ** být `output` (nebo `reply`, `message`, `text`, `response`)

## Kontrolní checklist

- [ ] Chat Trigger má Mode: "Embedded Chat"
- [ ] Response Mode je: "Using 'Respond to Webhook' Node"
- [ ] Workflow obsahuje "Respond to Webhook" node na konci
- [ ] Respond to Webhook vrací `{"output": "..."}`
- [ ] V nodes přistupujete k `$json.chatInput` (ne `$json.message`)
- [ ] Context data jsou dostupná v `$json.context.*`

## Testování

### 1. Test dat z Chat Trigger

Přidejte **Code node** hned za Chat Trigger:

```javascript
// Debug - zobrazí všechna příchozí data
console.log('Received data:', JSON.stringify($input.item.json, null, 2));

return {
  debug: {
    chatInput: $input.item.json.chatInput,
    sessionId: $input.item.json.sessionId,
    mode: $input.item.json.mode,
    domain: $input.item.json.context?.domain,
    market: $input.item.json.context?.market,
    goals: $input.item.json.context?.goals
  }
};
```

Pak použijte Respond to Webhook:

```json
{
  "output": "={{ JSON.stringify($json.debug, null, 2) }}"
}
```

To vám vrátí všechna data zpět do aplikace pro kontrolu.

### 2. Test z aplikace

Spusťte:

```bash
npm run dev
node test-webhook.js
```

V konzoli uvidíte:
```
[N8N REQUEST] Sending Embedded Chat format: {
  action: 'sendMessage',
  chatInput: 'Co je SEO a proč je důležité...',
  sessionId: 'test-quick-...',
  mode: 'quick'
}

[N8N RESPONSE] Received: {"output":"# SEO Analýza..."}
```

## Časté problémy a řešení

### ❌ Stále dostávám `executionStarted: true`

**Příčina:** Respond to Webhook node chybí nebo je špatně nakonfigurovaný

**Řešení:**
1. Zkontrolujte, že máte Respond to Webhook node na konci
2. Ujistěte se, že vrací správný formát
3. Zkontrolujte Response Mode v Chat Trigger

### ❌ `$json.chatInput` je undefined

**Příčina:** Aplikace ještě posílá starý formát nebo node nevidí Chat Trigger data

**Řešení:**
1. Restartujte dev server: `npm run dev`
2. Clear browser cache
3. V n8n zkontrolujte execution log a podívejte se na data v Chat Trigger

### ❌ Context data nejsou dostupná

**Příčina:** Data možná nejsou správně předaná

**Řešení:**
Použijte debug Code node (viz sekce Testování výše) a zkontrolujte, co přesně přichází.

## Příklad kompletního workflow

```
┌──────────────────────┐
│  Chat Trigger        │
│  Mode: Embedded Chat │
│  Response: Using     │
│  Respond to Webhook  │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Code                │  ← Příprava promptu
│  Extract context     │    - systemPrompt
│                      │    - userMessage
│                      │    - maxTokens
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  HTTP Request        │  ← OpenAI API
│  (nebo AI Agent)     │
│                      │
│  POST /chat/...      │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Set / Edit Fields   │  ← Formátování
│                      │
│  output =            │
│  {{ $json.choices... │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Respond to Webhook  │  ← Synchronní odpověď
│                      │
│  Body:               │
│  {"output": "..."}   │
└──────────────────────┘
```

## Další kroky

1. Otestujte novou verzi aplikace
2. Zkontrolujte, že workflow dostává správná data
3. Upravte AI prompts podle potřeby
4. Otestujte quick i full mode

---

Vytvořeno: 2026-01-11
Pro: SEO Specialist Chat s n8n Embedded Chat
