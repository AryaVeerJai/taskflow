# ⚡ TaskFlow — Scalable REST API with Auth & RBAC

> A production-ready full-stack application featuring JWT authentication, role-based access control, and a complete task management CRUD API — built with **Express.js**, **MongoDB**, and **React.js**.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js 4.x |
| **Database** | MongoDB 7 + Mongoose ODM |
| **Auth** | JWT (Access + Refresh Tokens), bcryptjs |
| **Frontend** | React.js 18, React Router v6 |
| **Validation** | express-validator |
| **Security** | Helmet, express-mongo-sanitize, express-rate-limit, CORS |
| **Logging** | Winston |
| **Docs** | Swagger UI + Postman Collection |
| **Deployment** | Docker + Docker Compose + Nginx |

---

## 🚀 Quick Start

### Option A — Docker (Recommended)

```bash
git clone https://github.com/AryaVeerJai/taskflow.git
cd taskflow

# Copy env and set secrets
cp backend/.env.example backend/.env

# Start everything (MongoDB + Backend + Frontend)
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api/docs |
| Health Check | http://localhost:5000/health |

---

### Option B — Local Development

**Prerequisites:** Node.js 18+, MongoDB running locally

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # Edit values as needed
npm run dev                   # Starts on :5000 with nodemon
```

#### 2. Frontend

```bash
cd frontend
npm install
npm start                     # Starts on :3000, proxies API to :5000
```

---

## 🗂️ Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/           # DB connection, Swagger YAML
│   │   ├── controllers/      # Business logic (auth, tasks, admin)
│   │   ├── middleware/        # Auth guard, error handler, validator
│   │   ├── models/           # Mongoose schemas (User, Task)
│   │   ├── routes/           # Versioned API routes (/api/v1/...)
│   │   ├── utils/            # JWT helpers, logger, API response
│   │   ├── validators/       # express-validator rules
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Entry point + graceful shutdown
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/          # AuthContext (global auth state)
│   │   ├── pages/            # Login, Register, Dashboard, Tasks, Profile, Admin
│   │   ├── components/       # Layout (sidebar + outlet)
│   │   └── services/         # Axios instance + API modules
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── TaskFlow_API.postman_collection.json
└── README.md
```

---

## 🔐 Authentication

- **Registration** — hashed with `bcryptjs` (12 salt rounds)
- **Access Token** — short-lived JWT (7d default)
- **Refresh Token** — long-lived JWT (30d), stored in DB, rotated on use
- **Protected routes** — `protect` middleware verifies token + checks DB
- **Password change** — invalidates previous tokens via `passwordChangedAt`

### Auth Flow

```
POST /api/v1/auth/register  →  { user, accessToken, refreshToken }
POST /api/v1/auth/login     →  { user, accessToken, refreshToken }
GET  /api/v1/auth/me        →  { user }           [Bearer required]
PUT  /api/v1/auth/update-profile                  [Bearer required]
PUT  /api/v1/auth/change-password                 [Bearer required]
POST /api/v1/auth/refresh-token  →  new token pair
POST /api/v1/auth/logout                          [Bearer required]
```

---

## 📋 Task API

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/tasks` | List tasks (paginated, filterable) |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/:id` | Get single task |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |
| PATCH | `/api/v1/tasks/:id/archive` | Archive task |
| GET | `/api/v1/tasks/stats` | Stats by status & priority |

**Query params for GET /tasks:** `page`, `limit`, `status`, `priority`, `search`, `sortBy`, `order`

---

## 🛡️ Admin API

Requires `role: admin` in JWT.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | Platform dashboard stats |
| GET | `/api/v1/admin/users` | All users (paginated) |
| GET | `/api/v1/admin/users/:id` | Single user |
| PATCH | `/api/v1/admin/users/:id/toggle-status` | Activate/deactivate |
| PATCH | `/api/v1/admin/users/:id/role` | Change role |
| GET | `/api/v1/admin/tasks` | All tasks across users |

---

## 📄 API Response Format

All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}

// Error
{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs, 12 rounds |
| JWT signing | RS256-ready, HS256 default, issuer+audience claims |
| Token rotation | Refresh tokens invalidated on use & password change |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from inputs |
| Rate limiting | 100 req/15min global, 10 req/15min for auth endpoints |
| Request size | 10kb JSON body limit |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Whitelist-based, configurable via `ALLOWED_ORIGINS` |
| Input validation | express-validator on all request bodies |
| Error leakage | Stack traces hidden in production |

---

## 📊 Database Schema

### User
```
name        String (2–50)
email       String (unique, indexed)
password    String (hashed, select:false)
role        Enum [user, admin]
isActive    Boolean
refreshToken String (select:false)
lastLogin   Date
passwordChangedAt Date
timestamps  createdAt, updatedAt
```

### Task
```
title        String (3–100)
description  String (max 1000)
status       Enum [todo, in-progress, done]
priority     Enum [low, medium, high]
dueDate      Date
tags         [String]
owner        ObjectId → User (indexed)
isArchived   Boolean
isOverdue    Virtual (computed)
timestamps   createdAt, updatedAt

Indexes: owner+status, owner+priority, owner+createdAt, text(title+description)
```

---

## 🌐 API Documentation

- **Swagger UI** → http://localhost:5000/api/docs
- **Postman Collection** → `TaskFlow_API.postman_collection.json`
  - Import into Postman
  - Run "Register" or "Login" — tokens auto-saved to collection variables
  - All subsequent requests use `{{accessToken}}` automatically

---

## 📈 Scalability Notes

### Current Architecture (Monolith)
Single Express app with MongoDB — suitable for thousands of concurrent users.

### Horizontal Scaling Path

```
Load Balancer (Nginx / AWS ALB)
       │
  ┌────┴────┐
 API-1    API-2   ← Stateless (JWT), scale freely
  └────┬────┘
       │
    MongoDB        ← Replica Set for HA
    Redis          ← Session cache, rate-limit counters (optional)
```

### Microservices Evolution
When needed, split into:
- **Auth Service** — registration, login, token management
- **Task Service** — CRUD, search, archiving
- **Notification Service** — due-date reminders, activity feed
- **API Gateway** — routing, auth middleware, rate limiting

Communication via **REST** (sync) or **message queue** like RabbitMQ/Kafka (async).

### Caching Strategy (Redis — optional)
```
GET /tasks/stats → cache 60s (per user)
GET /admin/stats → cache 30s
Rate limit counters → Redis instead of in-memory (multi-instance safe)
```

### Additional Production Recommendations
- **MongoDB Atlas** with replica set + automated backups
- **PM2** or **Kubernetes** for process management
- **Datadog / Grafana + Prometheus** for observability
- **GitHub Actions** CI/CD pipeline for automated testing & deployment
- **AWS S3 / CloudFront** for frontend static hosting

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | Access token signing key (min 32 chars) | — |
| `JWT_EXPIRE` | Access token expiry | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | — |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | `30d` |
| `ALLOWED_ORIGINS` | CORS whitelist (comma-separated) | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `NODE_ENV` | `development` or `production` | `development` |

---

## 🧪 API Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 📝 License

MIT — free to use, modify, and distribute.
