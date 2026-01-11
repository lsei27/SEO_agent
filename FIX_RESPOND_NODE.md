# ✅ ŘEŠENÍ: Nahraďte "Respond to Chat" za "Respond to Webhook"

## Problém identifikován

Váš workflow používá **"Respond to Chat"** node, který je určený pro interaktivní chat v n8n UI, ne pro API volání z externí aplikace.

**Aktuální stav:**
```
Chat Trigger (Embedded Chat)
  → SEO Director Agent
  → Respond to Chat  ❌ Toto způsobuje async execution
```

**Potřebný stav:**
```
Chat Trigger (Embedded Chat)
  → SEO Director Agent
  → Respond to Webhook  ✅ Toto vrátí synchronní response
```

## Krok za krokem: Jak opravit workflow

### 1. Smažte "Respond to Chat" node

1. V n8n workflow klikněte na **"Respond to Chat"** node
2. Stiskněte **Delete** nebo klikněte na ikonku koše
3. Potvrďte smazání

### 2. Přidejte "Respond to Webhook" node

1. Klikněte na **"SEO Director Agent"** node (předposlední node)
2. Klikněte na **+** (Add node) pod ním
3. Do vyhledávacího pole napište: **"Respond to Webhook"**
4. Vyberte **"Respond to Webhook"** node
5. Node se přidá

### 3. Nakonfigurujte "Respond to Webhook" node

V **Parameters** tab nastavte:

```yaml
Respond With: First Incoming Data
Response Code: 200
Response Headers: (ponechte prázdné)

Response Body:
  Mode: JSON
```

**Do "Response Body" vložte:**

```json
{
  "output": "={{ $json.output }}"
}
```

**DŮLEŽITÉ:** Pokud váš SEO Director Agent vrací výsledek pod jiným názvem pole (např. `text`, `result`, `response`), upravte to:

```json
{
  "output": "={{ $json.text }}"
}
```
nebo
```json
{
  "output": "={{ $json.result }}"
}
```

### 4. Ověřte konfiguraci

Klikněte na **"Respond to Webhook"** node a zkontrolujte INPUT (levá strana):

- Měli byste vidět data z **"SEO Director Agent"**
- Mělo by tam být pole `output` (nebo podobné) s textem

### 5. Uložte workflow

- Stiskněte **Ctrl+S** (Cmd+S na Mac)
- Nebo klikněte na **Save** tlačítko vpravo nahoře

### 6. Ověřte, že workflow je aktivní

- Toggle vpravo nahoře by měl být **ZELENÝ** (zapnutý)
- Pokud není, klikněte na něj pro aktivaci

## Testování

### 1. Test z terminálu

Spusťte testovací skript:

```bash
node test-webhook.js
```

**Očekávaný výsledek:**

```
✅ SUCCESS Response:
{
  "output": "# SEO Analýza\n\n..."
}
```

**NE:**
```
{
  "executionStarted": true,
  "executionId": "..."
}
```

### 2. Test z aplikace

```bash
npm run dev
```

Otevřete `http://localhost:3000` a vyzkoušejte chat.

## Jak poznat, že to funguje?

✅ **Funguje správně:**
- Test skript vrací `{"output": "..."}`
- V aplikaci vidíte odpověď v chatu
- Response přichází okamžitě (ne async)
- V konzoli dev serveru vidíte: `[N8N RESPONSE] Received: {"output":"...`

❌ **Stále nefunguje:**
- Test skript vrací `{"executionStarted": true}`
- V aplikaci vidíte chybu "async execution"
- Zkontrolujte tyto body:

## Troubleshooting

### Problém: Stále dostávám `executionStarted: true`

**Možné příčiny:**

1. **Workflow není uložený**
   - Uložte workflow (Ctrl+S)
   - Zkontrolujte, že zelený indikátor se objevil

2. **Respond to Webhook není poslední node**
   - Ujistěte se, že za Respond to Webhook není žádný další node
   - Respond to Webhook MUSÍ být absolutně poslední

3. **Respond to Webhook není připojený k SEO Director Agent**
   - Zkontrolujte, že je šipka mezi SEO Director Agent → Respond to Webhook
   - Pokud není, přetáhněte ji

4. **Workflow není aktivní**
   - Zkontrolujte toggle vpravo nahoře (musí být zelený)
   - Pokud je šedý, klikněte na něj

### Problém: `output` je undefined nebo null

**Řešení:**

1. Klikněte na **Respond to Webhook** node
2. V levé části (INPUT) zkontrolujte, jaká data přicházejí z SEO Director Agent
3. Najděte správné pole s textem (může to být `text`, `result`, `response`)
4. Upravte Response Body:
   ```json
   {
     "output": "={{ $json.SPRAVNE_POLE }}"
   }
   ```

### Problém: "Cannot read property 'output' of undefined"

**Řešení:**

Ujistěte se, že SEO Director Agent vrací data. Přidejte před Respond to Webhook node **Code node** pro debug:

```javascript
console.log('Data from Agent:', JSON.stringify($input.item.json, null, 2));
return $input.item.json;
```

Pak zkontrolujte execution log v n8n.

## Alternativní konfigurace (pokud máte více nodes)

Pokud máte mezi SEO Director Agent a Respond to Webhook další nodes, použijte referenční syntax:

```json
{
  "output": "={{ $('SEO Director Agent').item.json.output }}"
}
```

## Vizuální kontrola

Váš workflow by měl vypadat:

```
┌────────────────────┐
│  When chat         │
│  message received  │
│  (Chat Trigger)    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  SEO Director      │
│  Agent             │
│                    │
│  → output: "..."   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Respond to        │  ← TOHLE MUSÍ BÝT POSLEDNÍ
│  Webhook           │
│                    │
│  Body:             │
│  {"output":"..."}  │
└────────────────────┘
```

## Potvrzení úspěchu

Po úpravě byste měli vidět v terminálu:

```bash
$ node test-webhook.js

N8N Chat Trigger Webhook Test
URL: https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat

============================================================
Test: QUICK MODE
============================================================
Status: 200 OK
Duration: 2500ms

✅ SUCCESS Response:
{
  "output": "# SEO Analýza pro example.cz\n\n## Úvod\n..."
}

============================================================
TEST SUMMARY
============================================================
Quick mode: ✅ PASSED
Full mode:  ✅ PASSED

Overall: ✅ ALL TESTS PASSED
```

## Co když nemůžu použít Respond to Webhook?

Pokud z nějakého důvodu **MUSÍTE** použít Respond to Chat (např. kvůli jiným integracím), pak:

1. Přečtěte si `N8N_API_POLLING_SOLUTION.md` (vytvoříme jej)
2. Aplikace bude muset pollovat n8n API pro výsledky
3. Bude to vyžadovat n8n API key

Ale **doporučuji primárně použít Respond to Webhook** - je to nejčistší a nejrychlejší řešení.

---

Vytvořeno: 2026-01-11
