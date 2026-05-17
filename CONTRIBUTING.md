# Contributing to VCT Wrapped APIs

First off — **thank you**. Every contribution makes API+ better for developers across India and beyond.

## Quick Start

```bash
git clone https://github.com/ManasTripathi07/vct-wrapped-apis.git
cd vct-wrapped-apis
cp .env.example .env        # fill in your keys
npm install
npm run dev                  # http://localhost:4000/health
```

## Ways to Contribute

### 🐛 Bug Reports
Open an issue using the **Bug Report** template. Include:
- Which wrapper (`llm`, `pay`, `fb`, `cdn`, `mail`, `geo`)
- Request/response samples (redact keys!)
- Steps to reproduce

### ✨ Feature Requests
Open an issue using the **Feature Request** template. We especially want:
- New wrapper proposals (e.g., `sms.vidyacoddle.tech`, `storage.vidyacoddle.tech`)
- SDK improvements
- Performance optimizations

### 🔧 New Wrapper
Want to add a whole new wrapped API? Use the **New Wrapper** issue template,
then follow the architecture below.

## Architecture Rules

Every wrapper follows the same pattern:

```
src/
  services/{name}.service.js   ← Business logic, provider calls
  routes/{name}.routes.js      ← Express router, validation, middleware
```

### Service File Conventions
- Export pure functions, no Express dependency
- Use `withRetry()` from `utils/retry.js` for external calls
- Use `KeyVault` from `utils/keyVault.js` for multi-key rotation
- Use `cache.get()`/`cache.set()` for Redis caching
- Return `{ data, meta }` objects — never send responses directly

### Route File Conventions
- Use Joi for request validation
- Apply rate limiter: `defaultLimiter` or `strictLimiter`
- Use `ok()` / `fail()` from `utils/response.js`
- Keep routes thin — delegate to service

### Response Format
All endpoints return:
```json
{
  "ok": true,
  "data": { ... },
  "meta": { "wrapper": "llm", "version": "v1", "latencyMs": 142 }
}
```

## Code Style

- **ESM only** — `import`/`export`, no `require()`
- **Node 20+**
- Run `npm run lint` before submitting
- Meaningful variable names, no abbreviations except well-known ones (`req`, `res`, `err`)
- JSDoc for all exported functions

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(llm): add streaming response support
fix(pay): handle Razorpay 429 with backoff
docs: update self-hosting guide
test(mail): add batch send edge cases
chore: bump dependencies
```

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Add/update tests for your changes
3. Run `npm test` and `npm run lint`
4. Update docs if you changed any API contract
5. Open a PR with a clear description
6. One maintainer approval required for merge

## Adding a New Wrapper

1. Create `src/services/{name}.service.js`
2. Create `src/routes/{name}.routes.js`
3. Register in `src/server.js` (import + `app.use('/{name}', routes)`)
4. Add wrapper to the `/wrappers` discovery endpoint
5. Add env vars to `.env.example`
6. Write tests in `tests/{name}.test.js`
7. Add docs section in `docs/API.md`
8. Open PR with the **New Wrapper** label

## Security

Found a vulnerability? **Do not open a public issue.**
See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Let's API+.** 🚀
