# ArchPortfolio Generator

AI-powered architecture portfolio generator. Upload renders, plans, sections, and diagrams. Get stunning portfolios in seconds with 50+ layouts and 7 design systems.

## 🎯 Features

- ✅ **User Accounts** - Register, login, save portfolios
- ✅ **Asset Organization** - Separate uploads for renders, plans, sections, diagrams
- ✅ **AI Layout Recommendation** - Smart layout selection based on assets
- ✅ **50+ Professional Layouts** - From hero renders to technical plans
- ✅ **7 Design Systems** - Minimal, Dark, Scandinavian, Journal, Competition, Parametric, Corporate
- 🔄 **Portfolio Generation** - Generate 5-10 variants with different structures
- 📄 **PDF Export** - High-quality PDF downloads
- 🌐 **Web Export** - Shareable portfolio links
- 📱 **Social Export** - Instagram carousels, competition boards
- 🤖 **AI Enhancement** - Coming soon: Llama 2 powered generation

## 🏗️ Architecture

```
ArchPortfolio_Generator/
├── backend/                 # FastAPI Python backend
│   ├── main.py             # App entry point
│   ├── config.py           # Configuration
│   ├── database.py         # Supabase setup
│   ├── models.py           # Data schemas
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   └── requirements.txt    # Dependencies
│
└── frontend/               # Next.js React frontend
    ├── src/
    │   ├── app/           # Next.js app routes
    │   ├── lib/           # Utilities (API client)
    │   ├── store/         # Zustand state management
    │   └── components/    # UI components (coming)
    ├── package.json
    └── tailwind.config.ts
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account (free)
- Replicate account (free, optional)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure Supabase
cp .env.example .env
# Edit .env with your Supabase credentials

# Run SQL schema in Supabase dashboard
# (See database.py for schema)

# Start server
python main.py
```

Server: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API URL and Supabase keys

# Start dev server
npm run dev
```

App: http://localhost:3000

## 📋 API Overview

### Authentication
```
POST   /api/auth/signup       - Register user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user
POST   /api/auth/logout       - Logout
```

### Projects
```
GET    /api/projects          - List projects
POST   /api/projects          - Create project
GET    /api/projects/{id}     - Get project
PUT    /api/projects/{id}     - Update project
DELETE /api/projects/{id}     - Delete project
```

### Assets
```
POST   /api/assets/{id}/upload           - Upload files
GET    /api/assets/{id}/list             - List by type
DELETE /api/assets/{id}/assets/{aid}     - Delete asset
GET    /api/assets/{id}/analysis         - Analyze assets
```

### Layouts
```
GET    /api/layouts                      - List all layouts
GET    /api/layouts/{id}                 - Get layout
POST   /api/layouts/recommend            - Get recommendation
```

### Portfolios
```
POST   /api/portfolios/{id}/generate     - Generate portfolio
GET    /api/portfolios/{id}/list         - List portfolios
GET    /api/portfolios/{id}              - Get portfolio
DELETE /api/portfolios/{id}              - Delete portfolio
GET    /api/portfolios/{id}/preview      - Get HTML preview
```

## 🎨 Layout Types

Currently defined 7+ layouts:

1. **Hero Render** - Full-page hero image
2. **Split Render & Text** - 50/50 layout
3. **3 Render Grid** - Grid of 3 images
4. **Plan + Section + Render** - Technical focus
5. **Diagram Heavy** - Multiple diagrams
6. **Competition Board** - Poster style
7. **Timeline** - Project evolution

## 🎭 Design Systems

7 professional style packs:

1. **Minimal White** - Clean, academic
2. **Dark Studio** - Bold, modern
3. **Scandinavian** - Light wood, Nordic
4. **Architectural Journal** - Editorial, magazine
5. **Competition Board** - Poster, high contrast
6. **Parametric** - Geometric, monospace
7. **Corporate** - Professional, minimal

## 📊 Tech Stack

### Backend
- FastAPI (Python web framework)
- Supabase (PostgreSQL + Auth)
- SQLAlchemy (ORM)
- Pillow + OpenCV (image processing)
- ReportLab + WeasyPrint (PDF generation)
- Replicate API (Llama 2 integration)

### Frontend
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Zustand (state management)
- TanStack Query (data fetching)
- Axios (HTTP client)

### Database
- Supabase PostgreSQL (free tier: 500MB)
- Firebase Storage (1GB/month)

## 🔄 User Flow

1. **Sign Up** → Create account
2. **Create Project** → Name project, select type
3. **Upload Assets** → Add renders, plans, sections, diagrams
4. **Analyze** → System analyzes assets
5. **Recommend Layout** → AI suggests best layout
6. **Pick Style** → Choose design system
7. **Generate** → Create 5-10 variants
8. **Compare** → Side-by-side preview
9. **Customize** → Edit text, reorder (optional)
10. **Export** → PDF, web, social media

## 🆓 Free Tier Limits

- **Supabase**: 500MB storage, unlimited queries
- **Replicate**: Free tier available for Llama 2
- **Firebase**: 1GB/month download
- **Vercel**: 100GB/month bandwidth
- **HuggingFace Spaces**: Free GPU options

## 📦 Installation Steps

### 1. Supabase Setup
```bash
1. Go to supabase.com → Create project
2. Get URL and anon key
3. In SQL Editor, paste database.py schema
4. Create tables and indexes
```

### 2. Backend Deploy (HuggingFace Spaces)
```bash
1. Create Space on huggingface.co
2. Upload backend files
3. Set environment secrets
4. Deploy with Docker
```

### 3. Frontend Deploy (Vercel)
```bash
1. Push frontend to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
```

## 🎯 Next Features

- [ ] Replicate + Llama 2 integration for AI generation
- [ ] PDF export with custom fonts
- [ ] Web export with preview
- [ ] Social media export (Instagram, competition boards)
- [ ] Portfolio customization UI (edit text, reorder pages)
- [ ] Batch generation (5-10 variants at once)
- [ ] Portfolio sharing with edit links
- [ ] Templates for different project types
- [ ] Mobile app (Flutter)

## 🛠️ Development

### Run Both Servers

Terminal 1 (Backend):
```bash
cd backend && python main.py
```

Terminal 2 (Frontend):
```bash
cd frontend && npm run dev
```

### Database Migrations

```bash
cd backend
# Create migration
alembic revision --autogenerate -m "description"
# Apply migration
alembic upgrade head
```

### Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

## 📝 Common Issues

### CORS Errors
- Make sure backend is running on 8000
- Frontend env has correct API URL

### Supabase Connection
- Check SUPABASE_URL and SUPABASE_KEY
- Verify tables exist in dashboard

### File Uploads
- Check upload directory permissions
- Verify Firebase/Cloudinary setup (if using)

## 📖 Documentation

- [Backend Setup](./backend/README.md)
- [API Reference](./backend/README.md#api-routes)
- [Database Schema](./backend/database.py)

## 🤝 Contributing

This is an open project. Contributions welcome:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - Free to use and modify

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Supabase Docs](https://supabase.com/docs)
- [Replicate Docs](https://replicate.com/docs)

## 🚀 Deployment

### Backend (HuggingFace Spaces)
1. Create new Space
2. Upload backend folder
3. Set environment variables
4. Select Docker runtime
5. Deploy

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Database (Supabase)
- Auto-deployed with project
- Free tier: 500MB storage
- No deployment needed

## 📞 Support

For issues or questions:
- Check existing issues
- Create new GitHub issue
- Check documentation

---

**Built with ❤️ for architects**
