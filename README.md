# TrackLayer

**Live demo → [https://tracklayer.xyz](https://tracklayer.xyz)**

A lightweight asset-tracking SaaS. Create tracking pixels, redirect links, and file download assets — then watch views, clicks, and geographic data roll in via a real-time dashboard.

## Features

- **Tracking Pixel** — embed a 1×1 PNG in any email or page to detect views
- **Tracking Link** — a redirect URL that logs every click before forwarding
- **File Downloads** — serve files through a tracked download URL
- **Real-time dashboard** — live event stream via WebSocket / SSE
- **Analytics** — daily breakdown, top countries, referrers, unique vs total views
- **Public analytics page** — optionally share a public analytics view per asset
- **Contact / support tickets** — built-in ticket submission and tracking

## Stack

- **Backend**: Node.js + Express (port 4003)
- **Frontend**: React + Vite (port 4004)
- **Database**: MongoDB
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible) behind a CDN

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- A MinIO (or S3-compatible) instance for file uploads

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Backend starts at **http://localhost:4003**

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE=http://localhost:4003
npm install
npm run dev
```

Frontend starts at **http://localhost:4004**

---

## Environment Variables

### backend/.env

| Variable          | Description                                              |
|-------------------|----------------------------------------------------------|
| `PORT`            | Backend port (default `4003`)                           |
| `MONGO_URL`       | MongoDB connection string                               |
| `REDIS_URL`       | Redis connection string                                 |
| `JWT_SECRET`      | Secret for signing JWTs — use a long random string      |
| `DEV_TEST_IP`     | Fallback IP for geo-lookup in local dev (e.g. `8.8.8.8`) |
| `MINIO_ENDPOINT`  | MinIO server URL (e.g. `https://media.example.com`)     |
| `MINIO_BUCKET`    | Storage bucket name                                     |
| `MINIO_ACCESS_KEY`| S3 access key                                           |
| `MINIO_SECRET_KEY`| S3 secret key                                           |
| `MINIO_CDN_URL`   | Public CDN base URL for served files                    |

See `backend/.env.example` for a template.

### frontend/.env

| Variable         | Description                              |
|------------------|------------------------------------------|
| `VITE_API_BASE`  | Backend API URL (`http://localhost:4003` for dev) |

---

## API Reference

### Auth

| Method | Path             | Auth | Description    |
|--------|------------------|------|----------------|
| POST   | `/auth/register` | No   | Register user  |
| POST   | `/auth/login`    | No   | Login, get JWT |

### Assets

| Method | Path                             | Auth | Description                  |
|--------|----------------------------------|------|------------------------------|
| GET    | `/assets`                        | Yes  | List all assets               |
| POST   | `/assets`                        | Yes  | Create asset                  |
| GET    | `/assets/:id`                    | Yes  | Get asset by ID               |
| DELETE | `/assets/:id`                    | Yes  | Delete asset                  |
| POST   | `/assets/upload`                 | Yes  | Upload file asset             |
| PATCH  | `/assets/:id/toggle-public`      | Yes  | Toggle public analytics       |

### Tracking (public, no auth)

| Method | Path                  | Description                         |
|--------|-----------------------|-------------------------------------|
| GET    | `/p/:id.png`          | Serve 1×1 tracking pixel            |
| GET    | `/l/:id`              | Log click + redirect to target URL  |
| GET    | `/d/:id`              | Log download + redirect to file     |

### Analytics

| Method | Path                              | Auth | Description                     |
|--------|-----------------------------------|------|---------------------------------|
| GET    | `/analytics/:asset_id`            | Yes  | Full analytics for an asset     |
| GET    | `/public/analytics/:asset_id`     | No   | Public analytics (if enabled)   |

### Tickets

| Method | Path           | Auth    | Description           |
|--------|----------------|---------|-----------------------|
| GET    | `/tickets`     | Yes     | List your tickets     |
| POST   | `/tickets`     | No/Yes  | Submit a ticket       |

---

## Tracking Usage

### Pixel

```html
<img src="https://api.tracklayer.xyz/p/{tracking_id}.png" width="1" height="1" style="display:none" />
```

### Link

```
https://api.tracklayer.xyz/l/{tracking_id}
```

### File Download

```
https://api.tracklayer.xyz/d/{tracking_id}
```

---

## Project Structure

```
tracklayer/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── assetController.js
│   │   ├── trackingController.js
│   │   ├── analyticsController.js
│   │   ├── publicController.js
│   │   └── ticketController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── assets.js
│   │   ├── tracking.js
│   │   ├── analytics.js
│   │   └── tickets.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Asset.js
│   │   ├── Event.js
│   │   └── Ticket.js
│   ├── middleware/
│   │   └── auth.js
│   ├── services/
│   │   ├── redis.js
│   │   ├── storage.js
│   │   └── websocket.js
│   ├── utils/
│   │   └── eventLogger.js
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Assets.jsx
        │   ├── AssetDetail.jsx
        │   ├── PublicAnalytics.jsx
        │   └── Contact.jsx
        ├── components/
        │   ├── Layout.jsx
        │   ├── CreateAssetModal.jsx
        │   └── ProtectedRoute.jsx
        ├── services/
        │   └── api.js
        ├── hooks/
        │   ├── useAuth.jsx
        │   └── useEventStream.js
        └── App.jsx
```

---

## Deployment

The project deploys via simple shell scripts:

```bash
./deploy.sh          # build frontend + rsync to server
./deploy-backend.sh  # rsync backend + npm install + pm2 restart + nginx reload
```

The server runs behind Nginx with SSL (Let's Encrypt). Backend is managed by PM2 (`tracklayer-api`).
