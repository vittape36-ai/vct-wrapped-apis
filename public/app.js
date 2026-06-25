(function() {
  // --- Presets and Configurations ---
  const servicesConfig = {
    llm: {
      name: 'LLM Wrapper',
      stat: '2 Models Active (OpenAI/Gemini)',
      method: 'POST',
      endpoint: '/llm/v1/chat',
      payload: {
        messages: [
          {
            role: "user",
            content: "Explain API failovers in one sentence."
          }
        ]
      },
      response: {
        ok: true,
        data: {
          provider: "gemini",
          model: "gemini-1.5-flash",
          content: "API failover automatically switches to a standby provider (like Gemini) when the primary provider (like OpenAI) goes offline.",
          usage: { prompt_tokens: 22, completion_tokens: 31, total_tokens: 53 }
        },
        meta: { wrapper: "llm.vidyacoddle.tech", cache: "miss", fallback: true }
      }
    },
    pay: {
      name: 'Payments Wrapper',
      stat: 'RazorpayX Ledger Verification',
      method: 'POST',
      endpoint: '/pay/v1/order',
      payload: {
        amount: 5000,
        currency: "INR",
        receipt: "rcpt_wrapped_001",
        notes: { merchant: "VCT Lab Sandbox", env: "development" }
      },
      response: {
        ok: true,
        data: {
          id: "order_PRj93x84LmKq",
          entity: "order",
          amount: 5000,
          amount_paid: 0,
          amount_due: 5000,
          currency: "INR",
          receipt: "rcpt_wrapped_001",
          status: "created",
          attempts: 0,
          notes: { merchant: "VCT Lab Sandbox", env: "development" },
          created_at: Math.round(Date.now() / 1000)
        },
        meta: { wrapper: "pay.vidyacoddle.tech" }
      }
    },
    fb: {
      name: 'Firebase Wrapper',
      stat: 'Firestore Cache Injector Active',
      method: 'POST',
      endpoint: '/fb/v1/auth/verify',
      payload: {
        idToken: "mock-firebase-id-token-abc-123"
      },
      response: {
        ok: true,
        data: {
          uid: "usr_vct_test_7f8d",
          email: "hacker-console@vidyacoddle.tech",
          displayName: "Sleek Developer",
          emailVerified: false,
          disabled: false,
          metadata: { creationTime: new Date().toUTCString(), lastSignInTime: new Date().toUTCString() }
        },
        meta: { wrapper: "fb.vidyacoddle.tech", memora_cache: "injected" }
      }
    },
    cdn: {
      name: 'CDN Wrapper',
      stat: 'Cloudinary Signed Transformer',
      method: 'POST',
      endpoint: '/cdn/v1/url/sign',
      payload: {
        publicId: "vct_wrapped_avatar",
        transforms: { width: 300, height: 300, crop: "fill" },
        ttlSeconds: 3600
      },
      response: {
        ok: true,
        data: {
          publicId: "vct_wrapped_avatar",
          url: "https://res.cloudinary.com/vct-cdn/image/upload/c_fill,h_300,w_300/s--8Lm7x9pQ--/vct_wrapped_avatar?token=cl_sig_7d8a9e0f1b2c3d",
          expires_at: Math.round(Date.now() / 1000) + 3600
        },
        meta: { wrapper: "cdn.vidyacoddle.tech" }
      }
    },
    mail: {
      name: 'Mail Wrapper',
      stat: 'Resend SMTP Gateway Active',
      method: 'POST',
      endpoint: '/mail/v1/send',
      payload: {
        to: "sandbox-tester@vidyacoddle.tech",
        subject: "Unified Resend Mail Wrapper Active",
        html: "<h1>VCT API+ Mail Delivered</h1><p>Processed successfully via Resend provider API.</p>"
      },
      response: {
        ok: true,
        data: {
          id: "email_sent_9d8a7c2b5e3f",
          to: ["sandbox-tester@vidyacoddle.tech"],
          subject: "Unified Resend Mail Wrapper Active"
        },
        meta: { wrapper: "mail.vidyacoddle.tech" }
      }
    },
    geo: {
      name: 'Geo Wrapper',
      stat: 'India Pin Code Auto-Suggest',
      method: 'GET',
      endpoint: '/geo/v1/geocode',
      payload: {
        q: "Red Fort, Delhi"
      },
      response: {
        ok: true,
        data: {
          query: "Red Fort, Delhi",
          results: [
            {
              formatted_address: "Red Fort, Chandni Chowk, Delhi, 110006",
              latitude: 28.6562,
              longitude: 77.2410,
              pincode: "110006",
              state: "Delhi",
              district: "North Delhi",
              accuracy: "high"
            }
          ]
        },
        meta: { wrapper: "geo.vidyacoddle.tech", provider: "MapMyIndia" }
      }
    }
  };

  const mockLogTemplates = [
    { level: 'info', msg: 'GET /health - 200 OK (5ms)' },
    { level: 'info', msg: 'GET /wrappers - 200 OK (3ms)' },
    { level: 'info', msg: 'POST /llm/v1/chat - 200 OK (22ms) - Cache hit (Redis)' },
    { level: 'info', msg: 'POST /llm/v1/chat - 200 OK (380ms) - Cache miss - OpenAI gateway invoked' },
    { level: 'info', msg: 'POST /pay/v1/order - 200 OK (31ms) - Order generated: order_PRj93x84LmKq' },
    { level: 'info', msg: 'POST /fb/v1/auth/verify - 200 OK (112ms) - Token verified via Memora Cache' },
    { level: 'info', msg: 'POST /cdn/v1/url/sign - 200 OK (2ms) - Signature signed successfully' },
    { level: 'info', msg: 'POST /mail/v1/send - 200 OK (145ms) - Mail template compilations dispatched' },
    { level: 'info', msg: 'GET /geo/v1/geocode?q=Delhi - 200 OK (9ms) - Cache hit' },
    { level: 'warn', msg: 'LLM: OpenAI returned 429 Rate Limit. Initiating key cooldown...' },
    { level: 'info', msg: 'LLM Key Vault rotated. New primary: sk-proj-••••9w3a' },
    { level: 'info', msg: 'LLM Fallback: Primary failed -> Gemini fallback invoked successfully (204ms)' },
    { level: 'warn', msg: 'Auth validation: Client ip 127.0.0.1 failed API key verification.' }
  ];

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // --- WebGL SideRays Component Ported from React Bits ---
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

  let processUptimeSeconds = 0;
  let isLogsPaused = false;
  let wrappersListPopulated = false;

  // --- Custom Fluid Cursor stretching based on Velocity ---
  const cursorCircle = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');

  let mouseX = 0, mouseY = 0;
  let lastMouseX = 0, lastMouseY = 0;
  let velocityX = 0, velocityY = 0;
  let cursorSpeed = 0;
  let cursorAngle = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(() => {
      // Calculate cursor speed and angle
      velocityX = mouseX - lastMouseX;
      velocityY = mouseY - lastMouseY;
      
      cursorSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      cursorAngle = Math.atan2(velocityY, velocityX) * 180 / Math.PI;

      // Position inner dot instantly
      if (cursorDot) {
        gsap.set(cursorDot, {
          x: mouseX,
          y: mouseY,
          xPercent: -50,
          yPercent: -50
        });
      }

      // Stretch outer glass ring based on speed and rotate towards movement direction
      if (cursorCircle) {
        const isHovered = cursorCircle.classList.contains('hovered');
        
        // Base size logic
        const baseScale = isHovered ? 2.0 : 1.0;
        const maxStretch = isHovered ? 0.3 : 0.6;
        
        // Calculate stretch factors (more scaleX along path of motion, squash scaleY)
        const stretch = Math.min(cursorSpeed * 0.015, maxStretch);
        const scaleX = baseScale + stretch;
        const scaleY = baseScale - (stretch * 0.6);

        gsap.to(cursorCircle, {
          x: mouseX,
          y: mouseY,
          xPercent: -50,
          yPercent: -50,
          rotation: cursorAngle,
          scaleX: scaleX,
          scaleY: scaleY,
          duration: 0.25,
          overwrite: "auto"
        });
      }

      lastMouseX = mouseX;
      lastMouseY = mouseY;
    });
  }

  function setupCursorHoverHandlers() {
    const clickables = document.querySelectorAll('.clickable');
    clickables.forEach(elem => {
      elem.addEventListener('mouseenter', () => {
        if (cursorCircle) cursorCircle.classList.add('hovered');
        if (cursorDot) cursorDot.classList.add('hovered');
      });
      elem.addEventListener('mouseleave', () => {
        if (cursorCircle) cursorCircle.classList.remove('hovered');
        if (cursorDot) cursorDot.classList.remove('hovered');
      });
    });
  }

  // --- Core Innovation: Reactive Ambient Background (ScrollTrigger) ---
  function setupAmbientMutator() {
    const orb1 = document.getElementById('ambient-orb-1');
    const orb2 = document.getElementById('ambient-orb-2');
    const orb3 = document.getElementById('ambient-orb-3');

    if (!orb1 || !orb2 || !orb3 || typeof ScrollTrigger === 'undefined') return;

    // Configs for ambient orb properties across sections
    const states = {
      'hero-section': {
        orb1: { background: 'radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, transparent 70%)', top: '10%', left: '10%', scale: 1, opacity: 0.25 },
        orb2: { background: 'radial-gradient(circle, rgba(226, 232, 240, 0.15) 0%, transparent 70%)', top: '20%', right: '15%', scale: 1.2, opacity: 0.2 },
        orb3: { opacity: 0 }
      },
      'manifesto-section': {
        orb1: { background: 'radial-gradient(circle, rgba(159, 122, 234, 0.15) 0%, transparent 70%)', top: '30%', left: '20%', scale: 1.1, opacity: 0.25 },
        orb2: { background: 'radial-gradient(circle, rgba(66, 153, 225, 0.15) 0%, transparent 70%)', top: '15%', right: '30%', scale: 1.1, opacity: 0.2 },
        orb3: { opacity: 0 }
      },
      'arsenal-section': {
        orb1: { background: 'radial-gradient(circle, rgba(159, 122, 234, 0.25) 0%, transparent 70%)', top: '30%', left: '5%', scale: 1.2, opacity: 0.3 },
        orb2: { background: 'radial-gradient(circle, rgba(66, 153, 225, 0.25) 0%, transparent 70%)', top: '40%', right: '5%', scale: 1.2, opacity: 0.25 },
        orb3: { background: 'radial-gradient(circle, rgba(244, 63, 94, 0.2) 0%, transparent 70%)', top: '50%', left: '40%', scale: 1.0, opacity: 0.2 }
      },
      'vault-section': {
        orb1: { background: 'radial-gradient(circle, rgba(67, 56, 202, 0.25) 0%, transparent 70%)', top: '20%', left: '30%', scale: 1.3, opacity: 0.25 },
        orb2: { opacity: 0.05, top: '40%', right: '10%' },
        orb3: { opacity: 0.05, top: '50%', left: '10%' }
      },
      'velocity-section': {
        orb1: { background: 'radial-gradient(circle, rgba(0, 180, 255, 0.3) 0%, transparent 70%)', top: '15%', left: '20%', scale: 1.2, opacity: 0.3 },
        orb2: { background: 'radial-gradient(circle, rgba(52, 199, 89, 0.25) 0%, transparent 70%)', top: '50%', left: '60%', scale: 1.1, opacity: 0.25 },
        orb3: { opacity: 0 }
      },
      'sandbox-section': {
        orb1: { opacity: 0.02 },
        orb2: { opacity: 0.02 },
        orb3: { opacity: 0.02 }
      },
      'ironclad-section': {
        orb1: { background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)', top: '20%', left: '15%', scale: 1.1, opacity: 0.2 },
        orb2: { background: 'radial-gradient(circle, rgba(226, 232, 240, 0.1) 0%, transparent 70%)', top: '50%', right: '20%', scale: 1.0, opacity: 0.15 },
        orb3: { opacity: 0 }
      },
      'zenith-section': {
        orb1: { background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, transparent 60%)', top: '50%', left: '50%', scale: 1.2, opacity: 0.5, xPercent: -50, yPercent: -50 },
        orb2: { opacity: 0 },
        orb3: { opacity: 0 }
      }
    };

    Object.keys(states).forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const config = states[sectionId];

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => applyState(config),
        onEnterBack: () => applyState(config)
      });
    });

    function applyState(cfg) {
      if (cfg.orb1) gsap.to(orb1, { ...cfg.orb1, duration: 1.8, ease: "power2.out", overwrite: "auto" });
      if (cfg.orb2) gsap.to(orb2, { ...cfg.orb2, duration: 1.8, ease: "power2.out", overwrite: "auto" });
      if (cfg.orb3) gsap.to(orb3, { ...cfg.orb3, duration: 1.8, ease: "power2.out", overwrite: "auto" });
    }
  }

  // --- Glass Refraction Mouse Movements ---
  function setupHoverPhysics() {
    const liquidGlassElements = document.querySelectorAll('.liquid-glass');
    liquidGlassElements.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const offsetX = e.clientX - cardCenterX;
        const offsetY = e.clientY - cardCenterY;

        if (typeof gsap !== 'undefined') {
          gsap.to('#ambient-orb-1', { x: offsetX * 0.1, y: offsetY * 0.1, duration: 0.8, ease: "power2.out", overwrite: "auto" });
          gsap.to('#ambient-orb-2', { x: -offsetX * 0.08, y: -offsetY * 0.08, duration: 0.8, ease: "power2.out", overwrite: "auto" });
        }
      });

      card.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to('#ambient-orb-1', { x: 0, y: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" });
          gsap.to('#ambient-orb-2', { x: 0, y: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" });
        }
      });
    });
  }

  // --- 3D Bento Card Tilt Effect ---
  function setupBentoTilt() {
    const bentoCards = document.querySelectorAll('.bento-card');
    bentoCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const normX = (x / rect.width) - 0.5;
        const normY = (y / rect.height) - 0.5;
        
        const tiltX = -normY * 15;
        const tiltY = normX * 15;

        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '90%');
        card.style.setProperty('--mouse-y', '10%');

        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto"
          });
        }
      });
    });
  }

  // --- Word-By-Word Reveal (Manifesto Section) ---
  function setupWordReveal() {
    const textEl = document.getElementById('manifesto-text');
    if (textEl && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      const words = textEl.textContent.trim().split(/\s+/);
      textEl.innerHTML = words.map(w => `<span>${w}</span>`).join(' ');

      const spans = textEl.querySelectorAll('span');
      gsap.fromTo(spans,
        { opacity: 0.08 },
        {
          opacity: 1,
          stagger: 0.15,
          scrollTrigger: {
            trigger: '#manifesto-section',
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: true
          }
        }
      );
    }
  }

  // --- Edge Velocity Data Streaks Trigger ---
  function setupDataStreaks() {
    const velocitySection = document.getElementById('velocity-section');
    if (velocitySection && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: velocitySection,
        start: 'top 70%',
        onEnter: () => {
          document.querySelectorAll('.data-packet').forEach(p => p.classList.add('streak'));
        },
        onLeaveBack: () => {
          document.querySelectorAll('.data-packet').forEach(p => p.classList.remove('streak'));
        }
      });
    }
  }

  // --- Vitest Circle Coverage Trigger ---
  function setupVitestCoverage() {
    const ironcladSection = document.getElementById('ironclad-section');
    if (ironcladSection && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: ironcladSection,
        start: 'top 70%',
        onEnter: () => {
          const progressFill = document.querySelector('.progress-ring-fill');
          if (progressFill) {
            progressFill.style.strokeDashoffset = '0';
          }
        },
        onLeaveBack: () => {
          const progressFill = document.querySelector('.progress-ring-fill');
          if (progressFill) {
            progressFill.style.strokeDashoffset = '251.2';
          }
        }
      });
    }
  }

  // --- Sandbox Autotyping Terminal Simulation (PINS in viewport) ---
  function setupSandboxTyping() {
    const terminalScreen = document.getElementById('sandbox-terminal-screen');
    const isLandingPage = !window.location.pathname.includes('dashboard.html');
    
    if (terminalScreen && isLandingPage && typeof ScrollTrigger !== 'undefined') {
      const codePayloadText = `curl -X POST http://localhost:4000/llm/v1/chat \\
  -H "x-api-key: boss123" \\
  -d '{ "messages": [{"role": "user", "content": "Explain failover"}] }'

# [MOCK-INFO] OpenAI returned 429 rate limit. Key rotated...
# [MOCK-SUCCESS] Primary failed -> Gemini fallback active.
{
  "ok": true,
  "data": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "content": "Standby Gemini fallback responded in 204ms."
  }
}`;

      let typingTriggered = false;

      // Pin terminal section in viewport on scroll-in
      ScrollTrigger.create({
        trigger: '#sandbox-section',
        start: 'top 30%',
        end: '+=400',
        pin: true,
        pinSpacing: true,
        onEnter: () => {
          if (typingTriggered) return;
          typingTriggered = true;
          terminalScreen.innerHTML = '';
          
          let index = 0;
          function typeChar() {
            if (index < codePayloadText.length) {
              terminalScreen.textContent += codePayloadText.charAt(index);
              index++;
              
              if (index % 6 === 0 || index === codePayloadText.length) {
                if (typeof Prism !== 'undefined') {
                  Prism.highlightElement(terminalScreen);
                }
              }
              setTimeout(typeChar, 10);
            }
          }
          typeChar();
        }
      });
    }
  }

  // --- Real Sandbox Execution (Playground Panel) ---
  async function executeDashboardSandboxRequest() {
    const selectService = document.getElementById('select-playground-service');
    const endpointInput = document.getElementById('sandbox-endpoint');
    const apiKeyInput = document.getElementById('sandbox-api-key');
    const textareaBody = document.getElementById('sandbox-request-payload');
    const screen = document.getElementById('sandbox-terminal-screen');
    const statusVal = document.getElementById('val-sandbox-status');

    if (!endpointInput || !screen || !statusVal) return;

    const service = selectService ? selectService.value : 'llm';
    const endpoint = endpointInput.value;
    const apiKey = apiKeyInput ? apiKeyInput.value : '';
    const preset = servicesConfig[service];
    const method = preset ? preset.method : 'POST';

    let bodyPayload = null;
    try {
      if (textareaBody && textareaBody.value.trim() !== '') {
        bodyPayload = JSON.parse(textareaBody.value);
      }
    } catch (err) {
      statusVal.className = 'status-pill status-error';
      statusVal.innerText = 'JSON Error';
      screen.innerHTML = `[ERROR] Invalid JSON payload configuration:\n${err.message}\n\nPlease check JSON syntax before executing.`;
      return;
    }

    statusVal.className = 'status-pill status-online';
    statusVal.innerText = 'sending...';
    screen.innerHTML = `[INFO] Issuing actual request to: ${method} ${endpoint}\n`;
    screen.innerHTML += `[INFO] x-api-key: ${apiKey ? '••••' + apiKey.slice(-3) : 'None'}\n`;
    screen.innerHTML += `Connecting to server...\n\n`;

    appendDashboardTelemetryLog('info', `Console Trigger: ${method} ${endpoint}`);

    try {
      const fetchOptions = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (apiKey) {
        fetchOptions.headers['x-api-key'] = apiKey;
      }

      let finalEndpoint = endpoint;
      if (method === 'GET' && bodyPayload) {
        const queryParams = new URLSearchParams(bodyPayload).toString();
        finalEndpoint = `${endpoint}?${queryParams}`;
      } else if (method !== 'GET' && bodyPayload) {
        fetchOptions.body = JSON.stringify(bodyPayload);
      }

      const response = await fetch(finalEndpoint, fetchOptions);
      const data = await response.json();

      statusVal.innerText = `${response.status} ${response.statusText}`;
      if (response.ok) {
        statusVal.className = 'status-pill status-online';
        appendDashboardTelemetryLog('info', `Console Success: ${method} ${endpoint} -> ${response.status} OK`);
      } else {
        statusVal.className = 'status-pill status-error';
        appendDashboardTelemetryLog('error', `Console Error: ${method} ${endpoint} -> ${response.status} ${response.statusText}`);
      }

      screen.innerHTML = JSON.stringify(data, null, 2);
      if (typeof Prism !== 'undefined') {
        Prism.highlightElement(screen);
      }
      screen.scrollTop = screen.scrollHeight;
    } catch (error) {
      statusVal.className = 'status-pill status-error';
      statusVal.innerText = 'Network Fail';
      screen.innerHTML = `[NETWORK ERROR] Connection refused or timed out:\n${error.message}`;
      appendDashboardTelemetryLog('error', `Console Network Fail: ${method} ${endpoint} -> ${error.message}`);
    }
  }

  function applyPlaygroundServicePreset(serviceId) {
    const preset = servicesConfig[serviceId];
    const endpointInput = document.getElementById('sandbox-endpoint');
    const methodBadge = document.getElementById('console-method-badge');
    const textareaBody = document.getElementById('sandbox-request-payload');
    const screen = document.getElementById('sandbox-terminal-screen');
    const statusVal = document.getElementById('val-sandbox-status');

    if (!preset) return;

    if (endpointInput) endpointInput.value = preset.endpoint;
    if (methodBadge) {
      methodBadge.innerText = preset.method;
    }
    if (textareaBody) {
      textareaBody.value = JSON.stringify(preset.payload, null, 2);
    }
    if (screen) {
      screen.innerHTML = `// Ready to sandbox ${preset.name}.\n// Click 'EXECUTE REAL REQUEST' to query local Express API gateway.`;
    }
    if (statusVal) {
      statusVal.className = 'status-pill status-online';
      statusVal.innerText = 'idle';
    }
  }

  // --- Telemetry Log Stream ---
  const dashboardLogsScreen = document.getElementById('dashboard-logs-screen');

  function appendDashboardTelemetryLog(level, msg) {
    if (!dashboardLogsScreen || isLogsPaused) return;

    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry animate-fade-in';
    const levelClass = level === 'warn' ? 'level-warn' : level === 'error' ? 'level-error' : 'level-info';

    logDiv.innerHTML = `
      <span class="log-timestamp">${getTimestamp()}</span>
      <span class="log-level ${levelClass}">${level}</span>
      <span class="log-message">${escapeHtml(msg)}</span>
    `;

    dashboardLogsScreen.appendChild(logDiv);
    dashboardLogsScreen.scrollTop = dashboardLogsScreen.scrollHeight;

    if (dashboardLogsScreen.children.length > 50) {
      dashboardLogsScreen.removeChild(dashboardLogsScreen.firstChild);
    }
  }

  function initializeMockLogs() {
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * mockLogTemplates.length);
      const log = mockLogTemplates[idx];
      appendDashboardTelemetryLog(log.level, log.msg);
    }
  }

  // --- Gateway Health & Diagnostics Uptime Updates ---
  const healthStatusVal = document.getElementById('val-health-status');

  async function fetchServerDiagnostics() {
    try {
      const response = await fetch('/health');
      const data = await response.json();

      if (data.ok && data.data) {
        if (healthStatusVal) healthStatusVal.innerText = 'Healthy';
        const globalHealthPill = document.getElementById('global-health-pill');
        if (globalHealthPill) {
          globalHealthPill.className = 'status-pill status-online';
        }
        const valHealth = document.getElementById('val-health');
        if (valHealth) {
          valHealth.innerText = 'Healthy';
          valHealth.style.color = 'var(--success)';
        }

        if (data.data.uptime) {
          processUptimeSeconds = data.data.uptime;
        }

        populateActiveWrappersList();
      }
    } catch (err) {
      if (healthStatusVal) healthStatusVal.innerText = 'Degraded';
      const globalHealthPill = document.getElementById('global-health-pill');
      if (globalHealthPill) {
        globalHealthPill.className = 'status-pill status-error';
      }
      const valHealth = document.getElementById('val-health');
      if (valHealth) {
        valHealth.innerText = 'Degraded';
        valHealth.style.color = 'var(--error)';
      }
    }
  }

  function startUptimeCounter() {
    const globalUptime = document.getElementById('global-uptime-counter');
    const dashboardUptime = document.getElementById('val-dashboard-uptime');
    
    setInterval(() => {
      processUptimeSeconds++;
      const formatted = formatUptime(processUptimeSeconds);
      if (globalUptime) {
        globalUptime.innerText = `Uptime: ${formatted}`;
      }
      if (dashboardUptime) {
        dashboardUptime.innerText = formatted;
      }
    }, 1000);
  }

  function formatUptime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m ${secs}s`;
  }

  // --- Dynamic Wrappers Catalog Populator ---
  async function populateActiveWrappersList() {
    if (wrappersListPopulated) return;
    const servicesList = document.getElementById('dashboard-services-list');
    if (!servicesList) return;

    try {
      const response = await fetch('/wrappers');
      const data = await response.json();

      if (data.ok && data.data && data.data.wrappers) {
        servicesList.innerHTML = '';
        data.data.wrappers.forEach(w => {
          const row = document.createElement('div');
          row.className = 'service-row';
          row.innerHTML = `
            <div class="service-row-info">
              <div style="font-weight: 600; color: #fff;">${escapeHtml(w.name)} Wrapper</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(w.description)}</div>
            </div>
            <div class="service-status-pill status-online">
              <span class="status-dot"></span>
              ONLINE
            </div>
          `;
          servicesList.appendChild(row);
        });
        wrappersListPopulated = true;
      }
    } catch (err) {
      servicesList.innerHTML = `<div style="color: var(--error); font-size: 13px;">Failed to load wrappers catalog.</div>`;
    }
  }

  // --- Dynamic Key Rotation Pool ---
  const keysContainer = document.getElementById('dashboard-keys-pool');
  const activeKeysData = [
    { provider: 'OpenAI API Key (Primary LLM)', status: 'Active', mask: 'sk-proj-••••••••••••••••3dE9', prefix: 'sk-proj-' },
    { provider: 'Gemini API Key (Secondary Fallback)', status: 'Standby', mask: 'AIzaSy••••••••••••••••8wNq', prefix: 'AIzaSy' },
    { provider: 'Resend SMTP Mail API Key', status: 'Active', mask: 're_••••••••••••••••K2p9', prefix: 're_' }
  ];

  function renderKeysRotationPool() {
    if (!keysContainer) return;
    keysContainer.innerHTML = '';

    activeKeysData.forEach((k, index) => {
      const card = document.createElement('div');
      card.className = 'key-card';
      card.innerHTML = `
        <div class="key-card-header">
          <span class="key-title">${k.provider}</span>
          <span class="key-badge active">${k.status}</span>
        </div>
        <div class="key-value-container">
          <span class="key-value" id="key-value-${index}">${k.mask}</span>
          <button class="btn-icon clickable" id="btn-rotate-${index}" title="Rotate Key Now">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
        </div>
      `;
      keysContainer.appendChild(card);

      const rotateBtn = card.querySelector(`#btn-rotate-${index}`);
      const valSpan = card.querySelector(`#key-value-${index}`);
      const badgeSpan = card.querySelector(`.key-badge`);

      if (rotateBtn && valSpan && badgeSpan) {
        rotateBtn.addEventListener('click', () => {
          badgeSpan.innerText = 'Rotating...';
          badgeSpan.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
          badgeSpan.style.color = '#f59e0b';
          badgeSpan.style.borderColor = 'rgba(245, 158, 11, 0.15)';

          appendDashboardTelemetryLog('info', `Credential Pool: Rotating key for ${k.provider}`);

          setTimeout(() => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
            let suffix = '';
            for (let i = 0; i < 4; i++) {
              suffix += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            valSpan.innerText = `${k.prefix}••••••••••••••••${suffix}`;
            badgeSpan.innerText = k.status;
            badgeSpan.removeAttribute('style');
            appendDashboardTelemetryLog('info', `Credential Pool: Successfully rotated ${k.provider}. New config loaded.`);
          }, 1000);
        });
      }
    });

    setupCursorHoverHandlers();
  }

  // --- Initializer Routing ---
  window.addEventListener('DOMContentLoaded', () => {
    // Setup Lucide icons if available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const tabPanels = document.querySelectorAll('.dashboard-tab-panel');

    function switchTab(tabId) {
      sidebarItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
      });
      
      tabPanels.forEach(panel => {
        if (panel.id === `panel-${tabId}`) {
          panel.classList.add('active');
          panel.style.display = 'block';

          // Premium tab transitions using anime.js or GSAP
          if (typeof anime !== 'undefined') {
            anime({
              targets: panel.querySelectorAll('.animated-card, .dashboard-header, .console-viewport, .keys-grid-dashboard, .logs-panel-full'),
              opacity: [0, 1],
              translateY: [15, 0],
              duration: 600,
              delay: anime.stagger(60),
              easing: 'easeOutQuad'
            });
          } else if (typeof gsap !== 'undefined') {
            gsap.fromTo(panel.children,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }
            );
          }
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      });
    }

    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        switchTab(tabId);
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        window.history.pushState({}, '', url);
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const defaultTab = isDashboard ? 'overview' : 'home';
    const initialTab = urlParams.get('tab') || defaultTab;
    
    // Switch to initial tab if on dashboard
    if (isDashboard) {
      switchTab(initialTab);
    }

    // --- Interactive Bento cards mouse shifts ---
    const bentoCards = document.querySelectorAll('.bento-card');
    bentoCards.forEach(card => {
      card.addEventListener('click', () => {
        const serviceId = card.getAttribute('data-service');
        if (!serviceId) return;

        const selectPlaygroundService = document.getElementById('select-playground-service');
        if (selectPlaygroundService) {
          selectPlaygroundService.value = serviceId;
          applyPlaygroundServicePreset(serviceId);
          switchTab('playground');
        } else {
          window.location.href = `/dashboard.html?tab=playground&service=${serviceId}`;
        }
      });
    });

    // Populate service preset if service parameter exists in URL
    const serviceParam = urlParams.get('service');
    const selectPlaygroundService = document.getElementById('select-playground-service');
    if (selectPlaygroundService) {
      selectPlaygroundService.addEventListener('change', (e) => {
        applyPlaygroundServicePreset(e.target.value);
      });
      
      const activePresetId = serviceParam || selectPlaygroundService.value;
      selectPlaygroundService.value = activePresetId;
      applyPlaygroundServicePreset(activePresetId);
    }

    // --- Executer buttons ---
    const btnExecute = document.getElementById('btn-execute-sandbox');
    if (btnExecute) {
      btnExecute.addEventListener('click', executeDashboardSandboxRequest);
    }

    // --- Toggle Sandbox Key Visibility ---
    const toggleSandboxKeyBtn = document.getElementById('btn-toggle-sandbox-key');
    const sandboxApiKeyInput = document.getElementById('sandbox-api-key');
    if (toggleSandboxKeyBtn && sandboxApiKeyInput) {
      toggleSandboxKeyBtn.addEventListener('click', () => {
        const type = sandboxApiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        sandboxApiKeyInput.setAttribute('type', type);
      });
    }

    // --- Logs Console Actions ---
    const btnPauseLogs = document.getElementById('btn-dashboard-pause-logs');
    const btnClearLogs = document.getElementById('btn-dashboard-clear-logs');
    if (btnPauseLogs) {
      btnPauseLogs.addEventListener('click', () => {
        isLogsPaused = !isLogsPaused;
        btnPauseLogs.innerText = isLogsPaused ? 'Resume Stream' : 'Pause Stream';
        btnPauseLogs.classList.toggle('btn-accent', isLogsPaused);
      });
    }
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        if (dashboardLogsScreen) dashboardLogsScreen.innerHTML = '';
      });
    }

    // --- Copy Code Command on Landing Page ---
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const codeElement = document.querySelector('#sandbox-terminal-screen');
        if (codeElement) {
          const text = codeElement.innerText;
          navigator.clipboard.writeText(text).then(() => {
            btnCopyCode.setAttribute('title', 'Copied!');
            if (typeof lucide !== 'undefined') {
              btnCopyCode.innerHTML = '<i data-lucide="check" style="color: var(--success); width: 14px; height: 14px;"></i>';
              lucide.createIcons();
            }
            setTimeout(() => {
              btnCopyCode.setAttribute('title', 'Copy Command');
              if (typeof lucide !== 'undefined') {
                btnCopyCode.innerHTML = '<i data-lucide="copy" class="copy-icon" style="width: 14px; height: 14px;"></i>';
                lucide.createIcons();
              }
            }, 2000);
          });
        }
      });
    }

    // Run diagnostics, key pool, hover physics, tilt, text, typing, and timers
    fetchServerDiagnostics();
    renderKeysRotationPool();
    setupHoverPhysics();
    setupBentoTilt();
    setupWordReveal();
    setupDataStreaks();
    setupVitestCoverage();
    setupSandboxTyping();
    setupAmbientMutator();
    startUptimeCounter();

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

    if (isDashboard) {
      initializeMockLogs();
    }

    // --- 3D Parallax Speeds & Scroll Reveals using GSAP & ScrollTrigger ---
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // 3D Parallax Speeds
      gsap.utils.toArray('[data-speed]').forEach(el => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 1.0;
        const amount = (speed - 1) * 180; // Parallax vertical displacement multiplier

        gsap.to(el, {
          y: amount,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });

      // Staggered reveals for all section headers and cards
      const sectionsToReveal = [
        '.section-hero',
        '#manifesto-section',
        '#arsenal-section',
        '#vault-section',
        '#velocity-section',
        '#sandbox-section',
        '#ironclad-section',
        '#zenith-section'
      ];

      sectionsToReveal.forEach(sel => {
        const container = document.querySelector(sel);
        if (!container) return;

        gsap.fromTo(container.querySelectorAll('.reveal-elem'),
          { opacity: 0, y: 50, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: container,
              start: 'top 75%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    }

    // --- Lenis Hijack Smooth Scroll ---
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // Sync Server Diagnostics
    setInterval(fetchServerDiagnostics, 10000);

    // Mock logs loop
    setInterval(() => {
      if (Math.random() < 0.25) {
        const idx = Math.floor(Math.random() * mockLogTemplates.length);
        const log = mockLogTemplates[idx];
        appendDashboardTelemetryLog(log.level, log.msg);
      }
    }, 2000);

    setupCursorHoverHandlers();
  });
})();
