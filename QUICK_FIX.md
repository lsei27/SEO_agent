# Návod: Oprava n8n Webhook pro Synchronní Režim

## Problém
n8n webhook je nakonfigurován pro asynchronní spuštění, ale aplikace potřebuje synchronní odpověď.

## Řešení v n8n

### Krok 1: Otevři Webhook Node
1. Otevři workflow v n8n: https://n8n.couldbe.cz/
2. Klikni na **Webhook node** (první node)

### Krok 2: Změň Response Mode
V nastavení Webhook node najdi pole **"Respond"**:

**Změň z:**
```
Respond: "Using 'Respond to Webhook' Node"
```

**Na:**
```
Respond: "When Last Node Finishes"
```

### Krok 3: Ujisti se o správném formátu odpovědi
Poslední node ve workflow musí vracet JSON s jedním z těchto polí:
- `output` (doporučeno)
- `reply`
- `message`
- `text`
- `response`

**Příklad správné odpovědi:**
```json
{
  "output": "# SEO Analýza\n\nVaše stránka má následující problémy..."
}
```

### Krok 4: Ulož workflow
Klikni na **Save** nebo stiskni **Ctrl+S**

## Vrať webhook do aplikace

Po opravě n8n odkomentuj v `.env`:

```bash
# n8n Webhook Integration
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat
```

A restartuj dev server:
```bash
# Zastaví aktuální server (Ctrl+C)
# Pak:
npm run dev
```

## Testování

1. Otevři http://localhost:3000
2. Vyplň SEO Context
3. Pošli testovací zprávu
4. Měla by přijít odpověď z n8n, ne mock data

## Poznámky

- **"When Last Node Finishes"** = čeká na dokončení celého workflow
- **"Immediately"** = vrátí odpověď hned (bez čekání)
- Pro SEO analýzu doporučujeme **"When Last Node Finishes"**
