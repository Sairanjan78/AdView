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
│       ├── hooks/           # useApi / useCategories data hooks
│       ├── pages/           # Public & Auth routes
│       ├── services/        # Axios API client
│       └── styles/          # Variables & global editorial styles
│
└── blogsphere-server/       # Node.js + Express.js Backend API
    ├── src/
    │   ├── config/          # Environment & MongoDB connection
    │   ├── controllers/     # Auth, article, category & writer controllers
    │   ├── middleware/      # Auth guard (protect) & RBAC (authorize)
    │   ├── models/          # User (reader/writer/admin), Article, Category
    │   ├── routes/          # /api/v1/auth, /articles, /categories, /writers
    │   └── seed/            # Sample data + seeding logic used by `npm run seed`
    ├── scripts/seed.js      # `npm run seed`
    ├── tests/               # Automated integration test suite (Supertest)
    └── devServer.js         # `npm run dev:memory`: throwaway in-memory MongoDB for a quick look
```

---

## 🚀 Getting Started

These steps work on Windows (PowerShell or Command Prompt), macOS and Linux.
Commands are shown for **PowerShell**; Command Prompt alternatives are noted where they differ.

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer (includes npm). Check with `node -v`.
- A MongoDB database: a free **MongoDB Atlas** cluster (recommended, step 1) **or** MongoDB installed locally (see [Local MongoDB alternative](#local-mongodb-alternative)).

### 1. Get a MongoDB Atlas connection string (free)
1. Sign up / sign in at <https://www.mongodb.com/cloud/atlas/register>.
2. **Create a cluster** → choose the free **M0** tier → pick a provider/region near you → **Create Deployment**.
3. **Database Access** (left menu, under *Security*): **Add New Database User** → Authentication method *Password* → enter a username and password (avoid special characters, or URL-encode them later, e.g. `@` → `%40`) → role **Read and write to any database** → **Add User**.
4. **Network Access** (under *Security*): **Add IP Address** → **Add Current IP Address** → **Confirm**.
   (For quick testing you can allow `0.0.0.0/0` = access from anywhere; remove it later.)
5. Go to **Database / Clusters** → **Connect** on your cluster → **Drivers** → Driver *Node.js* → copy the connection string. It looks like:
   ```
   mongodb+srv://<db_username>:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Replace `<db_username>` / `<db_password>` with the user from step 3, and **add the database name `blogsphere`** right after `.mongodb.net/` (before the `?`):
   ```
   mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/blogsphere?retryWrites=true&w=majority&appName=Cluster0
   ```

### 2. Configure and start the backend API
```powershell
cd blogsphere-server
Copy-Item .env.example .env        # Command Prompt: copy .env.example .env
notepad .env                       # or open it in VS Code
```
In `.env`:
- Set `MONGODB_URI=` to your Atlas string from step 1 (no quotes, no spaces).
- Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` to the admin login you want (the values in `.env.example` are development defaults only).
- For anything online, also change `JWT_SECRET` to a long random string.

Then install, seed and run:
```powershell
npm install
npm run seed      # creates the admin from ADMIN_EMAIL/ADMIN_PASSWORD + categories, sample writers & articles
npm run dev       # starts the API with auto-reload at http://localhost:5000/api/v1
```
- Check it: open <http://localhost:5000/api/v1/health> → `"database": "connected"`.
- `npm run seed` is safe to run again: it never duplicates content or changes an existing password.
  Use `npm run seed:admin` to create only the admin and categories (no sample content).
- If MongoDB can't be reached, the server stops with a message explaining what to check (URI, password, Network Access IP).

### 3. Start the frontend
Open a **second** terminal:
```powershell
cd blogsphere-client
npm install
npm start         # opens http://localhost:3000
```
The client calls `http://localhost:5000/api/v1` by default. To point it elsewhere, copy
`blogsphere-client/.env.example` to `blogsphere-client/.env`, set `REACT_APP_API_URL`, and restart `npm start`.

Sign in at <http://localhost:3000/login> with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or register a new writer account to publish from **Write**.

### Local MongoDB alternative
1. Install **MongoDB Community Server** from <https://www.mongodb.com/try/download/community> (Windows MSI: keep "Install MongoDB as a Service" checked, so it starts automatically).
2. In `blogsphere-server/.env` use:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/blogsphere
   ```
3. Run `npm run seed` and `npm run dev` as above. Optional: browse the data with MongoDB Compass (installed alongside).

No database at all? `npm run dev:memory` starts the API on a throwaway in-memory MongoDB with the sample data (everything is lost when it stops; useful for a quick look only).

---

## 🧪 Testing

Run the backend integration tests (they use a temporary in-memory MongoDB, never your real database):
```bash
cd blogsphere-server
npm test
```
- Covers registration, login, JWT, profile, RBAC, article CRUD, categories, writers, trending/featured, search, and the seed script.

Check the frontend compiles:
```bash
cd blogsphere-client
npm run build
```
