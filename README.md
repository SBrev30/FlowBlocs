# FlowBlocs

Transform your structured Notion databases into visual canvases for intuitive brainstorming and spatial organization.

## Features

- **Notion Integration**: Connect your Notion workspace and access your databases
- **Infinite Canvas**: Drag and drop pages onto a spatial canvas for visual organization
- **Interactive Nodes**: Expand nodes to see content, open pages in Notion
- **Theme Support**: Light and dark mode support
- **State Persistence**: Your canvas layout is automatically saved
- **Responsive**: Pan, zoom, and navigate large canvases easily

## Setup Instructions

### 1. Notion Integration Setup

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "FlowBlocs"
4. Select "Internal" for development (or "Public" for distribution)
5. Enable these capabilities:
   - Read content
   - Update content
   - Insert content
   - Read user information
6. Save the integration and copy your **Client ID** and **Client Secret**

### 2. Backend Setup (Required for OAuth)

You need a backend server to handle the OAuth token exchange securely. Here's a simple Node.js/Express example:

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/notion/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Deploy this backend to a service like:
- Vercel
- Railway
- Heroku
- Any Node.js hosting service

### 3. Extension Configuration

1. Clone this repository
2. Copy `.env.example` to `.env`
3. Fill in your environment variables:

```env
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_NOTION_REDIRECT_URI=chrome-extension://YOUR_EXTENSION_ID/index.html
VITE_BACKEND_TOKEN_ENDPOINT=https://your-backend.com/api/notion/token
```

**Note**: You'll need to get the extension ID after loading it in Chrome (see step 5).

### 4. Install Dependencies

```bash
npm install
```

### 5. Build the Extension

```bash
npm run build
```

This creates a `dist` folder with your extension files.

### 6. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. Copy the Extension ID shown on the extension card
6. Update your `.env` file with the correct Extension ID in `VITE_NOTION_REDIRECT_URI`
7. Rebuild the extension: `npm run build`
8. Click the reload icon on the extension card

### 7. Update Notion Integration

1. Go back to your Notion integration settings
2. Under "Redirect URIs", add:
   ```
   chrome-extension://YOUR_EXTENSION_ID/index.html
   ```
3. Save the integration

### 8. Share Databases

For the extension to access your Notion databases:

1. Open a database in Notion
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select "Notion Infinite Canvas"
5. Click "Confirm"

Repeat for each database you want to visualize on the canvas.

## Usage

1. Open a new tab in Chrome (the extension overrides the new tab page)
2. Click "Sign in with Notion"
3. Authorize the extension
4. Select a database from the sidebar
5. Drag pages onto the canvas
6. Arrange pages spatially
7. Expand nodes to see more content
8. Click the external link icon to open pages in Notion

## Keyboard Shortcuts

- **Mouse wheel**: Zoom in/out
- **Click + drag**: Pan the canvas
- **Shift + click**: Multi-select nodes
- **Delete**: Remove selected nodes

## Development

```bash
npm run dev
```

For development, you can test in a regular browser window before building as a Chrome extension.

## Project Structure

```
src/
├── lib/
│   ├── auth.ts              # Notion OAuth authentication
│   ├── storage.ts           # Chrome storage wrapper
│   └── notion-api.ts        # Notion API client
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.tsx      # Database and page list
│   │   ├── AuthSection.tsx  # Authentication UI
│   │   └── Sidebar.css
│   └── Canvas/
│       ├── CanvasContainer.tsx  # ReactFlow canvas
│       ├── NotionNode.tsx       # Custom node component
│       └── Canvas.css
├── styles/
│   └── variables.css        # CSS custom properties (themes)
├── App.tsx
└── main.tsx
```

## Troubleshooting

### Authentication not working
- Verify your backend endpoint is accessible
- Check that your Notion Client ID and Secret are correct
- Ensure the redirect URI matches exactly in both .env and Notion settings

### Databases not appearing
- Make sure you've shared the database with your integration
- Check browser console for API errors
- Verify your access token is being stored correctly

### Canvas not saving
- Check browser console for storage errors
- Ensure Chrome storage permissions are enabled in manifest.json

## Future Enhancements

- Real-time content editing within nodes
- Collaborative canvas sharing
- Advanced layout algorithms
- Export canvas as image or PDF
- Connection lines between related pages
- Search and filter within canvas

## License

MIT

## Contributing

Contributions welcome! Please read the PRD and checklist in the repository for development guidelines.
