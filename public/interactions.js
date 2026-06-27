(function() {
  // Ensure GSAP is loaded before executing bindings
  if (typeof gsap === 'undefined') {
    console.warn('GSAP is not loaded. Interactions script requires GSAP to be present.');
    return;
  }

  // --- 1. The Clay Press (.effect-soft-clay) ---
  const clayElements = document.querySelectorAll('.effect-soft-clay');
  clayElements.forEach(el => {
    el.addEventListener('mousedown', () => {
      gsap.to(el, {
        scale: 0.95,
        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.05), 2px 2px 4px rgba(0,0,0,0.2) !important',
        duration: 0.1,
        ease: 'power2.out'
      });
    });
    
    const releaseSpring = () => {
      gsap.to(el, {
        scale: 1,
        boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.08), inset -3px -3px 6px rgba(0, 0, 0, 0.4), 6px 6px 12px rgba(0, 0, 0, 0.3) !important',
        duration: 0.5,
        ease: 'back.out(1.5)'
      });
    };

    el.addEventListener('mouseup', releaseSpring);
    el.addEventListener('mouseleave', releaseSpring);
  });

  // --- 2. The Spatial Tilt (.effect-thick-glass) ---
  const glassPanels = document.querySelectorAll('.effect-thick-glass');
  glassPanels.forEach(panel => {
    panel.addEventListener('mousemove', e => {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const normX = (x / w) - 0.5; // -0.5 to 0.5
      const normY = (y / h) - 0.5; // -0.5 to 0.5
      
      const maxTilt = 3; // max 3 degrees rotation
      
      gsap.to(panel, {
        rotateX: -normY * maxTilt,
        rotateY: normX * maxTilt,
        transformPerspective: 1000,
        borderColor: 'rgba(255, 255, 255, 0.12)', // Subtle highlight border glow
        duration: 0.3,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });

    panel.addEventListener('mouseleave', () => {
      gsap.to(panel, {
        rotateX: 0,
        rotateY: 0,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        duration: 0.6,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      });
    });
  });

  // --- 3. The Sibling Dim (.effect-dim-siblings) ---
  const dimElements = document.querySelectorAll('.effect-dim-siblings');
  dimElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      dimElements.forEach(item => {
        if (item === el) {
          gsap.to(item, {
            opacity: 1,
            scale: 1.02, // slightly scale up hovered item
            duration: 0.4,
            ease: 'power3.out',
            overwrite: 'auto'
          });
        } else {
          gsap.to(item, {
            opacity: 0.4,
            scale: 0.98,
            duration: 0.4,
            ease: 'power3.out',
            overwrite: 'auto'
          });
        }
      });
    });

    el.addEventListener('mouseleave', () => {
      dimElements.forEach(item => {
        gsap.to(item, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      });
    });
  });
})();
