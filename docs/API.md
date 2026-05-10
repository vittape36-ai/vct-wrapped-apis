# API Reference — VCT Wrapped APIs

Base URL: `http://localhost:4000` (self-hosted) or `https://api.vidya.tech` (managed)

All requests require the `x-api-key` header.

All responses follow:
```json
{ "ok": true|false, "data": {}, "meta": { "wrapper": "llm", "version": "v1", "latencyMs": 42 } }
```

---

## Health & Discovery

### `GET /health`
Returns server status. No auth required.

### `GET /wrappers`
Lists all available wrappers with their route prefixes and status.

---

## LLM — `llm.vidya.tech`

### `POST /llm/v1/chat`
Chat completion with automatic provider fallback and key rotation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | User message |
| `model` | string | No | `gpt-4o-mini` (default), `gpt-4o`, `gemini-2.0-flash`, `gemini-2.5-pro` |
| `provider` | string | No | `openai` or `gemini`. Auto-selects from model if omitted |
| `temperature` | number | No | 0-2, default 0.7 |
| `maxTokens` | number | No | Default 2048 |
| `systemPrompt` | string | No | System instruction |
| `skipCache` | boolean | No | Bypass Redis cache |

**Response:**
```json
{
  "ok": true,
  "data": {
    "reply": "Hello! How can I help?",
    "model": "gpt-4o-mini",
    "provider": "openai",
    "cached": false,
    "usage": { "promptTokens": 12, "completionTokens": 8, "totalTokens": 20 }
  }
}
```

### `GET /llm/v1/models`
Returns available models grouped by provider.

---

## Pay — `pay.vidya.tech`

### `POST /pay/v1/order`
Create a Razorpay order.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount in paise (100 = ₹1) |
| `currency` | string | No | Default `INR` |
| `receipt` | string | No | Your internal receipt ID |
| `notes` | object | No | Key-value metadata |

### `POST /pay/v1/payout`
RazorpayX payout with vendor split support.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountNumber` | string | Yes | RazorpayX account number |
| `amount` | number | Yes | Amount in paise |
| `mode` | string | Yes | `NEFT`, `RTGS`, `IMPS`, `UPI` |
| `purpose` | string | Yes | `salary`, `payout`, `refund` |
| `fundAccount` | object | Yes | Recipient fund account details |
| `idempotencyKey` | string | No | Auto-generated if omitted |
| `splits` | array | No | Vendor split configuration |

### `POST /pay/v1/webhook`
Razorpay webhook receiver. Verifies HMAC SHA-256 signature.

### `GET /pay/v1/payment/:id`
Fetch payment details by Razorpay payment ID.

---

## Firebase — `fb.vidya.tech`

### Auth

#### `POST /fb/v1/auth/verify`
Verify a Firebase ID token.

| Field | Type | Required |
|-------|------|----------|
| `idToken` | string | Yes |

#### `POST /fb/v1/auth/create`
Create a new Firebase user.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |
| `displayName` | string | No |

#### `GET /fb/v1/auth/user/:uid`
Get user record by UID.

#### `POST /fb/v1/auth/claims`
Set custom claims (RBAC).

| Field | Type | Required |
|-------|------|----------|
| `uid` | string | Yes |
| `claims` | object | Yes |

### Firestore

#### `GET /fb/v1/db/:collection/:docId`
Read a document.

#### `PUT /fb/v1/db/:collection/:docId`
Write/update a document. Body is the document data.

#### `DELETE /fb/v1/db/:collection/:docId`
Delete a document.

#### `POST /fb/v1/db/:collection/query`
Query a collection.

| Field | Type | Required |
|-------|------|----------|
| `where` | array | No | `[["field", "op", "value"]]` |
| `orderBy` | string | No | Field to sort by |
| `limit` | number | No | Max docs, default 50 |

### Memora Bridge

#### `GET /fb/v1/memora/:collection/:docId`
Read with Memora metadata injection (timestamps, access logs, agent context).

---

## CDN — `cdn.vidya.tech`

### `POST /cdn/v1/upload/sign`
Generate a signed Cloudinary upload URL.

| Field | Type | Required |
|-------|------|----------|
| `folder` | string | No | Upload folder |
| `publicId` | string | No | Custom public ID |
| `resourceType` | string | No | `image`, `video`, `raw` |
| `tags` | array | No | Asset tags |

### `POST /cdn/v1/url/sign`
Generate a signed delivery URL.

| Field | Type | Required |
|-------|------|----------|
| `publicId` | string | Yes | Asset public ID |
| `transforms` | object | No | Width, height, crop, format, quality |
| `expiresIn` | number | No | Seconds until expiry (default 3600) |

### `POST /cdn/v1/transform`
Apply on-the-fly transformations.

| Field | Type | Required |
|-------|------|----------|
| `publicId` | string | Yes | Asset public ID |
| `transforms` | object | Yes | `{ width, height, crop, format, quality, effect }` |

### `GET /cdn/v1/asset/:publicId`
Get asset metadata.

### `DELETE /cdn/v1/asset/:publicId`
Delete an asset.

---

## Mail — `mail.vidya.tech`

### `POST /mail/v1/send`
Send a transactional email via Resend.

| Field | Type | Required |
|-------|------|----------|
| `to` | string/array | Yes | Recipient(s) |
| `subject` | string | Yes | Email subject |
| `template` | string | No | `otp`, `welcome`, `alert` |
| `variables` | object | No | Template variables |
| `html` | string | No | Custom HTML (if no template) |
| `text` | string | No | Plain text fallback |

### `POST /mail/v1/batch`
Send up to 100 emails in one call.

| Field | Type | Required |
|-------|------|----------|
| `messages` | array | Yes | Array of send payloads (max 100) |

### `GET /mail/v1/templates`
List available built-in templates.

---

## Geo — `geo.vidya.tech`

### `GET /geo/v1/geocode`
Geocode an address (India-optimized via MapMyIndia/Mappls).

| Param | Type | Required |
|-------|------|----------|
| `address` | string | Yes |

### `GET /geo/v1/reverse`
Reverse geocode coordinates to address.

| Param | Type | Required |
|-------|------|----------|
| `lat` | number | Yes |
| `lng` | number | Yes |

### `GET /geo/v1/suggest`
Autosuggest / autocomplete for addresses.

| Param | Type | Required |
|-------|------|----------|
| `query` | string | Yes |
| `location` | string | No | `lat,lng` to bias results |

### `POST /geo/v1/distance`
Distance matrix between points.

| Field | Type | Required |
|-------|------|----------|
| `origins` | array | Yes | `[{ lat, lng }]` |
| `destinations` | array | Yes | `[{ lat, lng }]` |

---

## Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid request body/params |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error (details logged, not exposed) |
| 502 | `PROVIDER_ERROR` | Upstream provider failed |
| 503 | `SERVICE_UNAVAILABLE` | All provider keys exhausted |
