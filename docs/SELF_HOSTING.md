# Self-Hosting Guide

Run VCT Wrapped APIs on your own infrastructure.

## Prerequisites

- **Node.js 20+**
- **Redis 7+** (for caching, rate limiting, geo token management)
- API keys for the wrappers you want to use (you don't need all six)

## Quick Start

```bash
git clone https://github.com/ManasTripathi07/vct-wrapped-apis.git
cd vct-wrapped-apis
npm install
cp .env.example .env
```

Edit `.env` with your keys, then:

```bash
npm start
# → Server running on http://localhost:4000
```

## Environment Variables

### Required (Core)

| Variable | Description |
|----------|-------------|
| `VCT_MASTER_KEY` | Your API key for authenticating requests |
| `REDIS_URL` | Redis connection string (default: `redis://localhost:6379`) |

### Per-Wrapper (only needed for wrappers you enable)

**LLM** — At least one set required:
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEYS` | Comma-separated OpenAI keys |
| `GEMINI_API_KEYS` | Comma-separated Gemini keys |
| `LLM_PRIMARY_PROVIDER` | `openai` or `gemini` |

**Pay**:
| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret |

**Firebase**:
| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (with `\n` for newlines) |

**CDN**:
| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**Mail**:
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `MAIL_FROM` | Default sender address |

**Geo**:
| Variable | Description |
|----------|-------------|
| `MAPPLS_CLIENT_ID` | MapMyIndia/Mappls client ID |
| `MAPPLS_CLIENT_SECRET` | MapMyIndia/Mappls client secret |

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
EXPOSE 4000
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

```bash
docker compose up -d
```

## Running Behind Nginx

```nginx
upstream vct_api {
    server 127.0.0.1:4000;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://vct_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Disabling Wrappers

Wrappers without configured credentials will still mount but return 503 errors.
To completely disable a wrapper, comment out its route registration in `src/server.js`.

## Monitoring

- **Health check**: `GET /health` returns `{ status: "ok", uptime, memoryUsage }`
- **Logs**: Winston logs to stdout in JSON format — pipe to your preferred log aggregator
- **Metrics**: Add Prometheus middleware (roadmap) or scrape the health endpoint

## Scaling

For production traffic:
1. Run multiple Node.js instances behind a load balancer
2. Point all instances at the same Redis
3. Use PM2 cluster mode: `pm2 start src/server.js -i max`
4. Consider Redis Sentinel or Redis Cluster for HA
