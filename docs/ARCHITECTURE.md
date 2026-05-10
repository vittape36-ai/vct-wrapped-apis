# Architecture — VCT Wrapped APIs

## Overview

VCT Wrapped APIs is a unified gateway that wraps six third-party services behind
a consistent interface with built-in reliability patterns. Every wrapper shares
the same middleware stack, response format, and authentication mechanism.

## System Diagram

```
                    ┌─────────────────────────────────────────┐
                    │            Client Application           │
                    │   @vct/api-plus SDK  |  Direct HTTP     │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │          Express Gateway (:4000)         │
                    │                                         │
                    │  ┌─────────┐ ┌──────────┐ ┌─────────┐  │
                    │  │  Auth   │→│  Rate    │→│ Logger  │  │
                    │  │  (key)  │ │ Limiter  │ │(winston)│  │
                    │  └─────────┘ └──────────┘ └─────────┘  │
                    │                                         │
                    │  ┌───────────────────────────────────┐  │
                    │  │           Route Layer              │  │
                    │  │  /llm  /pay  /fb  /cdn /mail /geo │  │
                    │  └──────────────┬────────────────────┘  │
                    │                 │                        │
                    │  ┌──────────────▼────────────────────┐  │
                    │  │          Service Layer             │  │
                    │  │  KeyVault │ Retry │ Cache │ Logic  │  │
                    │  └──────────────┬────────────────────┘  │
                    └─────────────────┼───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │                 ▼                        │
                    │  ┌────────────────────────────────────┐  │
                    │  │          Redis (ioredis)           │  │
                    │  │   Cache  │  Rate limits  │  Geo    │  │
                    │  └────────────────────────────────────┘  │
                    └─────────────────────────────────────────┘
                                      │
          ┌───────────┬──────────┬────┴─────┬──────────┬──────────┐
          ▼           ▼          ▼          ▼          ▼          ▼
      ┌───────┐  ┌────────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌───────┐
      │OpenAI │  │Razorpay│ │Firebase│ │Cloudi- │ │Resend │ │Mappls │
      │Gemini │  │  + X   │ │Auth+DB│ │ nary   │ │       │ │(MMI)  │
      └───────┘  └────────┘ └───────┘ └────────┘ └───────┘ └───────┘
```

## Key Design Decisions

### 1. Shared Middleware Stack
Every request flows through: Auth → Rate Limiter → Logger → Route Handler → Error Handler.
This guarantees consistent security and observability across all wrappers.

### 2. KeyVault — Multi-Key Rotation
The `KeyVault` class manages pools of API keys per provider. Keys are served
round-robin. When a key hits a 429 (rate limit), it's automatically cooled down
for a configurable period. This lets you load-balance across multiple free-tier
keys or paid keys to maximize throughput.

### 3. Retry with Exponential Backoff + Jitter
All external calls use `withRetry()` — configurable max attempts, base delay,
and randomized jitter to prevent thundering herd on provider outages.

### 4. Redis-First Caching
Deterministic cache keys built from request parameters. LLM responses, geocoding
results, and Firebase reads are cached to reduce provider costs and latency.
Cache TTLs are tuned per wrapper.

### 5. Provider Fallback (LLM)
The LLM wrapper can automatically fall back from the primary provider (e.g., OpenAI)
to the secondary (e.g., Gemini) if all primary keys are exhausted or erroring.

### 6. Thin Routes, Fat Services
Routes handle HTTP concerns (validation, status codes, middleware binding).
Services are pure functions with no Express dependency — making them testable
and reusable in non-HTTP contexts (CLI tools, workers, SDK internals).

## Directory Structure

```
vct-wrapped-apis/
├── src/
│   ├── config/          # Environment validation, Redis client
│   ├── middleware/       # Auth, rate limiting, logging, error handling
│   ├── utils/           # Response helpers, retry, KeyVault, cache
│   ├── services/        # Business logic per wrapper (no Express)
│   ├── routes/          # Express routers per wrapper
│   └── server.js        # App entry point
├── tests/               # Vitest test suites
├── docs/                # API reference, architecture, self-hosting
├── .github/             # CI, issue templates, PR template
└── package.json
```

## Adding a New Wrapper

Follow the pattern: one service file + one route file. Register in server.js.
See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full checklist.

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| LLM cached response | <50ms | Redis cache hit |
| Geocode cached | <30ms | Redis cache hit |
| Payment order creation | <500ms | Direct Razorpay call |
| Mail send | <200ms | Resend's edge network |
| Rate limit check | <1ms | In-memory (express-rate-limit) |

## Security Model

- **API Key auth**: `x-api-key` header, validated against VCT master key (v0.1)
  - Roadmap: per-tenant keys stored in MongoDB with scopes/quotas
- **Rate limiting**: Per-key, per-wrapper, configurable windows
- **No credentials in responses**: Provider errors are sanitized
- **Webhook verification**: HMAC SHA-256 for Razorpay callbacks
- **Signed URLs**: Time-limited for CDN asset delivery
