#!/usr/bin/env node

/**
 * Test aplikace s polling mechanismem
 * Volá /api/chat endpoint (ne přímo n8n webhook)
 */

const APP_URL = 'http://localhost:3000'
const BASIC_AUTH = Buffer.from('admin:demo123').toString('base64')

const testPayload = {
  sessionId: 'test-polling-' + Date.now(),
  message: 'Co je SEO a proč je důležité?',
  mode: 'quick',
  context: {
    domain: 'example.cz',
    market: 'e-commerce',
    goals: ['increase organic traffic', 'improve rankings'],
    notes: 'Czech market test',
  },
}

async function testPolling() {
  console.log('Testing Application with Polling Mechanism')
  console.log('===========================================')
  console.log(`App URL: ${APP_URL}/api/chat`)
  console.log(`Session ID: ${testPayload.sessionId}`)
  console.log(`Message: "${testPayload.message}"`)
  console.log(`Mode: ${testPayload.mode}`)
  console.log('\nSending request...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${APP_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${BASIC_AUTH}`,
      },
      body: JSON.stringify(testPayload),
    })

    const duration = Date.now() - startTime

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Total Duration: ${duration}ms (včetně pollingu)`)
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

    // Validate response
    if (!data.reply) {
      console.warn('\n⚠️  WARNING: Response does not contain "reply" field')
      console.warn('Response keys:', Object.keys(data))
      return false
    }

    console.log('\n' + '='.repeat(60))
    console.log('POLLING TEST SUCCESSFUL!')
    console.log('='.repeat(60))
    console.log(`\nResponse preview:\n${data.reply.substring(0, 200)}...\n`)

    return true
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`Duration: ${duration}ms`)
    console.error('❌ FETCH ERROR:')
    console.error(error.message)
    return false
  }
}

// Run test
testPolling()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
