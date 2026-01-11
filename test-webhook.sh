#!/bin/bash

# Test skript pro n8n Chat Trigger webhook
# Použití: ./test-webhook.sh

WEBHOOK_URL="https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat"

echo "Testing n8n Chat Trigger webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Quick mode - základní SEO dotaz
echo "Test 1: Quick mode - základní SEO dotaz"
echo "========================================="
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-quick",
    "message": "Co je SEO a proč je důležité?",
    "mode": "quick",
    "context": {
      "domain": "test.cz",
      "market": "e-commerce",
      "goals": ["increase organic traffic", "improve rankings"],
      "notes": "Czech market, B2C"
    }
  }' | jq '.'

echo -e "\n\n"

# Test 2: Full mode - komplexní analýza
echo "Test 2: Full mode - komplexní analýza"
echo "======================================"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-full",
    "message": "Proveď kompletní SEO analýzu pro e-shop s elektronikou",
    "mode": "full",
    "context": {
      "domain": "elektro-shop.cz",
      "market": "electronics e-commerce",
      "goals": ["increase sales", "improve brand visibility", "target Czech market"],
      "notes": "Konkurence: Alza.cz, CZC.cz. Cílová skupina: 25-45 let, tech-savvy"
    }
  }' | jq '.'

echo -e "\n\n"

# Test 3: Session continuity - druhá zpráva ve stejné session
echo "Test 3: Session continuity"
echo "=========================="
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-quick",
    "message": "Jaké konkrétní kroky doporučuješ začít implementovat jako první?",
    "mode": "quick",
    "context": {
      "domain": "test.cz",
      "market": "e-commerce",
      "goals": ["increase organic traffic"],
      "notes": ""
    }
  }' | jq '.'

echo -e "\n\n"
echo "✓ Všechny testy dokončeny"
