# 🔌 VCT Wrapped APIs SDK

**Production-ready API wrappers by [Vidya Coddle Tech](https://vidyacoddle.tech)**  
_One SDK. Six services. Ship Day 1._

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-red.svg)](#contributing)

---

## What is this?

This is a pure Node.js SDK that wraps popular third-party services with **VCT-grade reliability** baked in. It is designed to be installed directly into your backend applications.

| Wrapper | Domain | Wraps | What You Get |
|---------|--------|-------|--------------|
| **`.llm`** | AI/LLM | OpenAI, Gemini | Key rotation, automatic fallbacks, unified prompt interface |
| **`.pay`** | Payments | RazorpayX | Payout orchestration, vendor splits, automatic retries |
| **`.fb`** | Backend | Firebase Admin | Auth + Firestore utilities |
| **`.cdn`** | Media | Cloudinary | Signed uploads, on-the-fly transforms |
| **`.mail`** | Email | Resend | Built-in templates, batch sending with retries |
| **`.geo`** | Maps | MapMyIndia | India-optimized geocoding, reverse lookup, distance matrix |

Every wrapper gives you:
- 🔄 **Auto-retry** with exponential backoff for network flakes
- 🔑 **Key Array Support** for rotating multiple API keys (LLMs)
- 📖 **Identical Developer Interface** across all services

---

## Quick Start

### 1. Install

```bash
npm install @vct/api-plus
```

### 2. Usage

Import the `VCT` class and initialize it with your raw vendor keys.

```javascript
import { VCT } from '@vct/api-plus';

const vct = new VCT({
  llm: {
    openaiKeys: [process.env.OPENAI_KEY_1, process.env.OPENAI_KEY_2],
    geminiKey: process.env.GEMINI_KEY,
    defaultProvider: 'openai'
  },
  pay: {
    keyId: process.env.RAZORPAY_KEY,
    keySecret: process.env.RAZORPAY_SECRET
  },
  mail: {
    resendKey: process.env.RESEND_KEY,
    fromName: 'MyApp Support',
    fromDefault: 'support@myapp.com'
  }
});

async function main() {
  // LLM — auto-fallback from OpenAI → Gemini if OpenAI fails
  const reply = await vct.llm.chat({
    messages: [{ role: 'user', content: 'Summarize this document' }]
  });
  console.log(reply.content);

  // Mail — send templated emails with automatic retries
  await vct.mail.send({
    to: 'user@co.in',
    template: 'welcome',
    data: { name: 'Manas' }
  });
}

main();
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

**Built with ❤️ by [Vidya Coddle Tech](https://vidyacoddle.tech)**  
_Stop writing boilerplate. Start shipping product._
