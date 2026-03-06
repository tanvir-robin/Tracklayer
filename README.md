<div align="center">

# TrackLayer

**Track anything. Pixels, links, files — all in one place.**

[![Live](https://img.shields.io/badge/tracklayer.xyz-Live%20Service-4f46e5?style=for-the-badge&logo=globe&logoColor=white)](https://tracklayer.xyz)

<br>




<div align="center">
<img width="1536" height="1024" alt="tracklayer_mockups 2" src="https://github.com/user-attachments/assets/aa58b983-cc6b-487f-8614-4b013448c842" />

</div>


[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-Elastic%202.0-blue?style=for-the-badge)](LICENSE)

</div>

---

TrackLayer is a self-hosted asset tracking platform. Attach a unique tracking ID to any asset — a pixel in an email, a short redirect link, or a file in cloud storage, and watch real-time analytics come in. Every hit is captured with IP, country, referrer, device type, and timestamp.

<div align="center">

![tracklayer_tour](https://github.com/user-attachments/assets/f296c232-732f-4c4f-8734-09f1b6cda6b1)

</div>



<br>

## Features

| | |
|---|---|
| **Tracking Pixel** | Embed an invisible 1x1 PNG in emails or web pages to detect views |
| **Tracking Link** | A redirect URL that silently logs each click before forwarding |
| **File Downloads** | Serve files through a tracked download endpoint |
| **Real-time Dashboard** | Live event stream powered by WebSocket |
| **Analytics** | Daily chart, top countries, referrers, unique vs total views |
| **Public Analytics** | Share a read-only analytics page per asset, optionally |
| **Support Tickets** | Built-in contact form and ticket management |

<br>

## Tech Stack

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=flat-square&logo=minio&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)

</div>

<br>

## Deploy with Docker (Recommended)

The fastest way to run TrackLayer. Docker Compose starts all six services — Node.js API, React frontend, MongoDB, Redis, MinIO, and Nginx — with a single command. No manual dependency installation required.

### Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) (Mac / Windows) or Docker Engine + Docker Compose plugin (Linux)

### 1. Clone the repo

```bash
git clone https://github.com/tanvir-robin/Tracklayer.git
cd Tracklayer
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable | What to change |
|---|---|
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 64`) |
| `MINIO_ACCESS_KEY` | MinIO username (default `minioadmin` is fine for private deploys) |
| `MINIO_SECRET_KEY` | MinIO password — change from the default |

All other values are pre-configured to work with the Docker network out of the box.

### 3. Start everything

```bash
docker compose up -d
```

That's it. The first run builds the images and may take a couple of minutes.

| Service | URL |
|---|---|
| App (frontend + API) | `http://localhost` |
| MinIO console | `http://localhost:9001` (login with your `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`) |

### Useful commands

```bash
docker compose logs -f          # stream logs from all services
docker compose logs -f backend  # backend logs only
docker compose down             # stop everything (data volumes are preserved)
docker compose down -v          # stop and delete all data volumes
docker compose pull && docker compose up -d --build  # update to latest
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18 or higher
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- A MinIO or S3-compatible storage bucket

### 1. Clone the repo

```bash
git clone https://github.com/tanvir-robin/Tracklayer.git
cd Tracklayer
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env
# ⚠️  Set JWT_SECRET in .env before starting
npm install
npm run dev
```

The API starts on `http://localhost:4003`. MongoDB, Redis, and MinIO must already be running locally — see `backend/.env.example` for connection string defaults.

### 3. Start the frontend

```bash
cd ../frontend
echo 'VITE_API_BASE=http://localhost:4003' > .env
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:4004`.

<br>

## Environment Variables

A single `.env.example` lives at the repo root. Copy it to `.env` before starting (Docker or manual).

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the API server listens on (default `4003`) |
| `JWT_SECRET` | Secret for signing JWTs. Use a long random string |
| `MINIO_ENDPOINT` | MinIO/S3 URL — pre-set to `http://minio:9000` for Docker |
| `MINIO_BUCKET` | Storage bucket name |
| `MINIO_ACCESS_KEY` | S3 access key |
| `MINIO_SECRET_KEY` | S3 secret key |
| `MINIO_CDN_URL` | CDN base URL in front of storage (optional) |
| `DEV_TEST_IP` | Fallback IP for geo-lookup in local dev (e.g. `8.8.8.8`) |
| `VITE_API_BASE` | Frontend API base URL — leave as `/` for Docker |

> **Docker note:** `MONGO_URL` and `REDIS_URL` are injected automatically by `docker-compose.yml` using Docker service names and do not need to be set in `.env`.

