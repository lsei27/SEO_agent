# SEO Specialist Chat

Internal web tool for SEO analysis and strategy powered by AI through n8n automation.

## Features

- **Dark Minimal UI**: Professional, clean interface optimized for internal use
- **Real-time Chat**: Interactive conversation with SEO specialist AI
- **Context Management**: Define domain, market, goals, and notes for targeted analysis
- **Analysis Modes**: Quick insights or comprehensive deep-dive reports
- **Markdown Rendering**: Rich formatted responses with sanitized HTML
- **Secure Proxy**: n8n webhook never exposed to client
- **Basic Auth**: Password-protected access
- **Rate Limiting**: Prevents abuse (30 requests per 10 minutes)
- **Mock Mode**: Develop without n8n webhook configured
- **Session Persistence**: Conversation history saved in browser localStorage

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Markdown**: react-markdown + rehype-sanitize
- **Deployment**: Vercel-compatible

## Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn
- n8n webhook endpoint (optional for development)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd SEO_analyst_n8n
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
BASIC_AUTH_USER=your_username
BASIC_AUTH_PASS=your_secure_password
N8N_WEBHOOK_URL=https://n8n.couldbe.cz/webhook/696a9839-f036-40e8-877f-bfe013aaf93a/chat
N8N_WEBHOOK_TOKEN=your_token_if_required
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Basic Auth credentials.

### 4. Start Chatting

1. Fill in SEO context (domain, market, goals)
2. Choose analysis mode (quick or full)
3. Ask questions about SEO strategy, technical optimization, content planning, etc.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASIC_AUTH_USER` | Yes | Username for Basic Authentication |
| `BASIC_AUTH_PASS` | Yes | Password for Basic Authentication |
| `N8N_WEBHOOK_URL` | No* | n8n webhook endpoint URL |
| `N8N_WEBHOOK_TOKEN` | No | Bearer token for n8n webhook auth |

\* If `N8N_WEBHOOK_URL` is not set, the app runs in **mock mode** with simulated responses.

## Mock Mode

Mock mode allows frontend development without a live n8n webhook:

1. Leave `N8N_WEBHOOK_URL` unset in `.env`
2. API will return deterministic SEO-themed responses
3. Mock responses reference your input message and context

## API Contract

### Request: `POST /api/chat`

```json
{
  "sessionId": "string",
  "message": "string",
  "mode": "quick" | "full",
  "context": {
    "domain": "string",
    "market": "string",
    "goals": ["string"],
    "notes": "string"
  }
}
```

### Success Response: `200 OK`

```json
{
  "reply": "markdown string",
  "meta": {
    "requestId": "uuid",
    "durationMs": 1234
  }
}
```

### Error Response: `4xx/5xx`

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

## Rate Limiting

- **Limit**: 30 requests per 10 minutes per IP
- **Response**: HTTP 429 with retry information
- **Headers**:
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Security

- ✅ Basic Auth on all routes (except `/health`)
- ✅ n8n webhook URL server-side only
- ✅ Environment variables for all secrets
- ✅ Rate limiting to prevent abuse
- ✅ Markdown sanitization (XSS protection)
- ✅ Input validation with max lengths
- ✅ Request timeouts (120s)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub/GitLab/Bitbucket

2. Import project in Vercel dashboard

3. Configure environment variables:
   - `BASIC_AUTH_USER`
   - `BASIC_AUTH_PASS`
   - `N8N_WEBHOOK_URL`
   - `N8N_WEBHOOK_TOKEN` (if needed)

4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

Server runs on port 3000 by default.

## Project Structure

```
SEO_analyst_n8n/
├── app/
│   ├── api/chat/route.ts      # API proxy to n8n
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page
│   └── globals.css             # Global styles
├── components/
│   ├── Chat.tsx                # Chat interface
│   ├── MessageBubble.tsx       # Message rendering
│   └── ContextPanel.tsx        # SEO context form
├── lib/
│   ├── types.ts                # TypeScript definitions
│   ├── auth.ts                 # Basic Auth logic
│   ├── rateLimit.ts            # Rate limiting
│   ├── storage.ts              # localStorage helpers
│   └── validation.ts           # Request validation
├── middleware.ts               # Basic Auth middleware
├── .env.example                # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Development

### Code Quality

```bash
npm run lint        # ESLint
npm run format      # Prettier
```

### Type Checking

TypeScript strict mode enabled. Run build to check types:

```bash
npm run build
```

## n8n Webhook Integration

Your n8n workflow should:

1. Accept POST requests to the webhook endpoint
2. Receive JSON payload matching `ChatRequest` schema
3. Return JSON with at least one of these fields:
   - `output` (preferred)
   - `reply`
   - Or any single string field

Example n8n response:

```json
{
  "output": "# SEO Analysis\n\nBased on your domain...",
  "meta": {
    "processingTime": 5000
  }
}
```

The API will extract `output` or `reply` from the response. If neither exists, it will use the first string field found.

## Troubleshooting

### Basic Auth not working

- Ensure `.env` has `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`
- Restart dev server after changing `.env`
- Clear browser cache/cookies

### Mock responses instead of real analysis

- Check `N8N_WEBHOOK_URL` is set in `.env`
- Verify webhook URL is accessible
- Check server logs for fetch errors

### Rate limited

- Wait 10 minutes or adjust limits in `lib/rateLimit.ts`
- Rate limit is per IP address

### Conversation history lost

- localStorage is browser-specific
- Clearing browser data removes history
- Use same browser/device for continuity

## Support

For issues or questions:
- Check logs: `npm run dev` output
- Verify environment variables
- Test health endpoint: `/health`

## License

Internal tool - proprietary.
