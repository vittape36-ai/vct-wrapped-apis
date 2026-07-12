const fs = require('fs');

// --- 1. Update style.css ---
let css = fs.readFileSync('public/style.css', 'utf8');

const magicUiStyles = `
/* ========================================= */
/* MAGIC UI TERMINAL REPLICA                 */
/* ========================================= */
#typed-code-target {
  display: grid;
  gap: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: -0.015em;
  overflow: auto;
}

.terminal-line {
  display: block;
  opacity: 0;
  transform: translateY(-5px);
  will-change: opacity, transform;
}

.terminal-line-typed {
  display: block;
}

/* ========================================= */
/* MAGIC UI PROGRESSIVE BLUR REPLICA         */
/* ========================================= */
.progressive-blur-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8rem;
  z-index: 40;
  pointer-events: none;
  backdrop-filter: blur(12px);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 50%, black 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 50%, black 100%);
}
`;

if (!css.includes('MAGIC UI TERMINAL REPLICA')) {
  css += magicUiStyles;
  fs.writeFileSync('public/style.css', css);
}

// --- 2. Update index.html ---
let html = fs.readFileSync('public/index.html', 'utf8');

// Add Progressive Blur right before floating dock
if (!html.includes('progressive-blur-bottom')) {
  html = html.replace(/<!-- APPLE STYLE FLOATING DOCK NAVBAR -->/, `<!-- Progressive Blur for Floating Dock -->
    <div class="progressive-blur-bottom"></div>
    
    <!-- APPLE STYLE FLOATING DOCK NAVBAR -->`);
  fs.writeFileSync('public/index.html', html);
}

// --- 3. Update app.js ---
let js = fs.readFileSync('public/app.js', 'utf8');

// Replace the old runCodeTyper with the Magic UI Sequencer
js = js.replace(/const runCodeTyper = \(\) => \{[\s\S]*?\}, 12\);\s*\};\s*/, `
  const runCodeTyper = () => {
    if (hasTyped) return;
    hasTyped = true;

    typedCodeTarget.innerHTML = ''; 
    const lines = codeSnippet.split('\\n');
    let delayQueue = 0;

    lines.forEach((lineText, index) => {
      const lineSpan = document.createElement('span');
      typedCodeTarget.appendChild(lineSpan);

      // Magic UI Logic: definitions fade in (AnimatedSpan), execution types out (TypingAnimation)
      if (lineText.trim() === '' || lineText.startsWith('import') || lineText.startsWith('const') || lineText.startsWith('  ') || lineText.startsWith('}')) {
        // AnimatedSpan Replica
        lineSpan.className = 'terminal-line';
        lineSpan.innerHTML = Prism.highlight(lineText, Prism.languages.javascript, 'javascript');
        
        gsap.to(lineSpan, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          delay: delayQueue,
          ease: "power2.out"
        });
        delayQueue += 0.15; // Wait 150ms before next line
      } else {
        // TypingAnimation Replica
        lineSpan.className = 'terminal-line-typed';
        let typedText = '';
        let i = 0;
        
        gsap.delayedCall(delayQueue, () => {
          const typeInterval = setInterval(() => {
            if (i < lineText.length) {
              typedText += lineText.charAt(i);
              lineSpan.innerHTML = Prism.highlight(typedText, Prism.languages.javascript, 'javascript');
              i++;
            } else {
              clearInterval(typeInterval);
            }
          }, 30); // 30ms per char (Magic UI default is 60, but 30 looks smoother)
        });
        
        delayQueue += (lineText.length * 0.03) + 0.2; 
      }
    });
  };
`);

fs.writeFileSync('public/app.js', js);
console.log('Magic UI replicas injected successfully!');
