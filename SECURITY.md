# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Current release |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email **security@vidya.tech** with:

1. **Description** of the vulnerability
2. **Steps to reproduce** (curl commands, request payloads)
3. **Which wrapper** is affected (`llm`, `pay`, `fb`, `cdn`, `mail`, `geo`, or shared middleware)
4. **Impact assessment** — what an attacker could achieve
5. **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment** within 48 hours
- **Triage + severity** within 5 business days
- **Fix timeline** based on severity:
  - Critical (auth bypass, key leak): patch within 24-48 hours
  - High (rate limit bypass, data exposure): patch within 7 days
  - Medium/Low: next scheduled release

### Scope

The following are in scope:
- API key authentication bypass
- Rate limiter circumvention
- Key vault / credential exposure
- Injection attacks through wrapper parameters
- Webhook signature verification bypass (`pay` wrapper)
- Firebase custom claims escalation (`fb` wrapper)

### Out of Scope

- Vulnerabilities in upstream providers (OpenAI, Razorpay, Cloudinary, etc.)
- Denial of service via legitimate API usage within rate limits
- Issues in dependencies — please report those upstream

### Recognition

We credit all reporters in our release notes (unless you prefer anonymity).
Significant findings may be eligible for VCT swag and early access to API+ features.

## Security Best Practices for Users

- **Rotate your VCT API key** periodically
- **Never commit `.env`** to version control
- **Use environment-specific keys** (dev/staging/prod)
- **Monitor the `/health` endpoint** for unexpected behavior
- **Enable webhook signature verification** for payment callbacks

---

Thank you for helping keep API+ and its users safe.
