# GitHub Deployment - SEO Agent

## ✅ Úspěšně nahráno na GitHub

**Repository:** https://github.com/lsei27/SEO_agent

**Branch:** main

**Commit:** Initial commit with polling integration

## Co je v repozitáři

### Hlavní aplikace
```
app/
├── api/chat/route.ts      # API endpoint s polling mechanismem
├── layout.tsx             # Root layout
├── page.tsx               # Hlavní stránka
└── globals.css            # Globální styly

components/
├── Chat.tsx               # Chat interface
├── MessageBubble.tsx      # Zobrazení zpráv
└── ContextPanel.tsx       # SEO kontext formulář

lib/
├── n8nApi.ts             # ⭐ Polling mechanismus pro n8n API
├── types.ts              # TypeScript definice
├── auth.ts               # Basic Auth
├── rateLimit.ts          # Rate limiting
├── storage.ts            # localStorage helpers
└── validation.ts         # Request validace
```

### Dokumentace
```
📚 Hlavní dokumentace:
├── README.md                      # Základní přehled a setup
├── POLLING_MODE_GUIDE.md          # ⭐ Kompletní průvodce polling režimem
├── N8N_WORKFLOW_DATA_ACCESS.md    # Přístup k datům v n8n workflow
├── FIX_RESPOND_NODE.md            # Řešení "Wait for User Reply" problému

📚 Reference dokumentace:
├── N8N_CHAT_TRIGGER_GUIDE.md      # Chat Trigger vs Webhook
├── N8N_WEBHOOK_WORKFLOW_EXAMPLE.md # Příklady workflow
├── QUICK_START_CHAT_TRIGGER.md    # Rychlý start
├── FINAL_RECOMMENDATION.md        # Srovnání přístupů
├── N8N_SETUP.md                   # Původní setup návod
└── QUICK_FIX.md                   # Rychlé opravy
```

### Testovací skripty
```
test-app-polling.js    # ⭐ Test aplikace s polling (doporučeno)
test-webhook.js        # Test přímo n8n webhook
test-webhook.sh        # Bash test s curl
test-payload.json      # Ukázkový payload
```

## Rychlý start

### 1. Clone repozitář

```bash
git clone git@github.com:lsei27/SEO_agent.git
cd SEO_agent
```

### 2. Instalace dependencies

```bash
npm install
```

### 3. Konfigurace

Zkopírujte `.env.example` na `.env`:

```bash
cp .env.example .env
```

Upravte `.env`:

```bash
# Basic Auth
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=your_password

# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat

# n8n API (pro polling)
N8N_API_URL=https://n8n.couldbe.cz/api/v1
N8N_API_KEY=your_api_key_here
```

### 4. Spuštění

```bash
npm run dev
```

Otevřete: http://localhost:3000

## Klíčové funkce

### ⭐ Polling mechanismus

Aplikace podporuje **asynchronní n8n workflow** pomocí polling mechanismu:

1. Pošle request na n8n webhook
2. Dostane `executionId`
3. Polluje n8n REST API každé 2 sekundy
4. Extrahuje výsledek po dokončení

**Výhody:**
- ✅ Žádné změny v n8n workflow
- ✅ Funguje s existující konfigurací
- ✅ Spolehlivé čekání na výsledky

### Embedded Chat protokol

Aplikace posílá správný formát pro n8n Chat Trigger:

```json
{
  "action": "sendMessage",
  "chatInput": "Uživatelova zpráva",
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

### Rate Limiting

- 30 requestů per 10 minut per IP
- Chrání před abuse

### Session Management

- Historie konverzací v localStorage
- Zachování kontextu mezi zprávami

## Testování

### Test s polling (doporučeno)

```bash
node test-app-polling.js
```

Očekávaný výstup:
```
[N8N POLLING] Starting poll for execution 485
[N8N POLLING] Attempt 1/60 - Status: running
...
[N8N POLLING] Success! Output length: 1234
✅ SUCCESS Response
```

### Test přímo webhook

```bash
node test-webhook.js
```

## Známé problémy a řešení

### ❌ Execution ve stavu "waiting"

**Příčina:** "Respond to Chat" node má zapnutý "Wait for User Reply"

**Řešení:** Viz `FIX_RESPOND_NODE.md`

### ❌ Polling timeout

**Příčina:** Workflow trvá > 120 sekund

**Řešení:**
- Optimalizujte workflow
- Zvyšte timeout v `app/api/chat/route.ts`

### ❌ No output found

**Příčina:** Workflow nevrací data ve správném formátu

**Řešení:**
- Zkontrolujte execution data v n8n UI
- Ujistěte se, že workflow vrací pole: `output`, `reply`, `message`, `text`, nebo `response`

## Deployment

### Vercel (doporučeno)

1. Push na GitHub (již hotovo ✅)
2. Import projektu ve Vercel
3. Nastavte environment variables:
   - `BASIC_AUTH_USER`
   - `BASIC_AUTH_PASS`
   - `N8N_WEBHOOK_URL`
   - `N8N_API_URL`
   - `N8N_API_KEY`
4. Deploy

### Docker (alternativa)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Struktura branchů

```
main          # Produkční verze s polling
```

## Kontribuční workflow

```bash
# Vytvoření feature branch
git checkout -b feature/your-feature

# Commitnutí změn
git add .
git commit -m "feat: your feature description"

# Push feature branch
git push origin feature/your-feature

# Vytvoření Pull Request na GitHubu
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASIC_AUTH_USER` | Ano | Username pro Basic Auth |
| `BASIC_AUTH_PASS` | Ano | Password pro Basic Auth |
| `N8N_WEBHOOK_URL` | Ano | n8n webhook endpoint |
| `N8N_API_URL` | Ano | n8n REST API URL |
| `N8N_API_KEY` | Ano | n8n API klíč |
| `N8N_WEBHOOK_TOKEN` | Ne | Bearer token (pokud potřebný) |

## Co dělat dál?

1. ✅ **Otestujte lokálně:** `npm run dev`
2. ✅ **Opravte n8n workflow:** Vypněte "Wait for User Reply"
3. ✅ **Testujte polling:** `node test-app-polling.js`
4. ✅ **Deploy na Vercel:** Pro produkční použití

## Technologie

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Markdown:** react-markdown + rehype-sanitize
- **n8n Integration:** REST API + Webhook
- **Auth:** Basic Authentication
- **Rate Limiting:** In-memory store

## Support

Pro problémy nebo otázky:
- Zkontrolujte dokumentaci v `/docs`
- Podívejte se na execution logy v n8n UI
- Zkontrolujte dev console logy

---

**Repository:** https://github.com/lsei27/SEO_agent
**Created:** 2026-01-11
**Mode:** Polling with n8n REST API
