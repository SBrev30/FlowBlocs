# Setup Guide for Notion Infinite Canvas

This guide will walk you through setting up the Notion Infinite Canvas Chrome Extension from scratch.

## Prerequisites

- Node.js 16+ installed
- A Notion account
- A backend server or hosting service (Vercel, Railway, Heroku, etc.)

## Step 1: Notion Integration

1. Navigate to https://www.notion.so/my-integrations
2. Click "New integration"
3. Configure your integration:
   - **Name**: Notion Infinite Canvas
   - **Type**: Internal (for development) or Public (for distribution)
   - **Capabilities**: Check all boxes:
     - ☑ Read content
     - ☑ Update content
     - ☑ Insert content
     - ☑ Read user information
4. Click "Submit" to create the integration
5. **Save these values** (you'll need them later):
   - Client ID
   - Client Secret

## Step 2: Backend Server Setup

The extension requires a backend server to securely handle OAuth token exchange.

### Option A: Node.js/Express Backend

Create a new directory for your backend:

```bash
mkdir notion-canvas-backend
cd notion-canvas-backend
npm init -y
npm install express cors axios dotenv
```

Create `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

app.post('/api/notion/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

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
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to exchange token',
      details: error.response?.data || error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

Create `.env` file:

```env
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here
PORT=3000
```

### Option B: Deploy to Vercel

Create `api/notion/token.js`:

```javascript
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`

## Step 3: Extension Configuration

1. Clone/download this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

4. Edit `.env` with **temporary values** (we'll update after loading the extension):

```env
VITE_NOTION_CLIENT_ID=your_notion_client_id_from_step_1
VITE_NOTION_REDIRECT_URI=chrome-extension://TEMPORARY/index.html
VITE_BACKEND_TOKEN_ENDPOINT=https://your-backend.com/api/notion/token
```

5. Build the extension:

```bash
npm run build
```

## Step 4: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Navigate to and select the `dist` folder in this project
5. The extension will appear in your extensions list
6. **IMPORTANT**: Copy the **Extension ID** (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

## Step 5: Update Configuration with Extension ID

1. Update your `.env` file with the real Extension ID:

```env
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_NOTION_REDIRECT_URI=chrome-extension://YOUR_REAL_EXTENSION_ID/index.html
VITE_BACKEND_TOKEN_ENDPOINT=https://your-backend.com/api/notion/token
```

2. Rebuild the extension:

```bash
npm run build
```

3. Go back to `chrome://extensions/` and click the **reload icon** on your extension

## Step 6: Update Notion Integration Redirect URI

1. Go back to https://www.notion.so/my-integrations
2. Click on your "Notion Infinite Canvas" integration
3. Scroll to **Redirect URIs**
4. Click **Add redirect URI**
5. Enter: `chrome-extension://YOUR_REAL_EXTENSION_ID/index.html`
6. Click **Add URI**
7. Click **Submit** to save changes

## Step 7: Share Databases with Integration

The extension can only access databases that have been explicitly shared with it.

For each database you want to use:

1. Open the database in Notion
2. Click the **"..."** menu (three dots) in the top right
3. Scroll down and click **Add connections**
4. Search for "Notion Infinite Canvas"
5. Click on your integration
6. Click **Confirm**

The database will now be accessible to the extension.

## Step 8: Test the Extension

1. Open a new tab in Chrome (the extension overrides new tabs)
2. You should see the Notion Canvas interface
3. Click **Sign in with Notion**
4. Authorize the extension in the Notion OAuth page
5. You'll be redirected back to the extension
6. Your shared databases should appear in the sidebar

## Troubleshooting

### "Authentication failed" error
- Double-check your Client ID and Secret
- Verify backend endpoint is correct and accessible
- Check browser console for specific errors

### Databases not appearing
- Make sure you've shared databases with the integration (Step 7)
- Try refreshing the extension
- Check that authentication completed successfully

### OAuth redirect not working
- Verify the redirect URI in Notion matches exactly: `chrome-extension://YOUR_EXTENSION_ID/index.html`
- Make sure you rebuilt the extension after updating the .env file
- Check that the extension is loaded and the ID hasn't changed

### Backend errors
- Test your backend endpoint directly with curl:
  ```bash
  curl -X POST https://your-backend.com/api/notion/token \
    -H "Content-Type: application/json" \
    -d '{"code":"test","redirect_uri":"test"}'
  ```
- Check backend logs for errors
- Verify environment variables are set correctly

## Icon Setup (Optional)

The extension uses placeholder icon paths. To add real icons:

1. Create PNG icons in these sizes:
   - 16x16 pixels
   - 48x48 pixels
   - 128x128 pixels

2. Place them in the `public/icons/` directory:
   ```
   public/icons/
   ├── icon-16.png
   ├── icon-48.png
   └── icon-128.png
   ```

3. Rebuild the extension:
   ```bash
   npm run build
   ```

4. Reload the extension in Chrome

## Next Steps

Once everything is working:

1. Drag pages from the sidebar onto the canvas
2. Arrange them spatially
3. Expand nodes to see more content
4. Use zoom and pan controls to navigate
5. Toggle between light and dark themes

Your canvas state is automatically saved and will persist across browser restarts!

## Getting Help

If you encounter issues:

1. Check the browser console for errors (F12 → Console tab)
2. Review the setup steps carefully
3. Verify all environment variables are correct
4. Check that backend server is running and accessible

## Development Mode

To work on the extension with hot reload:

```bash
npm run dev
```

This runs the app in a regular browser window (not as an extension) which is useful for development.
