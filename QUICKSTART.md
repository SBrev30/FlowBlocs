# Quick Start Guide

Get the Notion Infinite Canvas extension up and running in 15 minutes.

## Prerequisites

- Node.js 16+ installed
- A Notion account
- Chrome browser

## Fast Track Setup

### 1. Install Dependencies (2 minutes)

```bash
npm install
```

### 2. Set Up Backend (5 minutes)

**Option A: Deploy to Vercel (Fastest)**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Create `api/notion/token.js` in your project:
```javascript
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, redirect_uri } = req.body;

  try {
    const response = await axios.post(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri,
      },
      {
        auth: {
          username: process.env.NOTION_CLIENT_ID,
          password: process.env.NOTION_CLIENT_SECRET,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
};
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard (save these URLs):
   - Your backend URL will be: `https://your-project.vercel.app`
   - Token endpoint: `https://your-project.vercel.app/api/notion/token`

### 3. Create Notion Integration (3 minutes)

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Fill in:
   - Name: "Notion Infinite Canvas"
   - Type: Internal
   - Enable all capabilities
4. Click Submit
5. **Copy Client ID and Client Secret**
6. Add to Vercel environment variables:
   - `NOTION_CLIENT_ID` = your Client ID
   - `NOTION_CLIENT_SECRET` = your Client Secret

### 4. Configure Extension (2 minutes)

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env`:
```env
VITE_NOTION_CLIENT_ID=paste_your_client_id
VITE_NOTION_REDIRECT_URI=chrome-extension://TEMP/index.html
VITE_BACKEND_TOKEN_ENDPOINT=https://your-project.vercel.app/api/notion/token
```

3. Build:
```bash
npm run build
```

### 5. Load Extension (2 minutes)

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
5. **Copy the Extension ID**

### 6. Update Configuration (1 minute)

1. Update `.env` with real Extension ID:
```env
VITE_NOTION_REDIRECT_URI=chrome-extension://YOUR_EXTENSION_ID/index.html
```

2. Rebuild:
```bash
npm run build
```

3. Reload extension in Chrome

4. Update Notion integration redirect URI:
   - Go to https://www.notion.so/my-integrations
   - Add redirect URI: `chrome-extension://YOUR_EXTENSION_ID/index.html`

### 7. Share a Database (1 minute)

1. Open any database in Notion
2. Click "..." → "Add connections"
3. Select "Notion Infinite Canvas"
4. Click Confirm

### 8. Test! 🎉

1. Open a new tab in Chrome
2. Click "Sign in with Notion"
3. Authorize the extension
4. Drag pages onto the canvas!

## Troubleshooting

### Backend Issues
Test your backend:
```bash
curl -X POST https://your-project.vercel.app/api/notion/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test","redirect_uri":"test"}'
```

Expected: Either a token response or an authentication error (not a 404 or 500).

### Extension ID Changed
If you reload the unpacked extension, the ID might change. Repeat steps 6 and 7.

### No Databases Appearing
Make sure you've shared at least one database with the integration (Step 7).

## What's Next?

- Arrange pages on your canvas
- Expand nodes to see content
- Use zoom/pan controls
- Toggle dark mode
- Check `DEVELOPMENT_STATUS.md` for upcoming features

## Development Mode

To develop with hot reload:

```bash
npm run dev
```

This runs in a regular browser window (not as an extension) - useful for UI development.

## Need Help?

1. Check the full [SETUP.md](./SETUP.md) guide
2. Review [README.md](./README.md) for features
3. See [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) for current status
4. Check browser console for errors (F12)
