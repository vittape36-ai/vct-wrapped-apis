# VCT Wrapped APIs - AI Agent Instructions

This document provides a concise, structured overview of the **VCT Wrapped APIs** codebase. It is designed to help incoming AI developer agents quickly understand the architecture, patterns, and entry points.

---

## 🛠️ Technology Stack
- **Backend Core**: Node.js, Express (ES Modules: `"type": "module"` in `package.json`).
- **Caching**: Redis (handled via `ioredis` with in-memory fallback if Redis is down).
- **Rate Limiting**: `express-rate-limit` (integrated with Redis or memory fallback).
- **Unit Testing**: Vitest (`npm run test`).
- **Frontend UI**: Vanilla HTML5, premium Vanilla CSS, and Vanilla JavaScript served statically from the `/public` folder.

---

## 📂 Core Directory Structure

```
vct-wrapped-apis/
├── public/                 # Static Frontend UI assets (Served at '/')
│   ├── index.html          # Portal Landing Page
│   ├── dashboard.html      # Developer Console UI
│   ├── style.css           # Curated deep-space style stylesheet
│   └── app.js              # Tab switches, Sandbox API calls & Rotation logs simulator
├── src/
│   ├── server.js           # Main Entry Point (Express setup + static serve + route loading)
│   ├── config/
│   │   ├── env.js          # Joi schema for validating dotenv environment variables
│   │   └── redis.js        # Redis client initiator with offline fallback triggers
│   ├── middleware/
│   │   ├── auth.js         # API Key header check (expects 'x-api-key' value matching master key)
│   │   ├── logger.js       # Winston-based request-response logger
│   │   ├── rateLimiter.js  # Global limiters (defaultLimiter and strictLimiter)
│   │   └── errorHandler.js # Global Express middleware for handling exceptions
│   ├── services/           # Service Wrappers (Contain downstream SDK connections)
│   │   ├── llm.service.js  # OpenAI & Gemini failovers + Redis caching
│   │   ├── pay.service.js  # Razorpay order generation & payouts
│   │   ├── fb.service.js   # Firebase Auth/Firestore with Memora token checks
│   │   ├── cdn.service.js  # Cloudinary upload signatures & transformations
│   │   ├── mail.service.js # Resend email templates & dispatching
│   │   └── geo.service.js  # India PIN code parsing & MapMyIndia geocoding
│   ├── routes/             # Route controllers (Map request bodies to services)
│   │   └── *.routes.js     # Routes prefix matching service names (e.g. /llm/*, /pay/*)
│   └── utils/              # Shared helper functions
│       ├── retry.js        # Retry with exponential backoff (`retry()`)
│       ├── keyVault.js     # Round-robin key rotation and cooldown pools
│       ├── cache.js        # Redis cache key generation, cacheGet, and cacheSet
│       └── response.js     # Uniform Express JSON responders (`ok()`, `fail()`)
└── tests/                  # Vitest test suites (e.g. llm.test.js, geo.test.js)
```

---

## 🔑 Crucial Shared Utility Functions

### 1. Key Rotation Pool (`KeyVault`)
Located in: [keyVault.js](file:///d:/API+/vct-wrapped-apis/src/utils/keyVault.js)
- Instantiate with an array of keys: `const vault = new KeyVault(['key1', 'key2']);`
- Retrieve next key round-robin: `const key = vault.next();`
- Temporary cooldown on key failures (e.g. 429s): `vault.cooldown(key, durationMs);`

### 2. Exponential Backoff Retry (`retry`)
Located in: [retry.js](file:///d:/API+/vct-wrapped-apis/src/utils/retry.js)
- Run an async operation safely:
  ```javascript
  const result = await retry(() => client.call(), { retries: 2, label: 'mail:send' });
  ```

### 3. Edge Caching (`cache`)
Located in: [cache.js](file:///d:/API+/vct-wrapped-apis/src/utils/cache.js)
- Read Cache: `const cached = await cacheGet(key);`
- Write Cache: `await cacheSet(key, value, ttlSeconds);`

### 4. Standard Response Helpers (`response`)
Located in: [response.js](file:///d:/API+/vct-wrapped-apis/src/utils/response.js)
- `ok(res, data, meta)` => returns `{ ok: true, data, ...meta }` with status 200.
- `fail(res, statusCode, message, errors)` => returns `{ ok: false, error: { code, message, errors } }`.

---

## 🔌 API Routes Reference Summary

### 1. Discovery & Diagnostics (No Authentication)
- `GET /health` -> Retrieves process uptime, status, and config.
- `GET /wrappers` -> Catalog of prefixes, descriptions, and SDK bindings.

### 2. Protected Endpoints (Requires `x-api-key` header)
- **LLM Wrapper**:
  - `POST /llm/v1/chat` -> `{ messages, model, provider, cache, options }`
  - `GET /llm/v1/models` -> Returns list of provider-grouped available LLM models.
- **Payments (Pay) Wrapper**:
  - `POST /pay/v1/order` -> `{ amount, currency, receipt, notes }`
  - `POST /pay/v1/payout` -> `{ amount, account, purpose, idempotencyKey, splits }`
  - `GET /pay/v1/payment/:id` -> Retrieves specific payment record.
  - `POST /pay/v1/webhook` (No API key check; uses signature validation) -> Razorpay webhooks receiver.
- **Firebase (Fb) Wrapper**:
  - `POST /fb/v1/auth/verify` -> Verify Firebase ID token `{ idToken }`
  - `POST /fb/v1/auth/create` -> Create credential `{ email, password, displayName }`
  - `GET /fb/v1/auth/user/:uid` -> Read profile.
  - `POST /fb/v1/auth/claims` -> Set custom claims `{ uid, claims }`
  - `GET /fb/v1/db/:collection/:docId` -> Fetch document.
  - `PUT /fb/v1/db/:collection/:docId` -> Store document `{ data, merge }`
  - `POST /fb/v1/db/:collection/query` -> Filter records `{ where, orderBy, limit }`
  - `GET /fb/v1/memora/:collection/:docId` -> Fetches document context injected with Memora tokens.
- **CDN (Cloudinary) Wrapper**:
  - `POST /cdn/v1/upload/sign` -> Get client signed tokens `{ folder, tags, maxBytes }`
  - `POST /cdn/v1/url/sign` -> Secure delivery URL `{ publicId, transforms, ttlSeconds }`
  - `POST /cdn/v1/transform` -> Generate live transformation link `{ publicId, transforms }`
- **Mail (Resend) Wrapper**:
  - `POST /mail/v1/send` -> Transactional send `{ to, subject, html, template, data }`
  - `POST /mail/v1/batch` -> Send multiple emails `{ emails: [...] }`
  - `GET /mail/v1/templates` -> Lists OTP, Welcome, and Alert mail designs.
- **Geo (MapMyIndia) Wrapper**:
  - `GET /geo/v1/geocode?q=query` -> Address parsing.
  - `GET /geo/v1/reverse?lat=lat&lng=lng` -> Reverse geocode.
  - `GET /geo/v1/suggest?q=query` -> Autosuggest.
  - `POST /geo/v1/distance` -> Split travel metrics `{ origins, destinations, profile }`

---

## 🏃 Run & Testing Commands

```bash
# Run tests (using Vitest)
npm run test

# Launch dev server (runs express entry via node watch)
npm run dev
```
Default master API key is set via `VCT_MASTER_KEY` variable inside `.env`. In the local dev env, it defaults to `boss123`. Passes of the `x-api-key: boss123` header are required.
