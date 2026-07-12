const fs = require('fs');

// 1. Process style.css
let css = fs.readFileSync('public/style.css', 'utf8');

// Inject variables at the end of :root
css = css.replace(/:root\s*\{([\s\S]*?)\}/, (match, inner) => {
  return `:root {${inner}
  /* Apple Spring Physics */
  --spring-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.15);
  --spring-fluid: cubic-bezier(0.25, 1, 0.5, 1);
  --spring-snappy: cubic-bezier(0.85, 0, 0.15, 1);
}`;
});

// Replace all 'ease', 'ease-in-out', 'linear' in transitions with var(--spring-fluid) globally
// This is a bit brute force but matches the "eradicate linear/ease" requirement
css = css.replace(/transition:\s*([^;]+);/g, (match, p1) => {
  let newTrans = p1.replace(/\bease-in-out\b|\bease-out\b|\bease-in\b|\bease\b|\blinear\b/g, 'var(--spring-fluid)');
  return `transition: ${newTrans};`;
});

// Update .btn-precision for squishy bounce
css = css.replace(/\.btn-precision\s*\{([\s\S]*?)\}/, (match, inner) => {
  return `.btn-precision {${inner}
  transform: scale(1);
  transition: transform 0.4s var(--spring-bounce), background-color 0.4s var(--spring-fluid), box-shadow 0.4s var(--spring-fluid);
  will-change: transform;
}`;
});
css = css.replace(/\.btn-precision:active\s*\{([\s\S]*?)\}/, (match, inner) => {
  return `.btn-precision:active {${inner}\n  transform: scale(0.92);\n}`;
});
if (!css.includes('.btn-precision:active')) {
  css += `\n.btn-precision:active { transform: scale(0.92); }\n`;
}

// Update .bento-card for floating lift
css = css.replace(/\.bento-card:hover\s*\{([\s\S]*?)\}/, (match, inner) => {
  return `.bento-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2);
}`;
});
if (!css.includes('.bento-card:hover')) {
  css += `\n.bento-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2); }\n`;
}

// Add iPadOS cursor CSS and hide default cursor
if (!css.includes('body { cursor: none; }')) {
  css = css.replace(/body\s*\{/, "body {\n  cursor: none;\n");
}
css += `
/* Custom iPadOS Magnetic Cursor */
.ipad-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  background-color: rgba(134, 134, 139, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 10000;
  will-change: transform, width, height, border-radius, background-color;
  transform-origin: top left;
  transition: width 0.3s var(--spring-fluid), height 0.3s var(--spring-fluid), background-color 0.3s var(--spring-fluid), border-radius 0.3s var(--spring-fluid);
}
`;

fs.writeFileSync('public/style.css', css);

// 2. Process app.js
let js = fs.readFileSync('public/app.js', 'utf8');

// Replace all standard GSAP easings
js = js.replace(/ease:\s*["'](?:power[1-4]\.(?:in|out|inOut)|ease(?:In|Out|InOut)|linear|none)["']/g, 'ease: "expo.out"');
js = js.replace(/ease:\s*["']back\.(?:in|out|inOut)\([^)]+\)["']/g, 'ease: "back.out(1.2)"');

// Inject iPadOS cursor logic
const cursorJs = `
  // --- iPadOS Magnetic Cursor ---
  const ipadCursor = document.getElementById('ipad-cursor');
  if (ipadCursor) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!ipadCursor.classList.contains('is-magnetic')) {
        gsap.to(ipadCursor, {
          x: mouseX - 7.5,
          y: mouseY - 7.5,
          duration: 0.15,
          ease: "expo.out",
          overwrite: "auto"
        });
      }
    });

    const magneticElements = document.querySelectorAll('.magnetic, .btn-precision, .bento-card');
    
    magneticElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        ipadCursor.classList.add('is-magnetic');
        const rect = el.getBoundingClientRect();
        gsap.to(ipadCursor, {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          borderRadius: window.getComputedStyle(el).borderRadius || '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          duration: 0.3,
          ease: "expo.out",
          overwrite: "auto"
        });
      });
      
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;
        const diffX = (e.clientX - elCenterX) / (rect.width / 2);
        const diffY = (e.clientY - elCenterY) / (rect.height / 2);
        gsap.to(el, {
          x: diffX * 10,
          y: diffY * 10,
          duration: 0.3,
          ease: "expo.out",
          overwrite: "auto"
        });
      });

      el.addEventListener('mouseleave', () => {
        ipadCursor.classList.remove('is-magnetic');
        gsap.to(ipadCursor, {
          width: 15,
          height: 15,
          borderRadius: "50%",
          backgroundColor: 'rgba(134, 134, 139, 0.8)',
          duration: 0.3,
          ease: "expo.out",
          overwrite: "auto"
        });
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "back.out(1.2)",
          overwrite: "auto"
        });
      });
    });
  }
`;

js = js.replace(/\}\)\(\);\s*$/, cursorJs + '\n})();\n');

// Also need to remove the old Custom Cursor block from app.js to prevent double logic
js = js.replace(/\/\/ --- Custom Fluid Cursor with Velocity Stretching ---[\s\S]*?\/\/ --- OGL-based WebGL SideRays Background Shader ---/, '// --- OGL-based WebGL SideRays Background Shader ---');

fs.writeFileSync('public/app.js', js);

// 3. Process index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace old cursor with new one
html = html.replace(/<div id="custom-cursor"><\/div>\s*<div id="custom-cursor-dot"><\/div>/, '<div class="ipad-cursor" id="ipad-cursor"></div>');

// Ensure buttons and bento cards have magnetic class (or just use CSS selectors in JS like we did above)

fs.writeFileSync('public/index.html', html);

console.log('Physics applied successfully!');
