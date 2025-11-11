# FlowBlocs - Web App

Transform your Notion databases into interactive visual canvases.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Notion account
- Supabase account (for OAuth backend)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/SBrev30/FlowBlocs.git
cd FlowBlocs
git checkout web-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_BACKEND_TOKEN_ENDPOINT=https://your-project.supabase.co/functions/v1/notion-oauth
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:5173
```

## 🔧 Notion Integration Setup

### 1. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Configure:
   - **Name**: FlowBlocs
   - **Type**: Internal (for development)
   - **Capabilities**: Read content, Update content, Insert content, Read user

4. Save your credentials:
   - **Client ID**: Copy to `.env`
   - **Client Secret**: Save securely (for Supabase)

### 2. Configure OAuth Redirect URI

In your Notion integration settings, add:

**Development:**
```
http://localhost:5173/auth/callback
```

**Production:**
```
https://flowblocs.yourdomain.com/auth/callback
```

### 3. Share Databases

For databases to appear in FlowBlocs:
1. Open database in Notion
2. Click **"•••"** → **"Connections"**
3. Add your FlowBlocs integration

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables in Netlify dashboard

## 🔐 Supabase Edge Function

Your Supabase Edge Function should be already set up at:
```
https://your-project.supabase.co/functions/v1/notion-oauth
```

Make sure:
- `NOTION_CLIENT_ID` is set in Supabase environment
- `NOTION_CLIENT_SECRET` is set in Supabase environment
- CORS allows your domain

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_NOTION_CLIENT_ID` | Notion OAuth Client ID | `a1b2c3d4-5678...` |
| `VITE_BACKEND_TOKEN_ENDPOINT` | Supabase Edge Function URL | `https://xxx.supabase.co/functions/v1/notion-oauth` |
| `VITE_REDIRECT_URI` | OAuth callback URL | `http://localhost:5173/auth/callback` |

## 🐛 Troubleshooting

### "Invalid redirect URI" error
- Verify redirect URI in Notion integration matches `.env`
- Check for trailing slashes
- Ensure protocol matches (http vs https)

### "No databases found"
- Share at least one database with your integration in Notion
- Click refresh in sidebar
- Check Notion integration has correct capabilities

### CORS errors
- Update Supabase Edge Function CORS to allow your domain
- Check `VITE_BACKEND_TOKEN_ENDPOINT` is correct

## 📚 Documentation

See `/docs` folder for detailed documentation:
- Architecture overview
- API documentation
- Development guide

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

## 📄 License

MIT License - see LICENSE file for details
