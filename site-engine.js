/**
 * Farhan Shujoy Portfolio - Dynamic Configuration & Customizer Engine
 * Connects the live website with admin.html, site-config.json, and localStorage
 */

(function () {
  'use strict';

  // State
  window._siteConfig = null;
  window._customTypewriterPhrases = null;

  // 1. Initial Load
  async function initConfigEngine() {
    let config = null;

    // Check localStorage first
    try {
      const localData = localStorage.getItem('site_config_data');
      if (localData) {
        config = JSON.parse(localData);
      }
    } catch (e) {
      console.warn('[ConfigEngine] localStorage parse error:', e);
    }

    // Fallback to site-config.json
    if (!config) {
      try {
        const res = await fetch('site-config.json');
        if (res.ok) {
          config = await res.json();
        }
      } catch (e) {
        console.warn('[ConfigEngine] Could not load site-config.json:', e);
      }
    }

    if (config) {
      window._siteConfig = config;
      applySiteConfig(config);
    }

    // Listen for live preview messages from admin.html
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SHUJOY_CONFIG_UPDATE') {
        applySiteConfig(event.data.config);
      }
    });

    // Listen for storage changes across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'site_config_data' && event.newValue) {
        try {
          const updated = JSON.parse(event.newValue);
          applySiteConfig(updated);
        } catch (e) {}
      }
    });

    // Secret Hotkey: Ctrl + Shift + A opens Private Admin Login Gate
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.open('thikase1/thikase2/admin/login.com', '_blank');
      }
    });
  }

  // 2. Apply Configuration to DOM & Styles
  function applySiteConfig(cfg) {
    if (!cfg) return;
    window._siteConfig = cfg;

    const root = document.documentElement;

    // A. THEME & COLORS
    if (cfg.theme) {
      const t = cfg.theme;
      if (t.primary) root.style.setProperty('--primary', t.primary);
      if (t.accentAmber) root.style.setProperty('--accent-amber', t.accentAmber);
      if (t.accentPurple) root.style.setProperty('--accent-purple', t.accentPurple);
      if (t.accentEmerald) root.style.setProperty('--accent-emerald', t.accentEmerald);
      if (t.bg) root.style.setProperty('--bg', t.bg);
      if (t.bgSurface) root.style.setProperty('--bg-surface', t.bgSurface);
      if (t.bgCard) root.style.setProperty('--bg-card', t.bgCard);
      if (t.border) root.style.setProperty('--border', t.border);
      if (t.borderHover) root.style.setProperty('--border-hover', t.borderHover);
      if (t.text) root.style.setProperty('--text', t.text);
      if (t.textMuted) root.style.setProperty('--text-muted', t.textMuted);
      if (t.textDim) root.style.setProperty('--text-dim', t.textDim);
      if (t.glowOrange) root.style.setProperty('--glow-orange', t.glowOrange);

      // Fonts
      if (t.fontHeading) {
        loadGoogleFontIfNeeded(t.fontHeading);
        root.style.setProperty('--font-heading', `'${t.fontHeading}', sans-serif`);
      }
      if (t.fontBody) {
        loadGoogleFontIfNeeded(t.fontBody);
        root.style.setProperty('--font-body', `'${t.fontBody}', sans-serif`);
      }
      if (t.fontAccent) {
        loadGoogleFontIfNeeded(t.fontAccent);
        root.style.setProperty('--font-accent', `'${t.fontAccent}', sans-serif`);
      }
    }

    // B. FOOTER STYLES
    if (cfg.footer) {
      const ft = cfg.footer;
      if (ft.bgColor) root.style.setProperty('--footer-bg', ft.bgColor);
      if (ft.textColor) root.style.setProperty('--footer-color', ft.textColor);
      if (ft.fontSize) root.style.setProperty('--footer-font-size', ft.fontSize);

      const copyEl = document.querySelector('.footer-copyright');
      if (copyEl && ft.copyright) {
        copyEl.textContent = ft.copyright;
      }
    }

    // C. META & TITLE
    if (cfg.meta) {
      if (cfg.meta.title) document.title = cfg.meta.title;
      if (cfg.meta.description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', cfg.meta.description);
      }
    }

    // D. HEADER & BRAND
    if (cfg.header) {
      const h = cfg.header;
      const titleTextEl = document.querySelector('.brand-logo .title-text');
      if (titleTextEl && h.brandFirstName && h.brandLastName) {
        titleTextEl.innerHTML = `${escapeHTML(h.brandFirstName)} <span>${escapeHTML(h.brandLastName)}</span>`;
      }

      // Nav CTA
      const fullCta = document.querySelector('.btn-collab-full');
      const shortCta = document.querySelector('.btn-collab-short');
      if (fullCta && h.ctaText) fullCta.textContent = h.ctaText;
      if (shortCta && h.ctaShortText) shortCta.textContent = h.ctaShortText;

      // Typewriter words
      if (Array.isArray(h.typewriterWords) && h.typewriterWords.length > 0) {
        window._customTypewriterPhrases = h.typewriterWords;
      }
    }

    // E. HERO SECTION
    if (cfg.hero) {
      const hr = cfg.hero;
      const titleMotion = document.querySelector('.title-motion');
      const titleLife = document.querySelector('.title-life');
      const subtitle = document.querySelector('.hero-subtitle');
      if (titleMotion && hr.titleLine1) titleMotion.textContent = hr.titleLine1;
      if (titleLife && hr.titleLine2) titleLife.textContent = hr.titleLine2;
      if (subtitle && hr.subtitle) {
        subtitle.innerHTML = hr.subtitle;
      }

      // Buttons
      const playReelBtn = document.querySelector('.btn-play-reel');
      if (playReelBtn && hr.btnReelText) {
        playReelBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          ${escapeHTML(hr.btnReelText)}
        `;
        if (hr.btnReelLink) playReelBtn.setAttribute('href', hr.btnReelLink);
      }

      const secondaryBtn = document.querySelector('.hero-cta-group .btn-secondary');
      if (secondaryBtn && hr.btnContactText) {
        secondaryBtn.textContent = hr.btnContactText;
        if (hr.btnContactLink) secondaryBtn.setAttribute('href', hr.btnContactLink);
      }

      // 3D SaaS Reels
      if (Array.isArray(hr.saasReels) && hr.saasReels.length > 0) {
        updateHeroReelsDOM(hr.saasReels);
      }
    }

    // F. BEFORE & AFTER SECTION
    if (cfg.beforeAfter) {
      const ba = cfg.beforeAfter;
      const section = document.getElementById('before-after');
      if (section) {
        const pill = section.querySelector('.section-pill');
        const h2 = section.querySelector('h2');
        const p = section.querySelector('.section-head p');
        if (pill && ba.pillText) pill.textContent = ba.pillText;
        if (h2 && ba.heading) h2.textContent = ba.heading;
        if (p && ba.description) p.textContent = ba.description;

        // Window Title & Subtitle
        const badgePill = section.querySelector('.ba-badge-pill');
        const windowTitleWrap = section.querySelector('.ba-window-title');
        if (badgePill && ba.badgeTitle) badgePill.textContent = ba.badgeTitle;
        if (windowTitleWrap && ba.badgeSubtitle) {
          windowTitleWrap.innerHTML = `
            <span class="ba-badge-pill">${escapeHTML(ba.badgeTitle || 'BEFORE / AFTER')}</span>
            <span>${escapeHTML(ba.badgeSubtitle)}</span>
          `;
        }

        // Video
        const baVideo = document.getElementById('beforeAfterVideo');
        if (baVideo && ba.videoUrl && baVideo.getAttribute('src') !== ba.videoUrl) {
          baVideo.setAttribute('src', ba.videoUrl);
          baVideo.load();
        }

        // 4 Pillars
        if (Array.isArray(ba.pillars)) {
          const cards = section.querySelectorAll('.ba-card-item');
          ba.pillars.forEach((pillar, idx) => {
            if (cards[idx]) {
              const iconEl = cards[idx].querySelector('.ba-card-icon');
              const titleEl = cards[idx].querySelector('.ba-card-title');
              const descEl = cards[idx].querySelector('.ba-card-desc');
              if (iconEl && pillar.icon) iconEl.textContent = pillar.icon;
              if (titleEl && pillar.title) titleEl.textContent = pillar.title;
              if (descEl && pillar.desc) descEl.textContent = pillar.desc;
            }
          });
        }
      }
    }

    // G. FEATURED PROJECTS CAROUSEL
    if (cfg.projects) {
      const pr = cfg.projects;
      const section = document.getElementById('projects');
      if (section) {
        const pill = section.querySelector('.section-pill');
        const h2 = section.querySelector('h2');
        const p = section.querySelector('.section-head p');
        if (pill && pr.pillText) pill.textContent = pr.pillText;
        if (h2 && pr.heading) h2.textContent = pr.heading;
        if (p && pr.description) p.textContent = pr.description;

        if (Array.isArray(pr.items) && pr.items.length > 0) {
          updateProjectsCarouselDOM(pr.items);
        }
      }
    }

    // H. EXPERIENCE SECTION
    if (cfg.experience) {
      const exp = cfg.experience;
      const section = document.getElementById('experience');
      if (section) {
        const pill = section.querySelector('.section-pill');
        const h2 = section.querySelector('h2');
        const p = section.querySelector('.section-head p');
        if (pill && exp.pillText) pill.textContent = exp.pillText;
        if (h2 && exp.heading) h2.textContent = exp.heading;
        if (p && exp.description) p.textContent = exp.description;

        if (Array.isArray(exp.items)) {
          updateExperienceDOM(exp.items);
        }
      }
    }

    // I. SKILLS SECTION
    if (cfg.skills) {
      const sk = cfg.skills;
      const section = document.getElementById('skills');
      if (section) {
        const pill = section.querySelector('.section-pill');
        const h2 = section.querySelector('h2');
        const p = section.querySelector('.section-head p');
        if (pill && sk.pillText) pill.textContent = sk.pillText;
        if (h2 && sk.heading) h2.textContent = sk.heading;
        if (p && sk.description) p.textContent = sk.description;

        if (Array.isArray(sk.software)) {
          const cards = section.querySelectorAll('.software-card');
          sk.software.forEach((item, idx) => {
            if (cards[idx]) {
              const badge = cards[idx].querySelector('.software-logo-badge');
              const h4 = cards[idx].querySelector('h4');
              const desc = cards[idx].querySelector('p');
              if (badge && item.abbr) badge.textContent = item.abbr;
              if (h4 && item.name) h4.textContent = item.name;
              if (desc && item.desc) desc.textContent = item.desc;
            }
          });
        }

        if (Array.isArray(sk.disciplines)) {
          const container = section.querySelector('.skills-tags-wrap');
          if (container) {
            container.innerHTML = sk.disciplines
              .map(tag => `<div class="discipline-tag">${escapeHTML(tag)}</div>`)
              .join('');
          }
        }
      }
    }

    // J. CONTACT SECTION
    if (cfg.contact) {
      const ct = cfg.contact;
      const section = document.getElementById('contact');
      if (section) {
        const h2 = section.querySelector('h2');
        const p = section.querySelector('.contact-card-main > p');
        if (h2 && ct.heading) h2.innerHTML = ct.heading;
        if (p && ct.subtitle) p.textContent = ct.subtitle;

        // Email Link & Copy Text
        const mailLink = section.querySelector('.link-email');
        if (mailLink && ct.emailLink) {
          mailLink.setAttribute('href', ct.emailLink);
        }

        const copyBtn = document.getElementById('copyEmailBtn');
        if (copyBtn && ct.email) {
          const span = copyBtn.querySelector('span');
          if (span) span.textContent = ct.email;
        }

        // LinkedIn
        const linkedinLink = section.querySelector('.link-linkedin');
        if (linkedinLink && ct.linkedin) {
          linkedinLink.setAttribute('href', ct.linkedin);
        }
      }
    }

    // K. SECTION VISIBILITY (Show/Hide)
    if (cfg.sectionsVisibility) {
      const secMap = {
        hero: document.getElementById('home') || document.querySelector('.hero-section'),
        beforeAfter: document.getElementById('before-after'),
        projects: document.getElementById('projects'),
        experience: document.getElementById('experience'),
        skills: document.getElementById('skills'),
        contact: document.getElementById('contact'),
        footer: document.querySelector('footer')
      };
      const navMap = {
        projects: document.querySelector('.nav-links a[href="#projects"]'),
        experience: document.querySelector('.nav-links a[href="#experience"]'),
        skills: document.querySelector('.nav-links a[href="#skills"]'),
        contact: document.querySelector('.nav-links a[href="#contact"]')
      };

      Object.entries(cfg.sectionsVisibility).forEach(([sec, isVis]) => {
        const el = secMap[sec];
        if (el) {
          if (isVis === false) {
            el.style.setProperty('display', 'none', 'important');
          } else {
            el.style.removeProperty('display');
          }
        }
        const navEl = navMap[sec];
        if (navEl) {
          if (isVis === false) {
            navEl.style.setProperty('display', 'none', 'important');
          } else {
            navEl.style.removeProperty('display');
          }
        }
      });
    }

    // L. SECTION ORDER (Drag & Drop Reordering)
    if (Array.isArray(cfg.sectionOrder) && cfg.sectionOrder.length > 0) {
      const secMap = {
        hero: document.getElementById('home') || document.querySelector('.hero-section'),
        beforeAfter: document.getElementById('before-after'),
        projects: document.getElementById('projects'),
        experience: document.getElementById('experience'),
        skills: document.getElementById('skills'),
        contact: document.getElementById('contact')
      };
      const main = document.querySelector('main');
      if (main) {
        cfg.sectionOrder.forEach(secKey => {
          const el = secMap[secKey];
          if (el && el.parentNode === main) {
            main.appendChild(el);
          }
        });
      }
    }
  }

  // Update Experience Timeline DOM
  function updateExperienceDOM(items) {
    const container = document.querySelector('.experience-timeline');
    if (!container || !Array.isArray(items)) return;

    const cards = container.querySelectorAll('.exp-card');
    if (cards.length === items.length) {
      // In-place update preserving DOM nodes and IntersectionObserver in-view state
      items.forEach((item, idx) => {
        const card = cards[idx];
        if (!card) return;

        const iconEl = card.querySelector('.fallback-letter');
        const roleEl = card.querySelector('.exp-role');
        const compEl = card.querySelector('.exp-company');
        const badgeEl = card.querySelector('.exp-badge');
        const metaEl = card.querySelector('.exp-meta');
        const descEl = card.querySelector('.exp-desc');
        const skillsEl = card.querySelector('.exp-skills-pill');

        if (iconEl && item.icon) iconEl.textContent = item.icon;
        if (roleEl && item.role) roleEl.textContent = item.role;
        if (compEl && item.company) compEl.textContent = item.company;
        if (badgeEl && item.badge) badgeEl.textContent = item.badge;
        if (metaEl && (item.date || item.location)) {
          metaEl.innerHTML = `<span>${escapeHTML(item.date || '')}</span><span>${escapeHTML(item.location || '')}</span>`;
        }
        if (descEl && item.desc) descEl.textContent = item.desc;
        if (skillsEl && Array.isArray(item.skills)) {
          skillsEl.innerHTML = item.skills.map(s => `<span>${escapeHTML(s)}</span>`).join('');
        }
      });
    } else {
      // Rebuild with in-view class to ensure visibility
      container.innerHTML = items.map((item, idx) => `
        <div class="exp-card reveal in-view reveal-${idx % 2 === 0 ? 'right' : 'left'} delay-${(idx % 3) + 1}">
          <div class="exp-icon-box">
            <span class="fallback-letter">${item.icon || '🎬'}</span>
          </div>
          <div class="exp-content">
            <div class="exp-header">
              <div>
                <h3 class="exp-role">${escapeHTML(item.role || '')}</h3>
                <div class="exp-company">${escapeHTML(item.company || '')}</div>
              </div>
              <span class="exp-badge">${escapeHTML(item.badge || 'Present')}</span>
            </div>
            <div class="exp-meta">
              <span>${escapeHTML(item.date || '')}</span>
              <span>${escapeHTML(item.location || '')}</span>
            </div>
            <p class="exp-desc">${escapeHTML(item.desc || '')}</p>
            <div class="exp-skills-pill">
              ${(item.skills || []).map(s => `<span>${escapeHTML(s)}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');

      if (window.reobserveRevealItems) {
        window.reobserveRevealItems();
      }
    }
  }

  // Update Projects Carousel DOM
  function updateProjectsCarouselDOM(items) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // Check if count or contents changed
    const currentCards = track.querySelectorAll('.video-card');
    if (currentCards.length === items.length) {
      // Just update attributes to preserve play state
      items.forEach((item, idx) => {
        const card = currentCards[idx];
        if (!card) return;

        // Aspect
        card.classList.remove('is-landscape', 'is-portrait');
        card.classList.add(item.aspect === 'portrait' ? 'is-portrait' : 'is-landscape');

        // Video
        const vid = card.querySelector('video');
        if (vid && item.videoUrl && vid.getAttribute('src') !== item.videoUrl) {
          vid.setAttribute('src', item.videoUrl);
          vid.load();
        }

        // Badge
        const badge = card.querySelector('.video-badge');
        if (badge && item.badge) badge.textContent = item.badge;

        // Title & Subtitle
        const title = card.querySelector('.video-card-info h3');
        const subtitle = card.querySelector('.video-card-info span');
        const tag = card.querySelector('.card-tag');
        if (title && item.title) title.textContent = item.title;
        if (subtitle && item.subtitle) subtitle.textContent = item.subtitle;
        if (tag && item.tag) tag.textContent = item.tag;
      });
    } else {
      // Re-render track items
      track.innerHTML = items.map((item, idx) => `
        <div class="video-card ${idx === 0 ? 'active' : ''} ${item.aspect === 'portrait' ? 'is-portrait' : 'is-landscape'}" data-index="${idx}">
          <div class="video-frame">
            <video src="${escapeHTML(item.videoUrl || '')}" playsinline muted preload="metadata"></video>
            <div class="video-overlay-controls">
              <div class="top-controls">
                <span class="video-badge">${escapeHTML(item.badge || 'Featured Cut')}</span>
                <button class="sound-toggle-btn" aria-label="Toggle Audio">🔊 Unmute</button>
              </div>
              <div class="center-play-trigger" title="Play / Pause">▶</div>
              <div class="bottom-timeline-scrub">
                <div class="video-progress-bar"><div class="video-progress-fill"></div></div>
              </div>
            </div>
          </div>
          <div class="video-card-info">
            <div>
              <h3>${escapeHTML(item.title || '')}</h3>
              <span>${escapeHTML(item.subtitle || '')}</span>
            </div>
            <div class="card-tag">${escapeHTML(item.tag || '')}</div>
          </div>
        </div>
      `).join('');

      // Dispatch event for carousel re-bind if needed
      window.dispatchEvent(new CustomEvent('shujoy_carousel_rebuild'));
    }
  }

  // Update Hero 3D SaaS Reels DOM
  function updateHeroReelsDOM(reels) {
    const stage = document.getElementById('saas3DStage') || document.querySelector('.saas-3d-stage');
    const dotsWrap = document.getElementById('saasDots');
    if (!stage || !Array.isArray(reels) || reels.length === 0) return;

    const existingCards = stage.querySelectorAll('.saas-card');
    if (existingCards.length === reels.length) {
      reels.forEach((reel, idx) => {
        const card = existingCards[idx];
        const vid = card.querySelector('video');
        if (vid && reel.videoUrl && vid.getAttribute('src') !== reel.videoUrl) {
          vid.setAttribute('src', reel.videoUrl);
          vid.load();
        }
      });
      return;
    }

    // Reconstruct cards & dots if count changed
    stage.innerHTML = '';
    reels.forEach((reel, idx) => {
      const card = document.createElement('div');
      card.className = `saas-card ${idx === 0 ? 'is-active' : idx === 1 ? 'is-right' : 'is-left'}`;
      card.dataset.index = idx;
      card.id = `saasCard${idx}`;
      card.innerHTML = `
        <div class="saas-card-inner">
          <div class="saas-card-notch">
            <button class="hero-sound-btn" aria-label="Toggle Sound" title="Sound Mute/Unmute">
              <svg class="icon-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              <svg class="icon-unmute" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            </button>
          </div>
          <video class="saas-card-video" playsinline muted preload="metadata" src="${escapeHTML(reel.videoUrl || '')}"></video>
          <div class="saas-card-timeline"><div class="saas-timeline-fill"></div></div>
        </div>
      `;
      stage.appendChild(card);
    });

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      reels.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `saas-dot ${idx === 0 ? 'active' : ''}`;
        dot.dataset.index = idx;
        dot.setAttribute('aria-label', `Go to Reel ${idx + 1}`);
        dotsWrap.appendChild(dot);
      });
    }

    if (typeof window._refreshSaasCarousel === 'function') {
      window._refreshSaasCarousel();
    }
  }

  // Google Fonts Dynamically Injected
  const loadedFonts = new Set(['Outfit', 'Plus Jakarta Sans', 'Space Grotesk']);
  function loadGoogleFontIfNeeded(fontName) {
    if (!fontName || loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }

  function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose global method
  window.applySiteConfig = applySiteConfig;

  // Initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfigEngine);
  } else {
    initConfigEngine();
  }
})();
