# Návod: Vytvoření n8n Webhook pro SEO Chat

## Problém s Chat Trigger Node
❌ **Chat Trigger** node je pro embedded chat interface v n8n
✅ **Webhook** node je pro API volání z externí aplikace

## Řešení: Vytvoř nový workflow s Webhook

### 1. Nový Workflow
1. V n8n: **+ New workflow**
2. Název: "SEO Chat API"

### 2. Přidej Webhook Node
1. Klikni na **"+"**
2. Vyhledej: **"Webhook"**
3. Vyber: **Webhook** (ne Chat Trigger!)

### 3. Konfigurace Webhook Node

**Parameters tab:**
```
HTTP Method: POST
Path: chat
Authentication: None
Respond: "When Last Node Finishes"  ⚠️ KRITICKÉ!
Response Mode: "When Last Node Finishes"
```

**⚠️ POZOR:** Nesmí být nastaveno:
- ❌ "Using 'Respond to Webhook' Node"
- ❌ "Using a 'Respond to Webhook' node"

### 4. Zpracování Dat

Webhook přijme data ve formátu:
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

Přístup k datům v dalších nodes:
```
{{ $json.body.message }}          - uživatelova zpráva
{{ $json.body.mode }}              - quick / full
{{ $json.body.context.domain }}    - doména
{{ $json.body.context.market }}    - trh
{{ $json.body.context.goals }}     - cíle (array)
{{ $json.body.context.notes }}     - poznámky
```

### 5. Příklad Workflow

```
┌─────────────┐
│  Webhook    │
│  (POST)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ OpenAI Chat │  nebo Agent/LLM node
│             │
│ Prompt:     │
│ "You are... │
│ User asks:  │
│ {{$json...}}│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Edit Fields │ (Set node)
│             │
│ {           │
│   "output": │
│   "{{$json  │
│    .message │
│    .content│
│   }}"       │
│ }           │
└─────────────┘
```

### 6. OpenAI Node Nastavení (příklad)

**Model:** gpt-4 nebo gpt-4o
**System Message:**
```
You are an expert SEO consultant. Analyze the user's request and provide detailed SEO strategy.

Context:
- Domain: {{ $('Webhook').item.json.body.context.domain }}
- Market: {{ $('Webhook').item.json.body.context.market }}
- Goals: {{ $('Webhook').item.json.body.context.goals.join(', ') }}
- Mode: {{ $('Webhook').item.json.body.mode }}

Respond in markdown format with actionable insights.
```

**User Message:**
```
{{ $('Webhook').item.json.body.message }}
```

### 7. Formát Odpovědi

Poslední node MUSÍ vrátit JSON s jedním z těchto polí:

**Doporučeno:**
```json
{
  "output": "# SEO Analýza\n\n Váš obsah..."
}
```

**Alternativy (také fungují):**
```json
{
  "reply": "obsah..."
}
```
```json
{
  "message": "obsah..."
}
```

### 8. Získej Production Webhook URL

1. Klikni na Webhook node
2. V Parameters najdi **"Webhook URLs"**
3. Zkopíruj **Production URL** (ne Test URL!)
4. Mělo by vypadat: `https://n8n.couldbe.cz/webhook/xxxxx/chat`

### 9. Aktualizuj .env v aplikaci

```bash
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/TVOJE_NOVA_URL/chat
```

### 10. Test Workflow

1. Ulož workflow (Ctrl+S)
2. Aktivuj workflow (toggle vpravo nahoře)
3. V aplikaci refresh stránku
4. Pošli testovací zprávu
5. Zkontroluj executions v n8n

## Troubleshooting

### Stále dostávám async execution error?
- Zkontroluj, že Webhook má **"Respond: When Last Node Finishes"**
- NE "Using 'Respond to Webhook' Node"

### Dostávám timeout?
- Workflow trvá > 120s
- Optimalizuj AI model (použij gpt-4o místo o1)
- Nebo zkrať analýzu v quick mode

### Dostávám "Unexpected response format"?
- Ujisti se, že poslední node vrací JSON
- Musí obsahovat pole: output, reply, message, text nebo response

### Webhook vrací 404?
- Workflow není aktivní (toggle vpravo nahoře)
- URL je špatně zkopírovaná
- Používáš Test URL místo Production URL

## Quick Test

Použij curl pro test:
```bash
curl -X POST https://n8n.couldbe.cz/webhook/xxxxx/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "message": "Co je SEO?",
    "mode": "quick",
    "context": {
      "domain": "example.com",
      "market": "test",
      "goals": ["test"],
      "notes": ""
    }
  }'
```

Mělo by vrátit:
```json
{
  "output": "SEO je..."
}
```
