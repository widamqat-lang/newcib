# 🚀 Deploy to Railway

## Prerequisites

1. [Railway Account](https://railway.app)
2. [Railway CLI](https://docs.railway.app/develop/cli#installation)

## Quick Deploy

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Option 2: Using CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## Services

This project contains 3 services:

### 1. API Server (`artifacts/api-server`)
- **Technology**: Node.js + Express
- **Port**: 3001
- **Database**: PostgreSQL

### 2. Frontend (`artifacts/cib-prime`)
- **Technology**: React + Vite
- **Port**: 3000
- **Served by**: Nginx

### 3. Database
- **Technology**: PostgreSQL 15
- **ORM**: Drizzle

## Environment Variables

Configure these in Railway dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `PORT` | Server port (default: 3001) | ✅ |
| `NODE_ENV` | Environment (production/development) | ✅ |
| `CORS_ORIGIN` | Allowed origins for CORS | ✅ |

## Database Setup

1. Create a PostgreSQL database on Railway
2. Get the connection string from the Railway dashboard
3. Set `DATABASE_URL` environment variable
4. Push the schema:

```bash
# Using Railway CLI
railway run pnpm --filter @workspace/db push
```

## Docker Deployment

For local Docker deployment:

```bash
# Build the image
docker build -t smartwatch-display .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV=production \
  smartwatch-display
```

## Project Structure

```
├── artifacts/
│   ├── api-server/      # Backend API
│   │   ├── src/
│   │   │   ├── index.ts    # Entry point
│   │   │   ├── app.ts      # Express app
│   │   │   ├── routes/     # API routes
│   │   │   └── lib/        # Utilities
│   │   └── package.json
│   │
│   └── cib-prime/       # Frontend
│       ├── src/
│       │   ├── pages/       # React pages
│       │   ├── components/  # UI components
│       │   └── hooks/      # Custom hooks
│       └── package.json
│
├── lib/
│   ├── api-client-react/   # API client for frontend
│   ├── api-spec/           # OpenAPI spec
│   ├── api-zod/            # Zod schemas
│   └── db/                 # Database schema
│
├── Dockerfile             # Multi-service Docker
├── Dockerfile.api         # API server only
├── Dockerfile.frontend    # Frontend only
├── railway.toml           # Railway config
└── nginx.conf            # Nginx config
```

## Troubleshooting

### Build Fails
- Make sure `pnpm` is available
- Check that all workspace dependencies are installed

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Ensure network connectivity

### CORS Errors
- Set `CORS_ORIGIN` to your frontend URL
- For production, use your actual domain
