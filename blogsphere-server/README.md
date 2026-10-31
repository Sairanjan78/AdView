# BlogSphere API Server (Phase 2) 🚀

The backend REST API and authentication service for BlogSphere.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas / Mongoose
- **Security**: Helmet, CORS, Express-Rate-Limit, Cookie-Parser, bcryptjs, JSON Web Tokens (JWT)

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18
- MongoDB running locally or a free MongoDB Atlas connection URI

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `MONGODB_URI` is set (e.g., `mongodb://127.0.0.1:27017/blogsphere` or your MongoDB Atlas URI).

### 3. Start the Server
```bash
# Development (with nodemon reload)
npm run dev

# Or standard start
npm start
```

Server will run at: **http://localhost:5000/api/v1**

---

## Authentication Endpoints

| Method | Endpoint | Access | Body Parameters |
|--------|----------|--------|-----------------|
| `GET`  | `/api/v1/health` | Public | None |
| `POST` | `/api/v1/auth/register` | Public | `name`, `email`, `password`, `role` (`'reader'` \| `'writer'`), `username` (optional) |
| `POST` | `/api/v1/auth/login` | Public | `email`, `password` |
| `GET`  | `/api/v1/auth/me` | Protected | Bearer token header or cookie |
| `POST` | `/api/v1/auth/verify-email` | Public | `token` |
| `POST` | `/api/v1/auth/forgot-password` | Public | `email` |
| `POST` | `/api/v1/auth/reset-password` | Public | `token`, `password` |
| `PUT`  | `/api/v1/auth/profile` | Protected | `name`, `bio`, `avatar`, `socialLinks`, `nicheSpecialties` |
| `POST` | `/api/v1/auth/logout` | Public | Clears cookie |

---

## Initial Administrator Seeding

To create an initial administrator account for platform management:
```bash
node scripts/seedAdmin.js
```
Default seed credentials:
- **Email**: `admin@blogsphere.local`
- **Password**: `AdminPassword123!`
- **Role**: `admin`
*(Remember to change the password in production)*
