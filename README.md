# FlowBlocs

**Transform your Notion databases into interactive visual canvases**

FlowBlocs bridges the gap between Notion's structured data and visual thinking by creating infinite canvas workspaces where you can spatially organize database items as interactive nodes.

## ✨ Features

### 🎯 Core Functionality
- **Notion Integration** - Secure OAuth authentication with your Notion workspace
- **Database Visualization** - Browse and visualize any shared Notion database
- **Drag & Drop Interface** - Drag database items from sidebar onto infinite canvas
- **Rich Property Display** - View formatted text, dates, people, and custom properties
- **Infinite Canvas** - Pan, zoom, and arrange content spatially with ReactFlow
- **Responsive Design** - Clean interface that works across devices

### 🛠️ Technical Features
- **TypeScript** - Full type safety throughout the application
- **Modern React** - Built with React 18 and modern patterns
- **Supabase Backend** - Serverless OAuth handling via Edge Functions
- **Tailwind Styling** - Consistent, theme-aware design system
- **State Management** - Zustand for efficient client state

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Notion workspace
- Supabase project (for OAuth)

### 1. Clone & Install
```bash
git clone https://github.com/SBrev30/FlowBlocs.git
cd FlowBlocs
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Configure your `.env`:
```env
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_BACKEND_TOKEN_ENDPOINT=https://your-project.supabase.co/functions/v1/notion-oauth
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Start Development
```bash
npm run dev
```

Open http://localhost:5173

## 🔧 Setup Guide

### Notion Integration

1. **Create Integration** at https://www.notion.so/my-integrations
2. **Configure settings:**
   - Name: FlowBlocs
   - Type: Internal (development) / Public (production)
   - Capabilities: Read content, Update content, Insert content, Read user info

3. **Add OAuth Redirect:**
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

### Database Sharing

For databases to appear in FlowBlocs:
1. Open database in Notion
2. Click **"•••"** → **"Add connections"**
3. Select your FlowBlocs integration

### Supabase Edge Function

Deploy the OAuth handler:
```sql
-- Required environment variables in Supabase
NOTION_CLIENT_ID=your_client_id
NOTION_CLIENT_SECRET=your_client_secret
```

## 📦 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + CSS Variables
- **Canvas:** ReactFlow for infinite canvas
- **State:** Zustand for state management
- **Backend:** Supabase Edge Functions
- **Authentication:** Notion OAuth 2.0
- **Icons:** Lucide React + React Icons

## 🎨 Architecture

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│      Sidebar        │    Canvas Area      │
│                     │                     │
│ • Auth Panel        │ • ReactFlow Canvas  │
│ • Database List     │ • Draggable Nodes   │
│ • Property Display  │ • Pan/Zoom Controls │
│ • Search/Filter     │ • Infinite Space    │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

**Data Flow:**
1. User authenticates → Supabase Edge Function handles OAuth
2. Fetch databases → Notion API via authenticated requests
3. Display in sidebar → Expandable lists with properties
4. Drag to canvas → Creates interactive nodes with content
5. Canvas state → Auto-saved to localStorage

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Netlify
```bash
npm run build
# Deploy dist/ folder
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 🧪 Development

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run typecheck   # TypeScript type checking
```

### Project Structure
```
src/
├── components/          # React components
│   ├── Canvas/         # Canvas and node components
│   ├── Sidebar/        # Sidebar and auth components
│   └── PropertyDisplay.tsx
├── lib/                # Utilities and API
├── store/              # Zustand state management
├── styles/             # CSS and theme files
└── App.tsx             # Main application
```

## 🐛 Troubleshooting

**"Invalid redirect URI"**
- Verify redirect URI in Notion integration matches your environment
- Ensure protocol (http/https) matches

**"No databases found"**
- Share at least one database with your integration
- Check integration capabilities are enabled
- Refresh the database list

**CORS errors**
- Update Supabase Edge Function to allow your domain
- Verify `VITE_BACKEND_TOKEN_ENDPOINT` URL is correct

## 🔮 Roadmap

- [ ] **Inline Editing** - Edit content directly on canvas nodes
- [ ] **Sync to Notion** - Save changes back to Notion databases
- [ ] **Node States** - Expandable/collapsible views
- [ ] **Connections** - Visual links between related items
- [ ] **Layouts** - Auto-arrange with different algorithms
- [ ] **Collaboration** - Real-time multi-user editing
- [ ] **Export** - Save canvas as image or Notion page

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with [ReactFlow](https://reactflow.dev) for canvas functionality
- Powered by [Notion API](https://developers.notion.com) for data access
- Hosted on [Supabase](https://supabase.io) for serverless backend

---

**Transform your structured data into spatial thinking** 🧠✨