<br>

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive a JWT |

### Assets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/assets` | Yes | List all assets |
| POST | `/assets` | Yes | Create a new asset |
| GET | `/assets/:id` | Yes | Get asset by ID |
| DELETE | `/assets/:id` | Yes | Delete an asset |
| POST | `/assets/upload` | Yes | Upload a file asset |
| PATCH | `/assets/:id/toggle-public` | Yes | Toggle public analytics |

### Tracking (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/p/:id.png` | Serve 1x1 tracking pixel |
| GET | `/l/:id` | Log click and redirect to target URL |
| GET | `/d/:id` | Log download and redirect to file |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/:asset_id` | Yes | Full analytics for an asset |
| GET | `/public/analytics/:asset_id` | No | Public analytics (if enabled) |

### Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tickets` | Yes | List your tickets |
| POST | `/tickets` | No | Submit a support ticket |

<br>

## Tracking Usage

Once you create an asset, you get a tracking ID you can use in any of these formats.

**Pixel** — paste into any HTML email or page:
```html
<img src="https://api.tracklayer.xyz/p/{tracking_id}.png" width="1" height="1" style="display:none" />
```

**Link** — share anywhere you would share a normal URL:
```
https://api.tracklayer.xyz/l/{tracking_id}
```

**File download** — send to anyone who needs the file:
```
https://api.tracklayer.xyz/d/{tracking_id}
```

<br>

## Project Structure

```
tracklayer/
├── docker-compose.yml          # all services wired together
├── .env.example                # single environment file for Docker + manual dev
├── docker/
│   └── nginx/
│       └── default.conf        # reverse proxy: routes / → frontend, /auth|/assets|… → backend
├── backend/
│   ├── Dockerfile
│   ├── controllers/            # route handler logic
│   ├── routes/                 # Express routers
│   ├── models/                 # Mongoose schemas (User, Asset, Event, Ticket)
│   ├── middleware/             # JWT auth middleware
│   ├── services/               # Redis, MinIO, WebSocket setup
│   ├── utils/                  # event logger helpers
│   └── server.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # static file server config (used inside the frontend container)
    └── src/
        ├── pages/              # Landing, Dashboard, Assets, AssetDetail, Contact, etc.
        ├── components/         # Layout, CreateAssetModal, ProtectedRoute
        ├── hooks/              # useAuth, useEventStream
        ├── services/           # API client (axios)
        └── App.jsx
```

<br>

## Self-Hosting on a VPS

> **Prefer the Docker path above.** It works on any VPS with Docker installed and requires far less setup. The steps below are for advanced users who want to run services natively (no Docker).

> These steps assume a plain Ubuntu or Debian VPS with no control panel (no cPanel, Plesk, etc.).

### 1. Install server dependencies

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB
sudo apt install -y mongodb

# Redis
sudo apt install -y redis-server

# Nginx
sudo apt install -y nginx

# PM2 — keeps Node running after reboots
npm install -g pm2

# Certbot — free SSL via Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Push the app to your server

Clone the repo on your server and configure your `.env`. Then from your **local machine**, run:

```bash
./deploy.sh          # builds the frontend and rsyncs dist/ to the server
./deploy-backend.sh  # rsyncs backend, runs npm install, restarts PM2, reloads Nginx
```

Both scripts use `rsync` over SSH. Update the `REMOTE` variable at the top of each script to match your server user and hostname.

### 3. Start the backend process

On the very first deploy, SSH into your server and start the PM2 process manually:

```bash
cd ~/your-app-dir/backend
pm2 start server.js --name tracklayer-api
pm2 save
pm2 startup   # run the command it prints to enable auto-start on reboot
```

All future deploys will restart it automatically through `deploy-backend.sh`.

### 4. Set up Nginx

Create a config at `/etc/nginx/sites-available/tracklayer` with two server blocks:

- **Frontend** — serve the static `dist/` folder with SPA fallback to `index.html`
- **API** — reverse proxy to the Node.js process

Enable it and verify:

```bash
sudo ln -s /etc/nginx/sites-available/tracklayer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Get SSL certificates

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

Certbot patches your Nginx config automatically and sets up auto-renewal.

<br>

---

<div align="center">
  <sub>Built with Node.js, React, and MongoDB. Self-hosted and source-available under the <a href="LICENSE">Elastic License 2.0</a>.</sub>
</div>

<img src="https://api.tracklayer.xyz/p/RoZVWdFJS.png" width="1" height="1" />
