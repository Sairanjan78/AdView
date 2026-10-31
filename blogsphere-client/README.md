# BlogSphere — Phase 1 Complete 🚀

A production-quality, worldwide multi-niche blogging platform.

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | React frontend foundation |
| **Phase 2** | ✅ Complete | Express.js API, MongoDB schemas & Auth |
| Phase 3 | 🔜 Next | Article Editor (TipTap), draft management & Cloudinary |
| Phase 4 | ⏳ Planned | Submission & approval |
| Phase 5 | ⏳ Planned | Social features |
| Phase 6 | ⏳ Planned | AdSense integration |
| Phase 7 | ⏳ Planned | Revenue sharing & payouts |
| Phase 8 | ⏳ Planned | Security, testing, deployment |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router v6, react-helmet-async |
| Styling | Vanilla CSS with custom properties |
| Icons | react-icons |
| Dates | date-fns |
| Backend (Phase 2+) | Node.js, Express.js |
| Database (Phase 2+) | MongoDB Atlas + Mongoose |
| Auth (Phase 2+) | bcrypt, JWT / sessions, email verification |
| Images (Phase 3+) | Cloudinary |
| Editor (Phase 3+) | TipTap |
| Deployment | Render |

---

## 📁 Folder Structure

```
blogsphere-client/
├── public/
│   └── index.html
└── src/
    ├── assets/
    ├── components/
    │   ├── article/       ArticleCard, FeaturedCard
    │   ├── layout/        Navbar, Footer
    │   ├── search/        SearchBar
    │   └── ui/            Button, Avatar
    ├── config/
    │   └── brand.js       ← Single source of brand name/config
    ├── data/
    │   └── mockData.js    ← Mock data (replaced by API in Phase 2)
    ├── pages/
    │   ├── auth/          RegisterPage, LoginPage
    │   └── public/        HomePage, ExplorePage, TrendingPage,
    │                      LatestPage, CategoriesPage, SearchPage,
    │                      ArticleDetailPage, WriterProfilePage, AboutPage
    ├── styles/
    │   ├── variables.css  ← Design system tokens
    │   ├── animations.css ← Keyframes & utilities
    │   └── index.css      ← Global reset + layout
    ├── App.jsx            ← Router + layout shell
    └── index.js           ← React 18 entry
```

---

## 🚀 Running Locally — Phase 1

```bash
cd blogsphere-client
npm start
```

Open **http://localhost:3000**

### Pages to Test

| URL | Page |
|-----|------|
| `/` | Home (hero, categories, trending, latest, writers) |
| `/explore` | Explore with category filters |
| `/trending` | Trending ranked list |
| `/latest` | Latest articles grid |
| `/categories` | All category cards |
| `/search?q=AI` | Search with live filtering |
| `/article/the-rise-of-ai-agents-2025` | Article detail |
| `/writer/alex_writes` | Writer profile |
| `/register` | Registration with role selector |
| `/login` | Login form |
| `/about` | About page with monetization policy |

---

## 🔒 Brand Configuration

All platform text pulls from [`src/config/brand.js`](./src/config/brand.js).
Change the `name` field once to rebrand everywhere:

```js
const brand = {
  name: 'BlogSphere',  // ← change this to rebrand
  tagline: 'Where Ideas Find Their World',
  // ...
};
```

---

## ⚠️ Advertising & Earnings Disclaimer

BlogSphere operates the AdSense publisher account. Advertising revenue is
distributed to eligible writers under a platform revenue-sharing policy:

- **Writer pool: 70%** (configurable by admin)
- **Platform share: 30%** (configurable by admin)

These are platform percentages — not a payment from Google or Meta.
Earnings are estimates until provider reports are finalised.
No specific earnings are guaranteed. See `/writer-monetization-policy` and
`/advertising-disclosure` for full details.

---

## 🧪 Manual Testing — Phase 1

1. Run `npm start`
2. Verify responsive layout on mobile (DevTools → toggle device toolbar)
3. Test the search bar — type "AI" or "travel"
4. Click a category pill to filter articles
5. Navigate to an article detail page
6. Check the Register page — switch between Reader and Writer role
7. Verify the Navbar collapses to a hamburger on mobile

---

## 📋 What Phase 2 Will Add

- Express.js API server (`blogsphere-server/`)
- MongoDB Atlas connection via Mongoose
- User schema (Reader, Writer, Admin roles)
- Registration with bcrypt password hashing
- Email verification flow
- JWT / session-based login
- Protected routes in React
- Role-based access control middleware
