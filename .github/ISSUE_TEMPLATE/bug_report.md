---
name: 🐛 Bug Report
about: Something isn't working as expected
title: "[BUG] "
labels: bug
assignees: ''
---

## Wrapper
<!-- Which wrapper is affected? -->
- [ ] `llm` (llm.vidya.tech)
- [ ] `pay` (pay.vidya.tech)
- [ ] `fb` (fb.vidya.tech)
- [ ] `cdn` (cdn.vidya.tech)
- [ ] `mail` (mail.vidya.tech)
- [ ] `geo` (geo.vidya.tech)
- [ ] Shared middleware / core

## Description
<!-- A clear description of the bug -->

## Steps to Reproduce
```bash
# curl command or code snippet
curl -X POST http://localhost:4000/llm/v1/chat \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello"}'
```

## Expected Behavior
<!-- What should happen? -->

## Actual Behavior
<!-- What actually happens? Include error response if applicable -->
```json

```

## Environment
- **Node.js version**: 
- **OS**: 
- **vct-wrapped-apis version**: 
- **Redis version**: 

## Additional Context
<!-- Logs, screenshots, related issues -->
