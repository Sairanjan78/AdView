# BlogSphere — Worldwide Multi-Niche Publishing Platform

BlogSphere is a production-grade, multi-niche blogging platform designed with a **Minimal Luxury** international editorial magazine aesthetic. It supports global readers and writers, editorial submission workflows with administrator approval, advertising and monetization infrastructure, and rich responsive typography.

---

## 🎨 Design Theme: Minimal Luxury

- **Warm Cream Background**: `#F4EFE5`
- **Charcoal Typography**: `#292720`
- **Muted Gold Accents**: `#B69B75`
- **Clean Surface Cards**: `#FFFFFF`
- **Subtle Borders**: `#E5DED1`
- **Editorial Typography Pairing**:
  - **Headings & Logo**: Playfair Display (600, 700) with fluid CSS `clamp()` scaling
  - **Body & UI**: Inter (400, 500, 600) with generous `1.75` line height for long-form reading
  - **Script Fallbacks**: Noto Serif & Noto Sans for international character coverage

---

## 📁 Repository Structure

```
AdView/
├── blogsphere-client/       # React 19 Frontend Application
│   ├── public/              # HTML template & Google Fonts preconnect
│   └── src/
│       ├── components/      # UI, Layout, Article & Search components
│       ├── config/          # Brand configuration (easily rebrandable)
│       ├── context/         # AuthContext (JWT session management)
│       ├── data/            # Mock categories, writers, and articles
│       ├── pages/           # Public & Auth routes
│       ├── services/        # Axios API client
│       └── styles/          # Variables & global editorial styles
│
└── blogsphere-server/       # Node.js + Express.js Backend API
    ├── src/
    │   ├── config/          # Environment & MongoDB connection
    │   ├── controllers/     # Auth & user controllers
    │   ├── middleware/      # Auth guard (protect) & RBAC (authorize)
    │   ├── models/          # User (roles: reader, writer, admin)
    │   └── routes/          # /api/v1/auth routes
    ├── tests/               # Automated integration test suite (Supertest)
    └── devServer.js         # In-memory MongoDB server for instant local dev
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Backend API
```bash
cd blogsphere-server
npm install
npm run dev
```
- API runs at `http://localhost:5000`
- Default admin credentials seeded in dev mode:
  - **Email**: `admin@blogsphere.local`
  - **Password**: `AdminPassword123!`

### 2. Start Frontend Application
```bash
cd blogsphere-client
npm install
npm start
```
- Frontend runs at `http://localhost:3000`

---

## 🧪 Testing

Run backend security and authentication integration tests:
```bash
cd blogsphere-server
npm test
```
- Covers registration, login, JWT cookies, profile retrieval, RBAC protection, and token invalidation.
