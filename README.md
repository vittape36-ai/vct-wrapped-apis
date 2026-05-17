# 🔌 VCT Wrapped APIs

**Production-ready API wrappers by [Vidya Coddle Tech](https://vidyacoddle.tech)**  
_One SDK. Six services. Ship Day 1._

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-red.svg)](#contributing)

---

## What is this?

Wrapped Open APIs = battle-tested wrappers around popular third-party services, with **VCT-grade reliability** baked in:

| Wrapper | Domain | Wraps | What You Get |
|---------|--------|-------|--------------|
| **`llm.vidyacoddle.tech`** | AI/LLM | OpenAI, Gemini | Key rotation, response caching, automatic fallbacks |
| **`pay.vidyacoddle.tech`** | Payments | RazorpayX | Payout orchestration, vendor splits, retry logic |
| **`fb.vidyacoddle.tech`** | Backend | Firebase Auth/DB | Auth + Firestore with Memora memory injection |
| **`cdn.vidyacoddle.tech`** | Media | Cloudinary | Signed uploads, on-the-fly transforms, CDN caching |
| **`mail.vidyacoddle.tech`** | Email | Resend | 3ms transactional email, template engine, batch sends |
| **`geo.vidyacoddle.tech`** | Maps | MapMyIndia | India-optimized geocoding, reverse lookup, distance matrix |

Every wrapper gives you:
- 🔑 **Key rotation** — never hardcode a vendor key again
- 🔄 **Auto-retry** with exponential backoff
- 📊 **Request logging** to your own ClickHouse/Postgres
- ⚡ **Response caching** via Redis
- 🛡️ **Rate limiting** per API key
- 📖 **Identical SDK interface** across all services

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ManasTripathi07/vct-wrapped-apis.git
cd vct-wrapped-apis
cp .env.example .env    # fill in your vendor keys
npm install
```

### 2. Run

```bash
# Development
npm run dev

# Production
npm start

# Run tests
npm test
```

### 3. Hit an endpoint

```bash
# LLM completion with automatic fallback
curl -X POST http://localhost:4000/llm/v1/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-vct-key" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hello"}]}'

# Send an email in 3ms
curl -X POST http://localhost:4000/mail/v1/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-vct-key" \
  -d '{"to": "user@example.com", "subject": "Welcome!", "html": "<h1>Hey</h1>"}'

# Geocode an Indian address
curl "http://localhost:4000/geo/v1/geocode?q=Connaught+Place+Delhi" \
  -H "x-api-key: your-vct-key"
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  API Gateway                     │
│         (Express + Rate Limit + Auth)            │
├─────────┬────────┬────────┬───────┬──────┬──────┤
│  /llm   │ /pay   │  /fb   │ /cdn  │/mail │/geo  │
│         │        │        │       │      │      │
│ OpenAI  │Razorpay│Firebase│Cloudi-│Resend│MapMy │
│ Gemini  │   X    │Auth+DB │ nary  │      │India │
├─────────┴────────┴────────┴───────┴──────┴──────┤
│              Shared Infrastructure               │
│  Redis Cache │ Key Vault │ Logger │ Retry Engine │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
vct-wrapped-apis/
├── src/
│   ├── config/
│   │   ├── env.js              # Environment validation
│   │   └── redis.js            # Redis client setup
│   ├── middleware/
│   │   ├── auth.js             # API key authentication
│   │   ├── rateLimiter.js      # Per-key rate limiting
│   │   ├── logger.js           # Request/response logging
│   │   └── errorHandler.js     # Global error handling
│   ├── services/
│   │   ├── llm.service.js      # OpenAI + Gemini wrapper
│   │   ├── pay.service.js      # RazorpayX wrapper
│   │   ├── fb.service.js       # Firebase wrapper
│   │   ├── cdn.service.js      # Cloudinary wrapper
│   │   ├── mail.service.js     # Resend wrapper
│   │   └── geo.service.js      # MapMyIndia wrapper
│   ├── routes/
│   │   ├── llm.routes.js       # /llm/v1/*
│   │   ├── pay.routes.js       # /pay/v1/*
│   │   ├── fb.routes.js        # /fb/v1/*
│   │   ├── cdn.routes.js       # /cdn/v1/*
│   │   ├── mail.routes.js      # /mail/v1/*
│   │   └── geo.routes.js       # /geo/v1/*
│   ├── utils/
│   │   ├── retry.js            # Exponential backoff
│   │   ├── keyVault.js         # Multi-key rotation
│   │   ├── cache.js            # Redis cache helpers
│   │   └── response.js         # Standardized responses
│   └── server.js               # Express app entry
├── tests/
│   ├── llm.test.js
│   ├── pay.test.js
│   ├── mail.test.js
│   ├── geo.test.js
│   └── middleware.test.js
├── docs/
│   ├── API.md                  # Full endpoint reference
│   ├── ARCHITECTURE.md         # System design deep-dive
│   └── SELF_HOSTING.md         # Deploy your own instance
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── new_wrapper.md
│   └── workflows/
│       └── ci.yml
├── .env.example
├── .gitignore
├── .eslintrc.json
├── package.json
├── LICENSE
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## SDK Usage

Once deployed, use the identical interface everywhere:

```javascript
// npm i @vct/api-plus
import { VCT } from '@vct/api-plus';

const vct = new VCT({ apiKey: 'vct_live_...' });

// LLM — auto-fallback from OpenAI → Gemini
const reply = await vct.llm.chat('Summarize this document');

// Mail — 3ms transactional
await vct.mail.send({
  to: 'user@co.in',
  subject: 'Your OTP',
  template: 'otp',
  data: { code: '482910' }
});

// Geo — India-optimized
const loc = await vct.geo.geocode('Chandni Chowk, Delhi');

// Pay — vendor split payout
await vct.pay.payout({
  amount: 15000,
  account: 'rzp_acc_xxx',
  splits: [{ vendor: 'v1', share: 0.7 }, { vendor: 'v2', share: 0.3 }]
});
```

---

## Contributing

We love contributions! This project is designed for open-source participation.

**Good first issues** are tagged — perfect for your first PR.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide:
1. Fork → Branch → Code → Test → PR
2. Follow the code style (ESLint config included)
3. Every wrapper lives in its own `service + route` pair
4. Add tests for any new endpoints

### Want to add a new wrapper?

Open a [New Wrapper Proposal](../../issues/new?template=new_wrapper.md) — we'll discuss the API design together.

---

## Roadmap

- [x] Core infrastructure (auth, rate limit, cache, retry)
- [x] LLM wrapper (OpenAI + Gemini)
- [x] Mail wrapper (Resend)
- [x] Geo wrapper (MapMyIndia)
- [x] Pay wrapper (RazorpayX)
- [x] CDN wrapper (Cloudinary)
- [x] Firebase wrapper (Auth + DB)
- [ ] WebSocket streaming for LLM
- [ ] Webhook receiver for Pay+
- [ ] gRPC bindings
- [ ] Rust SDK (`cargo add vct-api-plus`)
- [ ] C++ header-only client (Conan)
- [ ] Admin dashboard UI
- [ ] ClickHouse analytics pipeline

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by [Vidya Coddle Tech](https://vidyacoddle.tech)**  
_Stop writing boilerplate. Start shipping product._
