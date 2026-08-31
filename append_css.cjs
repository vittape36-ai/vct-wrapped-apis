const fs = require('fs');

const cssToAppend = `
/* ==========================================================================
   Light Theme Override
   ========================================================================== */
body.light-theme {
  --bg-dark: #f8fafc;
  --card-glass: rgba(255, 255, 255, 0.7);
  --card-glass-hover: rgba(255, 255, 255, 0.9);
  
  --text-primary: #0f172a;
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.45);

  --glow-ambient: rgba(255, 140, 0, 0.1);
}

body.light-theme .precision-card, 
body.light-theme .effect-thick-glass, 
body.light-theme .effect-soft-clay {
  background: var(--card-glass);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
}

body.light-theme .precision-card::after,
body.light-theme .effect-thick-glass,
body.light-theme .effect-soft-clay {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.02) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

body.light-theme .section-title {
  background: linear-gradient(180deg, #0f172a 0%, rgba(15, 23, 42, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

body.light-theme .hero-title {
  background: linear-gradient(180deg, #0f172a 30%, rgba(15, 23, 42, 0.5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ==========================================================================
   Mobile Optimization (@media queries)
   ========================================================================== */
@media (max-width: 992px) {
  .container {
    padding: 0 16px;
  }
  .hero-title {
    font-size: 42px;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-wide {
    grid-column: span 2;
  }
  .playground-layout {
    flex-direction: column;
  }
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-wrapper {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }
  .hero-subtitle {
    font-size: 14px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-wide, .bento-square {
    grid-column: span 1;
  }
  .bento-split-layout {
    flex-direction: column;
  }
  .bento-visual {
    margin-top: 20px;
    height: 150px;
  }
  .floating-dock-wrapper {
    overflow-x: auto;
    padding-bottom: 20px;
  }
  .floating-dock {
    width: max-content;
    padding: 12px;
  }
  .dock-tooltip {
    display: none !important;
  }
  .hero-ctas {
    flex-direction: column;
  }
  .btn-precision {
    width: 100%;
  }
  .vertical-pipeline-wrapper .pipeline-step {
    width: 100%;
    margin-left: 40px !important;
    text-align: left;
  }
  .svg-container {
    left: 20px;
  }
  
  /* Dashboard specific overrides */
  .dashboard-wrapper {
    flex-direction: column;
    padding-bottom: 80px; /* space for bottom nav */
  }
  .floating-sidebar-capsule {
    position: fixed !important;
    bottom: 10px !important;
    left: 10px !important;
    right: 10px !important;
    top: auto !important;
    width: calc(100% - 20px) !important;
    height: 70px !important;
    flex-direction: row !important;
    justify-content: space-around !important;
    align-items: center !important;
    padding: 10px !important;
    z-index: 1000 !important;
  }
  .sidebar-logo, .sidebar-avatar {
    display: none !important;
  }
  .sidebar-nav-icons {
    flex-direction: row !important;
    width: 100% !important;
    justify-content: space-around !important;
    margin: 0 !important;
  }
  .sidebar-nav-icons .nav-icon-link {
    margin: 0 !important;
  }
  .dashboard-content {
    margin-left: 0 !important;
    padding: 10px !important;
  }
  .bento-dashboard-grid {
    grid-template-columns: 1fr !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .console-viewport .viewport-body {
    flex-direction: column !important;
    display: flex !important;
  }
  .panel-editor, .panel-terminal {
    width: 100% !important;
    border-right: none !important;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .keys-grid-dashboard {
    flex-direction: column !important;
    display: flex !important;
  }
  .status-grid {
    grid-template-columns: 1fr !important;
  }
}
`;

fs.appendFileSync('public/style.css', cssToAppend);
console.log('Appended CSS successfully.');
