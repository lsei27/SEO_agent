# ✅ Polling Mode - Dokumentace

## Co bylo provedeno

Aplikace byla přepsána na **polling mechanismus**, který umožňuje pracovat s asynchronními n8n workflow bez nutnosti měnit vaše stávající workflow.

## Jak to funguje

### Nová architektura:

```
1. Aplikace pošle request na n8n webhook
   ↓
2. n8n spustí workflow a vrátí: {"executionStarted": true, "executionId": "123"}
   ↓
3. Aplikace začne pollovat n8n REST API: GET /api/v1/executions/123
   ↓
4. Každé 2 sekundy kontroluje, zda je execution hotový
   ↓
5. Když je hotový (status: "success"), extrahuje výsledek
   ↓
6. Vrátí výsledek do frontendu
```

### Výhody:

✅ **Žádné změny v n8n workflow** - vaše workflow zůstává stejné
✅ **Funguje s Respond to Chat** - podporuje embedded chat protokol
✅ **Spolehlivé** - čeká na skutečné dokončení execution
✅ **Error handling** - detekuje selhání workflow
✅ **Timeout protection** - max 120 sekund, max 60 pokusů

## Konfigurace

### Environment Variables

V `.env` jsou nyní tyto nové proměnné:

```bash
# n8n API Configuration (Required for polling)
N8N_API_URL=https://n8n.couldbe.cz/api/v1
N8N_API_KEY=your_api_key_here
```

**N8N_API_URL** - URL vašeho n8n API
**N8N_API_KEY** - API klíč pro autentizaci (již nakonfigurováno)

### Získání API klíče

1. V n8n jděte do: **Settings → API**
2. Vygenerujte nový API klíč
3. Zkopírujte do `.env`

## Nové soubory

### `lib/n8nApi.ts`

Obsahuje:
- `getExecution(executionId)` - Získá detail execution z n8n API
- `pollExecutionResult(executionId, options)` - Polluje execution až do dokončení
- `extractOutputFromExecution()` - Extrahuje výsledek z execution data
- `extractErrorFromExecution()` - Extrahuje chybovou zprávu

### Upravený `app/api/chat/route.ts`

- Nová funkce: `callN8NWebhookWithPolling()`
- Automaticky detekuje async execution
- Spustí polling pokud najde `executionId`
- Fallback na synchronní režim pokud chybí API credentials

## Polling Parameters

```typescript
{
  maxAttempts: 60,           // Max 60 pokusů (2 minuty při 2s intervalu)
  pollIntervalMs: 2000,      // Kontrola každé 2 sekundy
  timeoutMs: 120000          // Celkový timeout 120 sekund
}
```

Tyto parametry můžete upravit v `app/api/chat/route.ts` na řádku 204.

## Jak aplikace extrahuje výsledek

Aplikace hledá output v execution data v tomto pořadí:

1. **Poslední node** (`lastNodeExecuted`)
2. **Fallback**: Poslední node v seznamu
3. **Extrakce z node data**: Hledá pole v tomto pořadí:
   - `output`
   - `reply`
   - `message`
   - `text`
   - `response`
   - `result`

### Příklad execution data struktura:

```json
{
  "id": "481",
  "finished": true,
  "status": "success",
  "data": {
    "resultData": {
      "lastNodeExecuted": "Respond to Chat",
      "runData": {
        "Respond to Chat": [
          {
            "data": {
              "main": [
                [
                  {
                    "json": {
                      "output": "# SEO Analýza\n\nVaše odpověď..."
                    }
                  }
                ]
              ]
            }
          }
        ]
      }
    }
  }
}
```

## Testování

### 1. Test pomocí test skriptu

```bash
node test-webhook.js
```

**Očekávaný výstup s polling:**

```bash
[N8N REQUEST] Sending Embedded Chat format: {...}
[N8N RESPONSE] Webhook response: { hasExecutionId: true, executionStarted: true }
[N8N POLLING] Starting poll for execution 481
[N8N API] Fetching execution 481
[N8N POLLING] Attempt 1/60 - Status: running, Finished: false
[N8N API] Fetching execution 481
[N8N POLLING] Attempt 2/60 - Status: running, Finished: false
...
[N8N POLLING] Attempt 5/60 - Status: success, Finished: true
[EXTRACT] Extracting from node: Respond to Chat
[EXTRACT] Found output in field: output
[N8N POLLING] Success! Output length: 1234 characters
[N8N POLLING] Completed! Output length: 1234

✅ SUCCESS Response:
{
  "output": "# SEO Analýza pro example.cz..."
}
```

### 2. Test z aplikace

```bash
npm run dev
```

