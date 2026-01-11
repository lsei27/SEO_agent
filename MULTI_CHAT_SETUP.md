# Multi-Conversation Setup Guide

## ✅ Implementation Complete!

The multi-conversation system with Supabase has been implemented. Follow these steps to complete the setup.

---

## Step 1: Run SQL Script in Supabase

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/przgsnyksdrfzjwsioua/sql/new
   ```

2. Copy the entire contents of `supabase-schema.sql`

3. Paste into SQL Editor and click **Run**

4. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('conversations', 'messages');
   ```

   You should see:
   ```
   conversations
   messages
   ```

---

## Step 2: Get Supabase API Keys

1. Go to Supabase Project Settings:
   ```
   https://supabase.com/dashboard/project/przgsnyksdrfzjwsioua/settings/api
   ```

2. Copy these values:
   - **Project URL**: `https://przgsnyksdrfzjwsioua.supabase.co`
   - **anon/public key**: (long string starting with `eyJ...`)
   - **service_role key**: (long string starting with `eyJ...`)

---

## Step 3: Update .env File

Add these lines to your `.env` file (or create it from `.env.example`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://przgsnyksdrfzjwsioua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (paste your anon key here)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (paste your service role key here)
```

**Important:** Keep your service_role key secret! Never commit it to Git.

---

## Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Step 5: Test the Application

1. Open http://localhost:3000

2. Log in with Basic Auth credentials

3. You should see:
   - **Left sidebar**: Conversation list (empty initially)
   - **"+ New Chat" button**: Click to create first conversation
   - **Middle panel**: SEO Context (Domain, Market, Goals, etc.)
   - **Right panel**: Chat interface

4. Test workflow:
   - Click "+ New Chat"
   - Fill in SEO context (domain, market, goals)
   - Send a message
   - Create another chat
   - Switch between chats
   - Rename a chat (click ⋮ menu)
   - Delete a chat

---

## Features

### ✅ Multiple Conversations
- Create unlimited conversations
- Each conversation has its own:
  - Title (renameable)
  - SEO context (domain, market, goals, notes)
  - Analysis mode (quick/full)
  - Message history
  - n8n session (isolated memory)

### ✅ Conversation Management
- **Create**: "+ New Chat" button
- **Switch**: Click conversation in sidebar
- **Rename**: Click ⋮ menu → Rename
- **Delete**: Click ⋮ menu → Delete

### ✅ Persistent Storage
- All conversations saved in Supabase
- Access from any device (same Basic Auth user)
- Automatic sync across browser tabs

### ✅ n8n Integration
- Each conversation has unique `session_id`
- n8n Memory node isolates conversations
- Context (domain, market, goals) sent with each message

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution:** Ensure `.env` has all three Supabase variables set.

### Error: "Failed to load conversations"

**Possible causes:**
1. SQL script not run in Supabase
2. Wrong API keys in `.env`
3. RLS policies not created

**Solution:**
1. Re-run `supabase-schema.sql`
2. Verify API keys are correct
3. Check Supabase logs for errors

### Conversations not showing

**Solution:**
1. Check browser console for errors
2. Verify Basic Auth username matches
3. Check Supabase Table Editor:
   ```
   https://supabase.com/dashboard/project/przgsnyksdrfzjwsioua/editor
   ```

### Can't create new conversation

**Solution:**
1. Check browser console for errors
2. Verify `user_id` in RLS policies
3. Try creating directly in Supabase Table Editor

---

## Database Structure

### `conversations` table
- `id` - UUID primary key
- `user_id` - Basic Auth username
- `title` - Conversation name
- `session_id` - Unique ID for n8n memory
- `domain`, `market`, `goals`, `notes` - SEO context
- `mode` - 'quick' or 'full'
- `created_at`, `updated_at`, `last_message_at`
- `message_count` - Auto-updated by trigger

### `messages` table
- `id` - UUID primary key
- `conversation_id` - Foreign key to conversations
- `role` - 'user' or 'assistant'
- `content` - Message text
- `created_at` - Timestamp

---

## API Endpoints

### Conversations
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get conversation details
- `PATCH /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation

### Messages
- `GET /api/conversations/[id]/messages` - Get messages
- `POST /api/conversations/[id]/messages` - Add message

---

## Migration from localStorage

If you had conversations in localStorage before:

1. The old localStorage data is no longer used
2. Create new conversations in Supabase
3. Copy important messages manually if needed
4. Old data remains in browser localStorage (safe to clear)

---

## Next Steps

### Optional Enhancements

1. **Export conversations**
   - Add export to JSON/Markdown feature

2. **Search conversations**
   - Add search bar in sidebar

3. **Conversation tags**
   - Add tags/categories for organization

4. **Shared conversations**
   - Share conversations between users

5. **Conversation templates**
   - Pre-filled context for common use cases

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs
3. Verify SQL schema is correct
4. Check API keys are valid

---

**Setup complete! Enjoy your multi-conversation SEO chat! 🎉**
