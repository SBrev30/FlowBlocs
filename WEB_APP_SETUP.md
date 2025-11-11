# Web App Conversion - Setup Checklist

## ✅ What's Been Done

The following files have been converted from Chrome extension to web app:

- [x] `vite.config.ts` - Simplified build config
- [x] `src/lib/storage.ts` - Using localStorage instead of chrome.storage
- [x] `src/lib/auth.ts` - Standard OAuth redirect flow
- [x] `src/components/AuthCallback.tsx` - New OAuth callback handler
- [x] `src/App.tsx` - Updated to handle callback route
- [x] `package.json` - Removed Chrome-specific dependencies
- [x] `.env.example` - Updated with web app variables
- [x] `README.md` - Web app specific documentation

## 🔧 Local Setup Steps

### 1. Switch to Web App Branch
```bash
cd /path/to/FlowBlocs
git fetch origin
git checkout web-app
npm install
```

### 2. Create `.env` File
```bash
cp .env.example .env
```

### 3. Update `.env` with Your Values
```env
VITE_NOTION_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
VITE_BACKEND_TOKEN_ENDPOINT=https://qaccpssuhvsltnzhjxfl.supabase.co/functions/v1/notion-oauth
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 4. Update Notion Integration

Go to https://www.notion.so/my-integrations and:

1. Select your integration
2. Scroll to **OAuth Domain & URIs**
3. **ADD** (don't replace) this redirect URI:
   ```
   http://localhost:5173/auth/callback
   ```
4. Click **Save changes**

### 5. Update Supabase Edge Function CORS

Your Edge Function needs to allow the web app origin:

1. Go to Supabase Dashboard
2. Edge Functions → `notion-oauth`
3. Check the CORS settings allow: `http://localhost:5173`

**Or update your Edge Function code:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or 'http://localhost:5173'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Test Authentication

1. Open http://localhost:5173
2. Click "Sign in with Notion"
3. Authorize the integration
4. Should redirect back to `/auth/callback`
5. Should process and redirect to main app

## 🐛 Troubleshooting

### Issue: "Invalid redirect_uri" error from Notion

**Solution:**
- Double-check Notion integration has **exactly**: `http://localhost:5173/auth/callback`
- No trailing slash
- No typos
- Wait 1-2 minutes after saving (changes take time)

### Issue: CORS error when exchanging token

**Solution:**
- Check Supabase Edge Function allows `localhost:5173`
- Verify `VITE_BACKEND_TOKEN_ENDPOINT` in `.env` is correct
- Test Edge Function directly: `curl https://your-project.supabase.co/functions/v1/notion-oauth/health`

### Issue: Blank page after OAuth redirect

**Solution:**
- Open browser console (F12)
- Check for errors
- Verify `.env` variables are set
- Try clearing localStorage: `localStorage.clear()` in console

### Issue: "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Next Steps After Local Setup Works

### 1. Deploy to Vercel/Netlify

**Vercel (easiest):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard.

### 2. Update Notion Integration for Production

Add production redirect URI:
```
https://your-app.vercel.app/auth/callback
```

### 3. Update Supabase CORS for Production

Allow your production domain in Edge Function CORS.

### 4. Test Production OAuth Flow

1. Visit production URL
2. Complete OAuth flow
3. Verify token exchange works

## 📝 Key Differences from Chrome Extension

| Chrome Extension | Web App |
|-----------------|---------|
| `chrome.identity.launchWebAuthFlow()` | `window.location.href = authUrl` |
| `chrome.storage.sync` | `localStorage` |
| `.chromiumapp.org` redirect | Standard HTTPS redirect |
| New tab override | Normal web page |
| Extension ID in URL | Domain name in URL |

## ✨ Benefits of Web App

- ✅ Easier OAuth (standard flow)
- ✅ Faster development (no extension reload)
- ✅ Instant sharing (just send URL)
- ✅ Better debugging tools
- ✅ Simpler deployment
- ✅ Can still add Chrome extension later

## 📞 Need Help?

Check the GitHub Issues or create a new one with:
- What you're trying to do
- Error messages (console + network tab)
- Environment details (.env values redacted)
