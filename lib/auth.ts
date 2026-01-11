export function validateBasicAuth(authHeader: string | null): boolean {
  const expectedUser = process.env.BASIC_AUTH_USER
  const expectedPass = process.env.BASIC_AUTH_PASS

  if (!expectedUser || !expectedPass) {
    console.warn('Basic Auth credentials not configured')
    return false
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  try {
    const base64Credentials = authHeader.substring(6)
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [username, password] = credentials.split(':')

    return username === expectedUser && password === expectedPass
  } catch {
    return false
  }
}

export function createBasicAuthChallenge(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="SEO Specialist Chat", charset="UTF-8"',
      'Content-Type': 'text/plain',
    },
  })
}
