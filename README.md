# BlogSphere — Worldwide Multi-Niche Publishing Platform

BlogSphere is a production-grade, multi-niche blogging platform designed with a **Minimal Luxury** international editorial magazine aesthetic. It supports global readers and writers, editorial submission workflows with administrator approval, advertising and monetization infrastructure, and rich responsive typography.

---

## 🎨 Design: Modern Editorial

Tokens live in `blogsphere-client/src/styles/variables.css`; change them there, not in components.

- **Palette**: warm paper background `#FAF8F5`, ink text `#1A1916`, white cards, one terracotta accent `#A63D1A`. Every text colour meets WCAG AA contrast.
- **Typography**: Fraunces for headings and the wordmark, Inter for UI and body, Source Serif 4 for article text (19px, 1.8 line height, ~70ch column). Noto Serif / Noto Sans as script fallbacks.
- **Icons**: one outline set, [Lucide](https://lucide.dev) via `react-icons/lu`. Categories store a Lucide icon key (`cpu`, `flask-conical`, `heart-pulse`, …) that `src/components/ui/CategoryIcon.jsx` maps to a component; unknown keys or old emoji values fall back to a document icon. Running `npm run seed` updates existing categories to the new keys.
- **Social links**: footer icons only appear for the profiles you set with `REACT_APP_SOCIAL_TWITTER`, `REACT_APP_SOCIAL_INSTAGRAM` and `REACT_APP_SOCIAL_LINKEDIN` (see `blogsphere-client/.env.example`).

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
- [Node.js](https://nodejs.org/) v20 or newer (includes npm). Check with `node -v`.
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
- `MONGODB_URI` is pre-filled with the project's Atlas cluster (`blogsphere_app@blogsphere-cluster…/blogsphere`): replace `<db_password>` with that database user's password (no quotes, no spaces, URL-encode special characters). Using your own cluster? Paste your string from step 1 instead. For local MongoDB, comment the Atlas line and uncomment the local one.
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

## 🔐 Sign-in options: Remember me, Forgot password, Google

All three work out of the box locally; email and Google need a little setup before going online.

### Remember me
The sign-in page has a **Remember me** box.
- Ticked: the token is kept in `localStorage` and lasts `JWT_EXPIRE_REMEMBER` (default `30d`).
- Not ticked: the token is kept in `sessionStorage` (gone when the browser closes) and lasts `JWT_EXPIRE_SESSION` (default `1d`).
- Sign out clears both. Changing your password signs out every other device.

### Forgot password (needs email)
"Forgot password?" on the sign-in page opens `/forgot-password`. The API emails a link to
`<CLIENT_URL>/reset-password/<token>` that works **once** and expires after **30 minutes**. The page always shows the same
"check your inbox" message, so nobody can use it to find out which emails have accounts. Requests are limited to 5 per
15 minutes per IP and one email per account per minute.

Without SMTP settings the API **prints the email (with the reset link) in the server terminal** during development, and in
production it logs a warning and sends nothing. To send real email, set these in `blogsphere-server/.env` (or your host's
environment variables) and set `CLIENT_URL` to your website address so the link points to it:

| Provider | `SMTP_HOST` | `SMTP_PORT` | `SMTP_USER` | `SMTP_PASS` |
|----------|-------------|-------------|-------------|-------------|
| Gmail | `smtp.gmail.com` | `587` | your Gmail address | an **app password** (below), not your normal password |
| Brevo (free, 300 emails/day) | `smtp-relay.brevo.com` | `587` | the SMTP login shown in Brevo | an SMTP key |

Also set `FROM_EMAIL` (and optionally `FROM_NAME`). With Gmail use the same address as `SMTP_USER`; with Brevo use a sender you verified.

- **Gmail app password**: turn on 2-Step Verification at <https://myaccount.google.com/security>, then create one at
  <https://myaccount.google.com/apppasswords> (name it "BlogSphere") and paste the 16 letters into `SMTP_PASS` without spaces.
  Fine for testing and small sites; Gmail limits how much you can send.
- **Brevo**: sign up free at <https://www.brevo.com>, add and verify your sender under **Senders, domains & dedicated IPs**,
  then open **SMTP & API** → **SMTP** to see your login and **Generate a new SMTP key**. For best delivery, authenticate your
  own domain there (adds SPF/DKIM records).

Test it: run the API, open <http://localhost:3000/forgot-password>, enter your account email and check the inbox (and spam folder).

### Continue with Google (optional)
The **Continue with Google** button only appears when the client has `REACT_APP_GOOGLE_CLIENT_ID`; the API route only works
when the server has `GOOGLE_CLIENT_ID`. Use the **same Client ID** in both. Google sign-in finds the account with the same
email (and links it) or creates a new **reader** account with a verified email. It never creates writer or admin accounts.

1. Open <https://console.cloud.google.com>, create (or pick) a project.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience): app name *BlogSphere*, your support
   email, User type **External**. Add your website domain under authorized domains, and **Publish** the app when you go live
   (in *Testing* only the test users you list can sign in). The basic `email`/`profile` scopes need no Google review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
4. Under **Authorized JavaScript origins** add, with no path and no trailing slash:
   - `http://localhost:3000`
   - `http://localhost` (Google recommends it as well for local testing)
   - your Vercel address, e.g. `https://your-project.vercel.app`, and your own domain if you have one (`https://www.yourdomain.com`)

   No redirect URIs are needed (the button uses a popup).
5. Copy the **Client ID** (`…apps.googleusercontent.com`; the client secret is not used) into
   `REACT_APP_GOOGLE_CLIENT_ID` (client `.env` / Vercel environment variables, then rebuild/redeploy) and
   `GOOGLE_CLIENT_ID` (server `.env` / your API host), then restart the API.

New origins can take a few minutes to start working. If the button shows "origin not allowed", the address in the browser
bar does not exactly match one of the authorized origins.

---

## 💰 Google AdSense & SEO

The site is prepared for AdSense, but **ads stay off until you configure them**. Until then no Google script loads and the layout is unchanged.

### What's already built in
- **Pages Google expects**: About, Contact (form saved to MongoDB, plus a mailto link), Privacy Policy (explains Google AdSense and third-party ad cookies and how to opt out), Terms of Service, Cookie Policy and Advertising Disclosure. All of them are linked in the footer. Review the wording and set `REACT_APP_CONTACT_EMAIL` to an inbox you actually read. The legal text is a starting template, not legal advice.
- **`<AdSlot>`** (`src/components/ads/AdSlot.jsx`): renders an AdSense unit only when `REACT_APP_ADSENSE_CLIENT` and that slot's id are set. It sits after the article intro, at the end of each article, and once on the home page.
- **SEO**: every page sets its own title, meta description, canonical URL, Open Graph/Twitter tags and structured data (`BlogPosting` for articles). Search, sign-in, editor and 404 pages are `noindex`. Article slugs are clean (`/article/the-science-of-perfect-sourdough-a-bakers-deep-dive`) and never change after publishing.
- **Sitemap**: the API serves `GET /sitemap.xml`, built from published articles, categories, writers and the static pages. Set `SITE_URL` in `blogsphere-server/.env` to your website's address so the links point to it.

### Before you apply (approval checklist)
1. **Your own domain, live over HTTPS.** AdSense won't approve `localhost` or free subdomains like `*.vercel.app`, `*.netlify.app` or `*.onrender.com`. Buy a domain and point it at your hosted frontend.
2. **Original, useful articles.** Publish enough well-written posts of your own before applying; many approved blogs have roughly 15–30. **Delete the sample articles that `npm run seed` created.** They are placeholders, and Google rejects "low value" or copied content. Use `npm run seed:admin` on your production database.
3. **The pages above, reachable and filled in**, with clear navigation.
4. **Every route must load on refresh.** Configure your static host to serve `index.html` for all paths (Netlify `_redirects`: `/* /index.html 200`; Vercel: a rewrite to `/index.html`). Otherwise `/privacy-policy` returns a 404 to Google's crawler.

### Turning ads on
1. Apply at <https://adsense.google.com> with your domain.
2. Before building the frontend, put your publisher id in `blogsphere-client/.env` (or in your host's environment variables):
   ```
   REACT_APP_SITE_URL=https://www.yourdomain.com
   REACT_APP_API_URL=https://api.yourdomain.com/api/v1
   REACT_APP_ADSENSE_CLIENT=ca-pub-1234567890123456
   ```
   With this set, the site loads `adsbygoogle.js` and the `google-adsense-account` meta tag that AdSense uses to verify the site. Auto ads also work if you enable them in AdSense.
3. **ads.txt**: `public/ads.txt` is a commented template. `npm run build` automatically adds `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` to `build/ads.txt` when `REACT_APP_ADSENSE_CLIENT` is set. To fill it by hand instead, uncomment the last line of `public/ads.txt` and replace `pub-0000000000000000` with your id (`pub-…`, without `ca-`). Check that `https://www.yourdomain.com/ads.txt` opens.
4. After approval, create **Display ad units** (AdSense › Ads › By ad unit), copy each `data-ad-slot` number into the matching variable, and rebuild:
   ```
   REACT_APP_ADSENSE_SLOT_ARTICLE_TOP=1111111111
   REACT_APP_ADSENSE_SLOT_ARTICLE_END=2222222222
   REACT_APP_ADSENSE_SLOT_HOME=3333333333
   ```
5. For visitors in the EEA, UK and Switzerland, Google requires a certified consent message. Turn on **AdSense › Privacy & messaging › European regulations**. It works with the script that is already loaded.
6. Never click your own ads or ask others to click them; that gets accounts banned.

### Search engines
- `npm run build` writes the `Sitemap:` line into `build/robots.txt`. It uses `REACT_APP_SITEMAP_URL` if set, otherwise `<your API origin>/sitemap.xml`. Submit that sitemap in [Google Search Console](https://search.google.com/search-console) after verifying your domain.
- If the API runs on another subdomain (e.g. `api.yourdomain.com`), the `robots.txt` reference lets Google accept it. Alternatively, add a host rewrite so `https://www.yourdomain.com/sitemap.xml` proxies to the API.
- **This frontend is a client-rendered Create React App.** Google can render JavaScript, but it is slower and less reliable than plain HTML, and social link previews (Facebook, X, WhatsApp) don't run JavaScript, so they only see the default title. Two ways to improve this:
  - **Prerendering**: serve static HTML snapshots of pages to crawlers, e.g. your host's prerendering feature, a prerender service, or a build-time tool such as `react-snap`.
  - **Later migration to Next.js** (server-side or static rendering). The API, components and styles can be reused. This is the most robust option for a content site that depends on search traffic.

---

## 🧪 Testing

Run the backend integration tests (they use a temporary in-memory MongoDB, never your real database):
```bash
cd blogsphere-server
npm test
```
- Covers registration, login, JWT, remember me, forgot/reset password (expiry, single use, rate limit), Google sign-in (mocked Google verifier), profile, RBAC, article CRUD, categories, writers, trending/featured, search, the seed script, sitemap/robots, slugs and the contact form.
- On ARM Linux machines where the default MongoDB download is missing, run `MONGOMS_VERSION=7.0.14 MONGOMS_DISTRO=ubuntu-22.04 npm test`.

Frontend tests and build:
```bash
cd blogsphere-client
npx react-scripts test --watchAll=false   # AdSlot, SEO tags, token storage, password strength, Google button
npm run build                              # must say "Compiled successfully."
```
