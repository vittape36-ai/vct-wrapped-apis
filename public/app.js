(function() {
  // --- Presets and Configurations ---
  const servicesConfig = {
    llm: {
      name: 'LLM Wrapper',
      method: 'POST',
      endpoint: '/llm/v1/chat',
      response: `[VCT AI Gateway resolved via Gemini fallback]
{
  "ok": true,
  "data": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "content": "Failsafe pool check completed. OpenAI rate limited (429) -> Gemini fallback auto-route success."
  },
  "meta": { "cache": "miss", "failover": true, "latencyMs": 142 }
}`
    },
    pay: {
      name: 'Payments Wrapper',
      method: 'POST',
      endpoint: '/pay/v1/order',
      response: `[VCT Payment Gateway resolved]
{
  "ok": true,
  "data": {
    "order_id": "order_PRj93x84LmKq",
    "amount": 5000,
    "currency": "INR",
    "splits": [
      { "vendor_id": "vnd_012", "amount": 2500 },
      { "vendor_id": "vnd_089", "amount": 2500 }
    ],
    "status": "authorized"
  }
}`
    },
    fb: {
      name: 'Firebase Wrapper',
      method: 'POST',
      endpoint: '/fb/v1/auth/verify',
      response: `[VCT Firebase Guard resolved]
{
  "ok": true,
  "data": {
    "uid": "usr_vct_test_7f8d",
    "email": "developer-sandbox@vidyacoddle.tech",
    "displayName": "Enterprise Sandbox User"
  },
  "meta": { "token_cache": "injected", "expiry": "1h" }
}`
    },
    cdn: {
      name: 'CDN Wrapper',
      method: 'POST',
      endpoint: '/cdn/v1/url/sign',
      response: `[VCT CDN Transformer resolved]
{
  "ok": true,
  "data": {
    "public_id": "assets/vct_main_logo",
    "signedUrl": "https://res.cloudinary.com/vct-cdn/image/sign/c_fill,h_300,w_300/s--8Lm7x9pQ--/vct_main_logo?token=cl_sig_7d8a9e0f1b2c3d"
  }
}`
    },
    mail: {
      name: 'Mail Wrapper',
      method: 'POST',
      endpoint: '/mail/v1/send',
      response: `[VCT Resend SMTP Dispatcher resolved]
{
  "ok": true,
  "data": {
    "delivery_id": "email_sent_9d8a7c2b5e3f",
    "provider": "resend",
    "status": "delivered_to_gateway"
  }
}`
    },
    geo: {
      name: 'Geo Wrapper',
      method: 'GET',
      endpoint: '/geo/v1/geocode',
      response: `[VCT Geo Suggest resolved via MapMyIndia]
{
  "ok": true,
  "data": {
    "address": "Red Fort, Chandni Chowk, Delhi, 110006",
    "coordinates": { "lat": 28.6562, "lng": 77.2410 }
  }
}`
    }
  };

  // Pre-baked responses for the "Ask Anything" AI box
  const askAnythingResponses = {
    'failsafe': `**Upstream Failsafe System**:
VCT Wrapped APIs continuously monitor error thresholds (like 500s, 429s, and timeouts). 
If an upstream service experiences failure:
1. The request immediately undergoes exponential backoff retry.
2. If failures continue, the wrapper swaps active keys or fails over to standby models (e.g. falling back from OpenAI to Gemini).`,
    
    'rotate': `**Automatic Key Rotation**:
Credentials reside in a round-robin rotation pool. Latencies and provider limits are checked inline.
When a key throws a rate limit error, it is placed on a cooling interval (cooldown timer), and fresh keys are swapped into the pipeline immediately.`,
    
    'caching': `**Sub-5ms Caching Backplane**:
We use high-performance Redis pipelines inline with endpoints.
- **Cache Hit**: Data is returned in <5ms.
- **Cache Miss**: Downstream servers process requests, caching payloads dynamically for configured TTLs.
Rate checking executes asynchronously in the background.`,
    
    'redis': `**Sub-5ms Caching Backplane**:
We use high-performance Redis pipelines inline with endpoints.
- **Cache Hit**: Data is returned in <5ms.
- **Cache Miss**: Downstream servers process requests, caching payloads dynamically for configured TTLs.
Rate checking executes asynchronously in the background.`,

    'default': `**VCT Unified Gateway SDK**:
Available Wrappers:
- **LLM**: Rotates pools of OpenAI and Gemini credentials.
- **Payments**: Splits vendor payments.
- **Firebase**: Gateway verified auth.
- **CDN**: Signed Cloudinary media links.
- **Mail**: Resend template processor.
- **Geo**: MapMyIndia suggested suggestions.

Try typing "failsafe", "rotate", or "caching" to see specific details.`
  };

  // --- Initialize Lucide Icons ---
  lucide.createIcons();

  // --- Smooth Scroll using Lenis ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Link scroll navigation clicks to Lenis
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        lenis.scrollTo(target);
      }
    });
  });

  // --- Custom Fluid Cursor ---
  const cursor = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');
  
  if (cursor && cursorDot) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Update dot position immediately
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    const tick = () => {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      cursor.style.left = `${currentX}px`;
      cursor.style.top = `${currentY}px`;
      requestAnimationFrame(tick);
    };
    tick();

    document.querySelectorAll('.clickable, a, button, input, select').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '48px';
        cursor.style.height = '48px';
        cursor.style.borderColor = 'rgba(0, 242, 254, 0.7)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '32px';
        cursor.style.height = '32px';
        cursor.style.borderColor = 'rgba(0, 242, 254, 0.35)';
      });
    });
  }

  // --- OGL-based WebGL SideRays Background Shader ---
  async function initSideRays(container, props = {}) {
    if (!container) return;

    const {
      speed = 2.5,
      rayColor1 = '#EAB308',
      rayColor2 = '#96c8ff',
      intensity = 2,
      spread = 2,
      origin = 'top-right',
      tilt = 0,
      saturation = 1.5,
      blend = 0.75,
      falloff = 1.6,
      opacity = 1.0
    } = props;

    const hexToRgb = hex => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
    };

    const originToFlip = origin => {
      switch (origin) {
        case 'top-left': return [1, 0];
        case 'bottom-right': return [0, 1];
        case 'bottom-left': return [1, 1];
        default: return [0, 0];
      }
    };

    let ogl;
    try {
      ogl = await import('https://unpkg.com/ogl@0.0.32/dist/ogl.mjs');
    } catch (err) {
      console.error('Failed to load OGL for SideRays', err);
      return;
    }

    const { Renderer, Program, Geometry, Mesh } = ogl;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true
    });

    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(gl.canvas);

    const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

    const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

    const [flipX, flipY] = originToFlip(origin);
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iSpeed: { value: speed },
      iRayColor1: { value: hexToRgb(rayColor1) },
      iRayColor2: { value: hexToRgb(rayColor2) },
      iIntensity: { value: intensity },
      iSpread: { value: spread },
      iFlipX: { value: flipX },
      iFlipY: { value: flipY },
      iTilt: { value: tilt },
      iSaturation: { value: saturation },
      iBlend: { value: blend },
      iFalloff: { value: falloff },
      iOpacity: { value: opacity }
    };

    const geometry = new Geometry(gl, {
      position: { 
        size: 2, 
        data: new Float32Array([-1, -1, 3, -1, -1, 3]) 
      },
      uv: { 
        size: 2, 
        data: new Float32Array([0, 0, 2, 0, 0, 2]) 
      },
    });
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
    const mesh = new Mesh(gl, { geometry, program });

    const updateSize = () => {
      if (!container) return;
      renderer.dpr = Math.min(window.devicePixelRatio, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
    };

    let animId;
    const loop = t => {
      uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    animId = requestAnimationFrame(loop);

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (!animId) {
            animId = requestAnimationFrame(loop);
          }
        } else {
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      if (animId) cancelAnimationFrame(animId);
      try {
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
        if (gl.canvas && gl.canvas.parentNode) {
          gl.canvas.parentNode.removeChild(gl.canvas);
        }
      } catch (e) {}
    };
  }

  // --- Apple Floating Dock Fisheye Scaling ---
  const dock = document.getElementById('floating-dock');
  const dockItems = document.querySelectorAll('.dock-item');

  if (dock && dockItems.length) {
    dock.addEventListener('mousemove', e => {
      const mouseX = e.clientX;
      dockItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(mouseX - itemCenterX);
        
        const maxDist = 140;
        let scale = 1.0;
        
        if (distance < maxDist) {
          const factor = (maxDist - distance) / maxDist;
          scale = 1.0 + factor * 0.5;
        }

        const calculatedSize = 40 * scale;
        item.style.width = `${calculatedSize}px`;
        item.style.height = `${calculatedSize}px`;
      });
    });

    dock.addEventListener('mouseleave', () => {
      dockItems.forEach(item => {
        item.style.width = '40px';
        item.style.height = '40px';
      });
    });
  }

  // --- Bento Cards Cursor Spotlight Tracking ---
  const cards = document.querySelectorAll('.precision-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- Ask Anything AI Box Input Interactions ---
  const askInput = document.getElementById('ask-anything-input');
  const askBox = document.getElementById('ask-anything-box');
  const askSubmitBtn = document.getElementById('ask-submit-btn');
  const responseBox = document.getElementById('hero-response-box');
  const responseText = document.getElementById('hero-response-text');
  const closeResponseBtn = document.getElementById('close-response-btn');

  if (askInput && askBox) {
    askInput.addEventListener('focus', () => askBox.classList.add('focused'));
    askInput.addEventListener('blur', () => askBox.classList.remove('focused'));

    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        askInput.focus();
      }
    });

    const triggerSubmit = () => {
      const query = askInput.value.trim().toLowerCase();
      if (!query) return;

      responseBox.style.display = 'block';
      responseText.textContent = '';
      
      let responseStr = askAnythingResponses['default'];
      for (const key of Object.keys(askAnythingResponses)) {
        if (query.includes(key)) {
          responseStr = askAnythingResponses[key];
          break;
        }
      }

      let charIdx = 0;
      const typeInterval = setInterval(() => {
        if (charIdx < responseStr.length) {
          responseText.textContent += responseStr.charAt(charIdx);
          charIdx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 10);
    };

    askSubmitBtn.addEventListener('click', triggerSubmit);
    askInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        triggerSubmit();
      }
    });

    if (closeResponseBtn) {
      closeResponseBtn.addEventListener('click', () => {
        responseBox.style.display = 'none';
        responseText.textContent = '';
      });
    }
  }

  // --- Live Metrics Ticker Increments & Oscillations ---
  const reqMetric = document.getElementById('metric-requests');
  const cacheMetric = document.getElementById('metric-cache');
  const latMetric = document.getElementById('metric-latency');

  if (reqMetric && cacheMetric && latMetric) {
    let baseRequests = 1248390;
    
    setInterval(() => {
      // Oscillate requests handled
      baseRequests += Math.floor(Math.random() * 4) + 1;
      reqMetric.textContent = baseRequests.toLocaleString();

      // Oscillate latency slightly
      const latencyOsc = (3.8 + Math.random() * 0.9).toFixed(1);
      latMetric.textContent = `${latencyOsc}ms`;

      // Oscillate cache ratio
      const cacheOsc = (97.8 + Math.random() * 1.1).toFixed(1);
      cacheMetric.textContent = `${cacheOsc}%`;
    }, 2800);
  }

  // --- Visual Configurator SDK Playground (Section 2.5) ---
  const configService = document.getElementById('config-service');
  const toggleCache = document.getElementById('toggle-cache');
  const toggleFallback = document.getElementById('toggle-fallback');
  const configRetry = document.getElementById('config-retry');
  const sliderVal = document.getElementById('slider-val');
  const codeDisplay = document.getElementById('playground-code-display');

  if (configService && toggleCache && toggleFallback && configRetry && codeDisplay) {
    
    // Toggle clicks
    [toggleCache, toggleFallback].forEach(tgl => {
      tgl.addEventListener('click', () => {
        tgl.classList.toggle('active');
        compileSDKCode();
      });
    });

    // Slider inputs
    configRetry.addEventListener('input', () => {
      sliderVal.textContent = `${configRetry.value}ms`;
      compileSDKCode();
    });

    // Dropdown change
    configService.addEventListener('change', () => {
      compileSDKCode();
    });

    const compileSDKCode = () => {
      const activeService = configService.value;
      const isCacheOn = toggleCache.classList.contains('active');
      const isFallbackOn = toggleFallback.classList.contains('active');
      const retryMs = configRetry.value;

      let subMethod = 'chat';
      let params = `  messages: [{ role: 'user', content: 'Failsafe test payload' }]`;
      if (activeService === 'pay') {
        subMethod = 'createOrder';
        params = `  amount: 15000,\n  currency: 'INR'`;
      } else if (activeService === 'fb') {
        subMethod = 'verifyAuth';
        params = `  idToken: 'auth-header-key-abc'`;
      } else if (activeService === 'cdn') {
        subMethod = 'signUrl';
        params = `  publicId: 'vct_logo',\n  expires: 3600`;
      } else if (activeService === 'mail') {
        subMethod = 'sendMail';
        params = `  to: 'dev@vct.tech',\n  subject: 'Test email'`;
      } else if (activeService === 'geo') {
        subMethod = 'geocode';
        params = `  address: 'Mumbai, MH'`;
      }

      const generatedCode = `// 🚀 Compiled Client SDK Setup Configuration
import { VCTGateway } from 'vct-wrapped-sdk';

const gateway = new VCTGateway({
  apiKey: process.env.VCT_SECRET_KEY,
  retryDelayMs: ${retryMs},
  enableRedisCache: ${isCacheOn},
  automaticFailover: ${isFallbackOn}
});

// Dispatch request via ${activeService.toUpperCase()} Wrapper
const response = await gateway.${activeService}.${subMethod}({
${params}
});

console.log('${activeService.toUpperCase()} response success:', response.ok);`;

      codeDisplay.textContent = generatedCode;
      Prism.highlightElement(codeDisplay);
    };

    // Compile initially
    compileSDKCode();
  }

  // --- Dynamic Uptime Bars Matrix Generation (Section 3.5) ---
  const uptimeContainers = document.querySelectorAll('.uptime-bars-container');
  uptimeContainers.forEach(container => {
    container.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const bar = document.createElement('div');
      bar.classList.add('uptime-bar');
      
      // Inject minor realistic outages (downtime class) in 2% of bars
      if (Math.random() > 0.97) {
        bar.classList.add('downtime');
        bar.title = 'Uptime: 99.4% (Minor latency resolved at upstream)';
      } else {
        bar.classList.add('operational');
        bar.title = 'Uptime: 100% (Fully Operational)';
      }
      container.appendChild(bar);
    }
  });

  // --- FAQ Accordion Collapsible toggles (Section 4.5) ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        // Toggle active FAQ card
        const isOpen = item.classList.contains('open');
        
        // Close others
        faqItems.forEach(fit => fit.classList.remove('open'));

        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });

  // --- GSAP Scroll Trigger Animations ---
  gsap.registerPlugin(ScrollTrigger);

  // Reveal elements with perspective rotation & slide
  const revealElements = document.querySelectorAll('.reveal-elem');
  revealElements.forEach(elem => {
    const customSpeed = parseFloat(elem.getAttribute('data-speed')) || 1.0;
    
    gsap.fromTo(elem, {
      opacity: 0,
      y: 50 * customSpeed,
      rotationX: -10,
      transformPerspective: 1200
    }, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: elem,
        start: 'top 90%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- SVG Data Flow Pipeline Animation (Section 3) ---
  const flowSection = document.querySelector('.section-data-flow');
  const flowActivePath = document.getElementById('flow-line-active');
  const flowDot = document.getElementById('data-packet-dot');

  if (flowSection && flowActivePath) {
    gsap.to(flowActivePath, {
      strokeDashoffset: 0,
      scrollTrigger: {
        trigger: flowSection,
        start: 'top 35%',
        end: 'bottom 65%',
        scrub: 1
      }
    });

    gsap.fromTo(flowDot, {
      top: '0%',
      opacity: 0
    }, {
      top: '100%',
      opacity: 1,
      scrollTrigger: {
        trigger: flowSection,
        start: 'top 35%',
        end: 'bottom 65%',
        scrub: 0.5,
        onEnter: () => { flowDot.style.opacity = 1; },
        onLeave: () => { flowDot.style.opacity = 0; },
        onEnterBack: () => { flowDot.style.opacity = 1; },
        onLeaveBack: () => { flowDot.style.opacity = 0; }
      }
    });

    const steps = ['#step-node-1', '#step-node-2', '#step-node-3', '#step-node-4'];
    steps.forEach(nodeId => {
      const stepNode = document.querySelector(nodeId);
      if (stepNode) {
        ScrollTrigger.create({
          trigger: stepNode,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => stepNode.classList.add('active'),
          onLeaveBack: () => stepNode.classList.remove('active')
        });
      }
    });
  }

  // --- Terminal Auto-Typing Simulation (Section 4) ---
  const codeSnippet = `// Initialize VCT Unified Gateway SDK
import { VCTGateway } from 'vct-wrapped-sdk';

const vct = new VCTGateway({
  apiKey: process.env.VCT_SECRET_KEY,
  redisUrl: 'redis://localhost:6379'
});

// Resilient LLM Request with automatic key rotation and provider failover
const completion = await vct.llm.chat({
  messages: [{ role: 'user', content: 'Process financial ledger ledger_01' }],
  providers: ['openai', 'gemini'], // Auto-fallback
  cache: true // Sub-5ms Redis cache enabled
});

console.log('Failsafe execution resolved via:', completion.meta.provider);`;

  const terminalSection = document.getElementById('terminal-section');
  const typedCodeTarget = document.getElementById('typed-code-target');
  let hasTyped = false;

  const runCodeTyper = () => {
    if (hasTyped) return;
    hasTyped = true;

    let cursorIndex = 0;
    typedCodeTarget.innerHTML = ''; 

    const typeWriter = setInterval(() => {
      if (cursorIndex < codeSnippet.length) {
        typedCodeTarget.textContent += codeSnippet.charAt(cursorIndex);
        cursorIndex++;
        Prism.highlightElement(typedCodeTarget);
      } else {
        clearInterval(typeWriter);
      }
    }, 12); 
  };

  if (terminalSection && typedCodeTarget) {
    ScrollTrigger.create({
      trigger: terminalSection,
      start: 'top 55%',
      onEnter: runCodeTyper
    });
  }

  // --- Copy Code to Clipboard Trigger ---
  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeSnippet).then(() => {
        const icon = copyBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'check');
          lucide.createIcons();
          setTimeout(() => {
            icon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
          }, 2000);
        }
      });
    });
  }

  // --- Initialize SideRays WebGL background ---
  const raysContainer = document.getElementById('hero-side-rays');
  if (raysContainer) {
    initSideRays(raysContainer, {
      speed: 2.5,
      rayColor1: '#EAB308',
      rayColor2: '#96c8ff',
      intensity: 2,
      spread: 2,
      origin: 'top-right',
      tilt: 0,
      saturation: 1.5,
      blend: 0.75,
      falloff: 1.6,
      opacity: 1.0
    });
  }

  // --- Interactive Bento Cards click behavior to update console query parameter ---
  const bentoCards = document.querySelectorAll('.bento-card');
  bentoCards.forEach(card => {
    card.addEventListener('click', () => {
      const service = card.getAttribute('data-service');
      if (service) {
        window.location.href = `/dashboard.html?service=${service}`;
      }
    });
  });

})();
