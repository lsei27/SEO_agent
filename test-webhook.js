#!/usr/bin/env node

/**
 * Test skript pro n8n Chat Trigger webhook
 * Použití: node test-webhook.js
 */

const WEBHOOK_URL = 'https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat'

const testPayloads = {
  quick: {
    sessionId: 'test-quick-' + Date.now(),
    message: 'Co je SEO a proč je důležité pro můj web?',
    mode: 'quick',
    context: {
      domain: 'example.cz',
      market: 'e-commerce',
      goals: ['increase organic traffic', 'improve rankings'],
      notes: 'Czech market, focus on mobile users',
    },
  },
  full: {
    sessionId: 'test-full-' + Date.now(),
    message: 'Proveď kompletní SEO audit a navrhni strategii pro můj e-shop',
    mode: 'full',
    context: {
      domain: 'eshop-elektronika.cz',
      market: 'electronics e-commerce',
      goals: ['increase sales', 'improve brand visibility', 'target Czech market'],
      notes: 'Main competitors: Alza.cz, CZC.cz. Target audience: 25-45 years old',
    },
  },
}

async function testWebhook(name, payload) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Test: ${name.toUpperCase()} MODE`)
  console.log('='.repeat(60))
  console.log(`Session ID: ${payload.sessionId}`)
  console.log(`Message: "${payload.message}"`)
  console.log(`Domain: ${payload.context.domain}`)
  console.log('Sending request...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const duration = Date.now() - startTime

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Duration: ${duration}ms`)
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ERROR Response:')
      console.error(errorText)
      return false
    }

    const data = await response.json()
    console.log('✅ SUCCESS Response:')
    console.log(JSON.stringify(data, null, 2))

    // Validate response format
    if (!data.output && !data.reply && !data.message && !data.text && !data.response) {
      console.warn('\n⚠️  WARNING: Response does not contain expected fields (output, reply, message, text, or response)')
      console.warn('Response keys:', Object.keys(data))
    }

    return true
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`Duration: ${duration}ms`)
    console.error('❌ FETCH ERROR:')
    console.error(error.message)
    return false
  }
}

async function runTests() {
  console.log('N8N Chat Trigger Webhook Test')
  console.log('URL:', WEBHOOK_URL)
  console.log('Time:', new Date().toISOString())

  const results = {
    quick: await testWebhook('quick', testPayloads.quick),
    full: await testWebhook('full', testPayloads.full),
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Quick mode: ${results.quick ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Full mode:  ${results.full ? '✅ PASSED' : '❌ FAILED'}`)

  const allPassed = results.quick && results.full
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

  process.exit(allPassed ? 0 : 1)
}

// Run tests
runTests().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
