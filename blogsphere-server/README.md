# BlogSphere API Server 🚀

The backend REST API and authentication service for BlogSphere.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas / Mongoose
- **Security**: Helmet, CORS, Express-Rate-Limit, Cookie-Parser, bcryptjs, JSON Web Tokens (JWT)

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20
- MongoDB running locally or a free MongoDB Atlas connection URI

### 2. Configure Environment
Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`, Command Prompt: `copy .env.example .env`, macOS/Linux: `cp .env.example .env`).
Set `MONGODB_URI` (e.g. `mongodb://127.0.0.1:27017/blogsphere` or your MongoDB Atlas URI ending in `/blogsphere?...`) and `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
See the root README for step-by-step Atlas setup.

### 3. Seed and Start the Server
```bash
npm install
npm run seed       # admin (from ADMIN_EMAIL/ADMIN_PASSWORD) + categories + sample writers & articles
npm run dev        # development (with nodemon reload)
npm start          # or standard start
```
The server connects to MongoDB before listening and exits with setup help if `MONGODB_URI` is missing
(outside `NODE_ENV=development`, where it falls back to a local MongoDB) or unreachable.

Server will run at: **http://localhost:5000/api/v1**

---

## Authentication Endpoints

| Method | Endpoint | Access | Body Parameters |
|--------|----------|--------|-----------------|
| `GET`  | `/api/v1/health` | Public | None |
| `POST` | `/api/v1/auth/register` | Public | `name`, `email`, `password`, `role` (`'reader'` \| `'writer'`), `username` (optional) |
| `POST` | `/api/v1/auth/login` | Public | `email`, `password`, `remember` (boolean: `true` = `JWT_EXPIRE_REMEMBER` token, otherwise `JWT_EXPIRE_SESSION`) |
| `POST` | `/api/v1/auth/google` | Public | `credential` (Google Identity Services ID token), `remember`. 503 unless `GOOGLE_CLIENT_ID` is set |
| `GET`  | `/api/v1/auth/me` | Protected | Bearer token header or cookie |
| `POST` | `/api/v1/auth/verify-email` | Public | `token` |
| `POST` | `/api/v1/auth/forgot-password` | Public | `email`. Same response whether or not the account exists; 5 per 15 min per IP |
| `GET`  | `/api/v1/auth/reset-password/:token` | Public | Checks a reset link (400 if used or expired) |
| `POST` | `/api/v1/auth/reset-password/:token` | Public | `password` (also accepts `POST /reset-password` with `token` in the body). Single use, 30-minute links; signs out other sessions |
| `PUT`  | `/api/v1/auth/profile` | Protected | `name`, `bio`, `avatar`, `socialLinks`, `nicheSpecialties` |
| `POST` | `/api/v1/auth/logout` | Public | Clears cookie |

Email (reset links, verification, contact notifications) is sent with nodemailer when `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS`
are set. Otherwise it is printed in the terminal in development, and skipped with a warning in production.
See the root README for Gmail / Brevo SMTP and Google OAuth client setup.

## Content Endpoints (public)

| Method | Endpoint | Query parameters |
|--------|----------|------------------|
| `GET` | `/api/v1/articles` | `category`, `tag`, `search` (title, excerpt, tags, category, writer name), `author` (username), `featured=true`, `sort` (`latest` \| `trending` \| `oldest`), `page`, `limit` |
| `GET` | `/api/v1/articles/trending` | `limit` (default 5), `category` |
| `GET` | `/api/v1/articles/featured` | `limit` (default 3; topped up with latest articles) |
| `GET` | `/api/v1/articles/:slug` | Increments views; includes author stats |
| `GET` | `/api/v1/categories` | All categories with published article counts |
| `GET` | `/api/v1/categories/:slug` | One category |
| `GET` | `/api/v1/writers` | `limit`; top writers by followers |
| `GET` | `/api/v1/writers/:username` | Writer profile + published articles |
| `POST` | `/api/v1/contact` | `name`, `email`, `subject`, `message` (5 per hour per IP; admins read via `GET /api/v1/contact`) |
| `GET` | `/sitemap.xml` | XML sitemap of published content (links use `SITE_URL`); also `/api/v1/sitemap.xml` |
| `GET` | `/robots.txt` | Robots file for the API host, pointing at the sitemap |

Writer/admin endpoints: `POST /api/v1/articles`, `PUT /api/v1/articles/:id`, `DELETE /api/v1/articles/:id`, `GET /api/v1/articles/me/mine`.

---

## Seeding

```bash
npm run seed         # admin + categories + sample writers & articles (idempotent)
npm run seed:admin   # admin + categories only
```
The admin account comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (plus optional `ADMIN_NAME`, `ADMIN_USERNAME`) in `.env`.
No password is hard-coded; the values in `.env.example` are development defaults, so change them for any shared database.
Sample writers get `SEED_WRITER_PASSWORD` if set, otherwise a random password.
Re-running the seed never duplicates content or changes an existing user's password.
