# Rychlý start: Napojení n8n Chat Trigger

## Co jsem udělal

✅ Prostudoval jsem váš projekt a n8n Chat Trigger
✅ Aktualizoval `.env` s vaší webhook URL
✅ Vytvořil kompletní dokumentaci `N8N_CHAT_TRIGGER_GUIDE.md`
✅ Vytvořil testovací skripty pro rychlé testování

## Vaše webhook URL

```
https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat
```

## Rychlý test (3 kroky)

### 1. Test webhooku (před konfigurací n8n)

Otevřete terminál a spusťte:

```bash
node test-webhook.js
```

Tento skript otestuje, zda váš n8n workflow odpovídá správně.

**Očekávaný výstup při správné konfiguraci:**

```json
✅ SUCCESS Response:
{
  "output": "# SEO Analýza\n\n..."
}
```

**Časté chyby:**

- **404 Not Found** → Workflow není aktivní nebo URL je špatná
- **Timeout** → Workflow trvá příliš dlouho (> 120s)
- **Async execution error** → Chat Trigger má špatně nastavený Response mode

### 2. Konfigurace n8n workflow

Otevřete váš workflow v n8n a ujistěte se:

#### A) Chat Trigger Node

```yaml
Parameters:
  - Mode: Chat
  - Respond: "Using 'Respond to Webhook' Node"  ⚠️ KRITICKÉ!
  - Authentication: None (nebo podle potřeby)
```

#### B) AI Agent Node (doporučeno)

```yaml
Model: GPT-4o nebo Claude
System Message:
  "You are an expert SEO consultant.

   Client Context:
   - Domain: {{ $('Chat Trigger').item.json.body.context.domain }}
   - Market: {{ $('Chat Trigger').item.json.body.context.market }}
   - Goals: {{ $('Chat Trigger').item.json.body.context.goals }}
   - Mode: {{ $('Chat Trigger').item.json.body.mode }}

   Provide detailed SEO analysis in markdown format."

User Message:
  "{{ $('Chat Trigger').item.json.body.message }}"
```

#### C) Respond to Webhook Node

```yaml
Response Data:
{
  "output": "={{ $('AI Agent').item.json.output }}"
}
```

### 3. Spusťte aplikaci

```bash
npm run dev
```

Otevřete `http://localhost:3000` a otestujte chat.

## Struktura dat

### Request (co aplikace posílá)

```json
{
  "sessionId": "unique-session-id",
  "message": "Co je SEO?",
  "mode": "quick",
  "context": {
    "domain": "example.com",
    "market": "e-commerce",
    "goals": ["increase traffic"],
    "notes": "Optional notes"
  }
}
```

### Response (co n8n musí vrátit)

```json
{
  "output": "# SEO Analysis\n\nYour markdown response..."
}
```

Nebo alternativně: `reply`, `message`, `text`, nebo `response`

## Nejčastější problémy

### ❌ "n8n workflow is configured for asynchronous execution"

**Příčina:** Chat Trigger má `Respond: "Immediately"` nebo chybí Respond to Webhook node

**Řešení:**
1. V Chat Trigger node změňte `Respond` na: `"Using 'Respond to Webhook' Node"`
2. Přidejte Respond to Webhook node na konec workflow

### ❌ "Unexpected response format"

**Příčina:** Response neobsahuje správná pole

**Řešení:** V Respond to Webhook node nastavte:
```json
{
  "output": "={{ $('AI Agent').item.json.output }}"
}
```

### ❌ Timeout (> 120s)

**Příčina:** AI model je příliš pomalý

**Řešení:**
- Použijte GPT-4o místo GPT-4 nebo O1
- Snižte max_tokens v quick mode na 1500-2000
- V full mode použijte max 3500 tokens

### ❌ 404 Not Found

**Příčina:** Workflow není aktivní nebo URL je špatná

**Řešení:**
1. Zkontrolujte, že workflow je aktivní (toggle vpravo nahoře v n8n)
2. Zkopírujte **Production URL** (ne Test URL) z Chat Trigger node
3. Aktualizujte `.env`

## Doporučené nastavení pro produkci

### Performance

```yaml
Quick mode:
  Model: GPT-4o-mini
  Max Tokens: 1500
  Temperature: 0.7

Full mode:
  Model: GPT-4o
  Max Tokens: 3500
  Temperature: 0.7
```

### Memory (pro zachování konverzace)

```yaml
Memory Node: Window Buffer Memory
Session Key: {{ $('Chat Trigger').item.json.body.sessionId }}
Context Window: 8-10 messages
```

### Rate Limiting

```yaml
Chat Trigger Options:
  - Max Requests per Minute: 20
  - Timeout: 120 seconds
```

## Další dokumentace

Pro detailní informace viz:

- `N8N_CHAT_TRIGGER_GUIDE.md` - Kompletní průvodce konfigurací
- `N8N_SETUP.md` - Původní návod pro Webhook node
- `README.md` - Dokumentace aplikace

## Testovací skripty

### Node.js (doporučeno)

```bash
node test-webhook.js
```

- Testuje quick i full mode
- Zobrazuje detailní výstup
- Validuje formát odpovědi

### Bash (curl)

```bash
./test-webhook.sh
```

Vyžaduje: `curl`, `jq`

### Manual test (curl)

```bash
curl -X POST \
  https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test",
    "message": "Co je SEO?",
    "mode": "quick",
    "context": {
      "domain": "test.com",
      "market": "test",
      "goals": ["test"],
      "notes": ""
    }
  }'
```

## Checklist před spuštěním

- [ ] n8n workflow je aktivní
- [ ] Chat Trigger má `Respond: "Using 'Respond to Webhook' Node"`
- [ ] Respond to Webhook node vrací `{"output": "..."}`
- [ ] `.env` obsahuje správnou webhook URL
- [ ] `node test-webhook.js` vrací úspěšnou odpověď
- [ ] Dev server běží (`npm run dev`)
- [ ] Můžete se přihlásit (admin / demo123)

## Kontakt a podpora

Pro detailní technické informace:
- Chat Trigger vs Webhook Node rozdíly
- Streaming responses
- File uploads
- Advanced memory management
- Rate limiting strategies

Viz `N8N_CHAT_TRIGGER_GUIDE.md`

---

Vytvořeno: 2026-01-11