Otevřete `http://localhost:3000` a pošlete zprávu. Měli byste vidět:
- Loading spinner během pollingu
- Odpověď se zobrazí až po dokončení workflow

## Monitoring & Debugging

### Console logy

Aplikace loguje každý krok pollingu:

```
[N8N REQUEST] - Initial webhook call
[N8N RESPONSE] - Webhook response analysis
[N8N POLLING] - Poll start
[N8N API] - API fetch attempts
[N8N POLLING] - Status updates
[EXTRACT] - Output extraction
[N8N POLLING] - Completion
```

### Sledování v n8n

1. Otevřete n8n
2. Jděte na **Executions** tab
3. Najděte execution ID z logů
4. Zkontrolujte:
   - Status (running → success/error)
   - Output data
   - Execution time

## Error Handling

### Timeout

Pokud workflow trvá > 120 sekund:

```
Error: Polling timeout after 120000ms. Execution 481 may still be running.
```

**Řešení:**
- Zkontrolujte execution v n8n UI
- Workflow může stále běžet na pozadí
- Zvyšte timeout v `route.ts` pokud potřebujete více času

### Max Attempts Reached

Pokud polling provede 60 pokusů bez dokončení:

```
Error: Max polling attempts (60) reached for execution 481.
```

**Řešení:**
- Workflow je pravděpodobně zablokováno
- Zkontrolujte execution v n8n
- Zvyšte `maxAttempts` pokud potřebujete

### No Output Found

Pokud execution uspěje ale není output:

```
Error: Workflow execution succeeded but no output was found
```

**Řešení:**
1. Zkontrolujte, že váš workflow vrací data
2. Data musí být v některém z podporovaných polí: `output`, `reply`, `message`, `text`, `response`, `result`
3. Zkontrolujte execution data v n8n UI

### Execution Failed

Pokud workflow selže:

```
Error: Workflow execution failed
```

**Řešení:**
- Zkontrolujte error v n8n execution log
- Opravte problém ve workflow
- Zkuste znovu

## Performance

### Průměrná doba odpovědi:

- **Spuštění workflow**: ~200ms
- **Polling interval**: 2s
- **Typické workflow (5-10s)**: ~6-12s celková doba
- **Komplexní workflow (30s)**: ~30-35s celková doba

### Optimalizace:

Pro rychlejší response můžete:
1. Snížit `pollIntervalMs` na 1000ms (1s) - více API calls
2. Optimalizovat workflow v n8n
3. Použít rychlejší AI model (gpt-4o-mini místo gpt-4o)

## Troubleshooting

### ❌ "N8N_API_URL and N8N_API_KEY must be configured"

**Příčina:** Chybí environment variables

**Řešení:**
```bash
# Zkontrolujte .env
N8N_API_URL=https://n8n.couldbe.cz/api/v1
N8N_API_KEY=your_key_here

# Restartujte server
npm run dev
```

### ❌ "n8n API returned 401: Unauthorized"

**Příčina:** Neplatný nebo expirovaný API key

**Řešení:**
1. Vygenerujte nový API key v n8n
2. Aktualizujte `.env`
3. Restartujte server

### ❌ "n8n API returned 404"

**Příčina:** Execution ID neexistuje

**Řešení:**
- Zkontrolujte, že webhook vrátil správný execution ID
- Zkontrolujte N8N_API_URL (musí být bez trailing slash)

### ❌ Polling běží nekonečně

**Příčina:** Workflow je zablokované nebo čeká na input

**Řešení:**
1. Zkontrolujte execution v n8n UI
2. Podívejte se na status jednotlivých nodes
3. Zrušte execution pokud je zablokovaný
4. Opravte workflow

## Srovnání: Polling vs. Synchronní

| Vlastnost | Polling Mode ✅ | Synchronní Mode |
|-----------|----------------|-----------------|
| Změny v workflow | Žádné | Respond to Webhook required |
| Podporuje async execution | ✅ Ano | ❌ Ne |
| Response time | +2-4s (polling overhead) | Okamžitě |
| Spolehlivost | ✅ Vysoká | ⚠️ Timeout riziková |
| Complexity | Vyšší | Nižší |
| **Pro vaše workflow** | ✅ Ideální | ❌ Vyžaduje změny |

## Další kroky

Pokud vše funguje:
1. ✅ Testujte s reálnými dotazy
2. ✅ Moniturujte performance v produkci
3. ✅ Upravte polling parametry podle potřeby

Pokud narazíte na problémy:
1. Zkontrolujte logy v dev console
2. Zkontrolujte executions v n8n UI
3. Ověřte, že API key má správná oprávnění

---

Vytvořeno: 2026-01-11
Režim: Polling with n8n REST API
