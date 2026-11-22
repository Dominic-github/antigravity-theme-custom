(() => {
  if (typeof window !== 'undefined' && window.self !== window.top) return;

  const THEMES = /*__THEMES_PLACEHOLDER__*/{};
  if (THEMES['Railway Horizon']) {
    THEMES['Railway Horizon (Dynamic)'] = THEMES['Railway Horizon'];
  }
  const THEME_KEYS = Object.keys(THEMES);
  const PUBLIC_THEME_KEYS = THEME_KEYS.filter(name => !THEMES[name]?.isInternal && name !== 'Railway Horizon (Dynamic)');
  const DEFAULT_THEME_KEY = THEMES['Railway Horizon'] ? 'Railway Horizon' : (THEME_KEYS[0] || 'Default');

  function isHourDaytime(h, startHour, endHour) {
    const s = (startHour !== undefined && !isNaN(startHour)) ? startHour : 6;
    const e = (endHour !== undefined && !isNaN(endHour)) ? endHour : 16;
    if (s < e) {
      return h >= s && h < e;
    } else {
      return h >= s || h < e;
    }
  }

  function resolveTheme(name, optSt) {
    let th = THEMES[name] || THEMES[DEFAULT_THEME_KEY];
    if (th && th.isDynamic) {
      const st = optSt || getState();
      const h = new Date().getHours();
      const s = st && st.dynamicStart !== undefined ? st.dynamicStart : (th.dayStart ?? 6);
      const e = st && st.dynamicEnd !== undefined ? st.dynamicEnd : (th.dayEnd ?? 16);
      const isDay = isHourDaytime(h, s, e);
      const targetName = isDay ? th.dayTheme : th.nightTheme;
      th = THEMES[targetName] || th;
    }
    return th;
  }

  function getDynamicSubThemeName(name, optSt) {
    const th = THEMES[name];
    if (!th || !th.isDynamic) return name;
    const st = optSt || getState();
    const h = new Date().getHours();
    const s = st && st.dynamicStart !== undefined ? st.dynamicStart : (th.dayStart ?? 6);
    const e = st && st.dynamicEnd !== undefined ? st.dynamicEnd : (th.dayEnd ?? 16);
    const isDay = isHourDaytime(h, s, e);
    return isDay ? th.dayTheme : th.nightTheme;
  }

  const STORAGE_THEME = 'agy_theme_v3';
  const STORAGE_BUBBLE = 'agy_bubble_v3';
  const STORAGE_INPUT = 'agy_input_v3';
  const STORAGE_DIMMING = 'agy_dimming_v3';
  const STORAGE_WP_ENABLED = 'agy_wp_enabled_v3';
  const STORAGE_CUSTOM_WP = 'agy_custom_wp_v3';
  const STORAGE_USER_AVATAR = 'agy_user_avatar_v3';
  const STORAGE_AGENT_AVATAR = 'agy_agent_avatar_v3';
  const STORAGE_GLASS_BLUR = 'agy_glass_blur_v3';
  const STORAGE_AVATAR_SIZE = 'agy_avatar_size_v3';
  const STORAGE_AVATAR_RADIUS = 'agy_avatar_radius_v3';
  const STORAGE_LEAVES = 'agy_leaves_enabled_v3';
  const STORAGE_DYNAMIC_START = 'agy_dynamic_start_v3';
  const STORAGE_DYNAMIC_END = 'agy_dynamic_end_v3';
  const STORAGE_PARTICLE_TYPE = 'agy_particle_type_v3';
  const STORAGE_PARTICLE_COUNT = 'agy_particle_count_v3';
  const STORAGE_PARTICLE_SPEED = 'agy_particle_speed_v3';

  let _lastSw = -1;
  let _lastHdrBottom = -1;
  let _lastHoleClip = '';
  let _lastSideDims = '';

  const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const INPUT_STYLES = {
    'sync': {
      label: 'Synced Ornament Frame',
      desc: 'Follows the active theme borders & decorative SVG ornament'
    },
    'double_gold': {
      label: 'Amber Gold Double Border',
      desc: 'Warm metallic double border with corner filigree'
    },
    'glass': {
      label: 'Translucent Crystal Glass',
      desc: 'Lets more of your background artwork shine through'
    },
    'minimal': {
      label: 'Minimal Clean',
      desc: 'Sleek subtle border without top decorative stickers'
    }
  };

  function getState() {
    const init = window.__AGY_INITIAL_CONFIG__ || {};
    const localTheme = localStorage.getItem(STORAGE_THEME);
    const rawTheme = (localTheme && THEMES[localTheme])
      ? localTheme
      : (init.themeName && THEMES[init.themeName] ? init.themeName : (THEMES['Railway Horizon'] ? 'Railway Horizon' : (THEMES['Crimson Horizon'] ? 'Crimson Horizon' : DEFAULT_THEME_KEY)));
    const themeName = THEMES[rawTheme] ? rawTheme : DEFAULT_THEME_KEY;

    const localBubble = localStorage.getItem(STORAGE_BUBBLE);
    const rawBubble = (localBubble && THEMES[localBubble])
      ? localBubble
      : (init.bubbleName && THEMES[init.bubbleName] ? init.bubbleName : themeName);
    const bubbleName = THEMES[rawBubble] ? rawBubble : themeName;

    const inputStyle = localStorage.getItem(STORAGE_INPUT) || init.inputStyle || 'sync';
    const dimming = parseInt(localStorage.getItem(STORAGE_DIMMING) !== null ? localStorage.getItem(STORAGE_DIMMING) : (init.dimming !== undefined ? init.dimming : '69'), 10);
    const wpEnabled = localStorage.getItem(STORAGE_WP_ENABLED) !== null
      ? localStorage.getItem(STORAGE_WP_ENABLED) !== 'false'
      : (init.wpEnabled !== undefined ? init.wpEnabled : true);
    const customWp = localStorage.getItem(STORAGE_CUSTOM_WP) !== null ? localStorage.getItem(STORAGE_CUSTOM_WP) : (init.customWp || '');
    const userAvatar = localStorage.getItem(STORAGE_USER_AVATAR) ?? init.userAvatar ?? '';
    const agentAvatar = localStorage.getItem(STORAGE_AGENT_AVATAR) ?? init.agentAvatar ?? '';
    const rawBlur = localStorage.getItem(STORAGE_GLASS_BLUR) ?? init.glassBlur;
    const glassBlur = rawBlur !== undefined && rawBlur !== null && rawBlur !== '' ? parseInt(rawBlur, 10) : 3;
    const rawAvSize = localStorage.getItem(STORAGE_AVATAR_SIZE) ?? init.avatarSize;
    const avatarSize = rawAvSize !== undefined && rawAvSize !== null && rawAvSize !== '' ? parseInt(rawAvSize, 10) : 32;
    const rawAvRad = localStorage.getItem(STORAGE_AVATAR_RADIUS) ?? init.avatarRadius;
    const avatarRadius = rawAvRad !== undefined && rawAvRad !== null && rawAvRad !== '' ? parseInt(rawAvRad, 10) : 50;
    const leavesEnabled = localStorage.getItem(STORAGE_LEAVES) !== null
      ? localStorage.getItem(STORAGE_LEAVES) === 'true'
      : (init.leavesEnabled !== undefined ? !!init.leavesEnabled : true);
    const rawStart = localStorage.getItem(STORAGE_DYNAMIC_START);
    const dynamicStart = rawStart !== null ? parseInt(rawStart, 10) : (init.dynamicStart !== undefined ? init.dynamicStart : 6);
    const rawEnd = localStorage.getItem(STORAGE_DYNAMIC_END);
    const dynamicEnd = rawEnd !== null ? parseInt(rawEnd, 10) : (init.dynamicEnd !== undefined ? init.dynamicEnd : 16);
    const particleType = localStorage.getItem(STORAGE_PARTICLE_TYPE) || init.particleType || 'auto';
    const rawCount = localStorage.getItem(STORAGE_PARTICLE_COUNT);
    const particleCount = rawCount !== null ? parseInt(rawCount, 10) : (init.particleCount !== undefined ? parseInt(init.particleCount, 10) : 18);
    const rawSpeed = localStorage.getItem(STORAGE_PARTICLE_SPEED);
    const particleSpeed = rawSpeed !== null ? parseFloat(rawSpeed) : (init.particleSpeed !== undefined ? parseFloat(init.particleSpeed) : 1.0);

    try {
      if (localStorage.getItem(STORAGE_THEME) !== themeName) {
        localStorage.setItem(STORAGE_THEME, themeName);
      }
      if (localStorage.getItem(STORAGE_BUBBLE) !== bubbleName) {
        localStorage.setItem(STORAGE_BUBBLE, bubbleName);
      }
    } catch (_) {}

    return { themeName, bubbleName, inputStyle, dimming, wpEnabled, customWp, userAvatar, agentAvatar, glassBlur, avatarSize, avatarRadius, leavesEnabled, dynamicStart, dynamicEnd, particleType, particleCount, particleSpeed };
  }

  // Downscale user/agent avatar uploads to 192x192 WebP once so theme_config.json stays tiny
  function compressAvatarFile(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const size = 192;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const natW = img.naturalWidth || size;
          const natH = img.naturalHeight || size;
          const side = Math.min(natW, natH);
          const sx = Math.max(0, Math.floor((natW - side) / 2));
          const sy = Math.max(0, Math.floor((natH - side) / 2));
          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
          const out = canvas.toDataURL('image/webp', 0.88);
          callback(out && out.startsWith('data:image/webp') ? out : canvas.toDataURL('image/png'));
        } catch (e) {
          callback(String(reader.result || ''));
        }
      };
      img.onerror = () => callback(String(reader.result || ''));
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  // Pre-bake L-shaped header/sidebar glass blur once per theme/dimming change to avoid per-frame GPU backdrop readback
  function syncPrebakedGlass(wpUrl, overlayRgb, overlayAlpha, tintBg, blurStr) {
    const shell = document.querySelector('.agy-shell');
    if (!wpUrl) {
      if (shell) shell.style.removeProperty('--agy-l-glass-bg');
      return;
    }
    const key = `${wpUrl.slice(0, 64)}|${wpUrl.length}|${overlayRgb}|${overlayAlpha.toFixed(3)}|${tintBg}|${blurStr}`;
    window.__AGY_BLUR_CACHE__ = window.__AGY_BLUR_CACHE__ || {};
    const cached = window.__AGY_BLUR_CACHE__[key];
    if (cached) {
      if (shell) shell.style.setProperty('--agy-l-glass-bg', 'url("' + cached + '")');
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const w = 640;
        const h = Math.max(180, Math.round((img.naturalHeight || 1440) * (w / (img.naturalWidth || 2560))));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pxMatch = String(blurStr !== undefined ? blurStr : '3px').match(/(\d+(?:\.\d+)?)/);
        const scaledBlur = Math.max(0, Math.min(16, Math.round((pxMatch ? parseFloat(pxMatch[1]) : 3) * 0.75)));
        ctx.filter = scaledBlur > 0 ? `blur(${scaledBlur}px)` : 'none';
        ctx.drawImage(img, -12, -12, w + 24, h + 24);
        ctx.filter = 'none';
        ctx.fillStyle = `rgba(${overlayRgb}, ${overlayAlpha})`;
        ctx.fillRect(0, 0, w, h);
        if (tintBg) {
          ctx.fillStyle = tintBg;
          ctx.fillRect(0, 0, w, h);
        }
        const baked = canvas.toDataURL('image/webp', 0.85);
        window.__AGY_BLUR_CACHE__[key] = baked;
        const curShell = document.querySelector('.agy-shell');
        if (curShell) curShell.style.setProperty('--agy-l-glass-bg', 'url("' + baked + '")');
      } catch (e) {}
    };
    img.src = wpUrl;
  }

  function applyTheme(overrides = {}) {
    const st = { ...getState(), ...overrides };
    window.__AGY_INITIAL_CONFIG__ = { ...(window.__AGY_INITIAL_CONFIG__ || {}), ...st };
    try {
      localStorage.setItem(STORAGE_THEME, st.themeName);
      localStorage.setItem(STORAGE_BUBBLE, st.bubbleName);
      localStorage.setItem(STORAGE_INPUT, st.inputStyle);
      localStorage.setItem(STORAGE_DIMMING, String(st.dimming));
      localStorage.setItem(STORAGE_WP_ENABLED, String(st.wpEnabled));
      if (overrides.customWp !== undefined) {
        localStorage.setItem(STORAGE_CUSTOM_WP, overrides.customWp);
      }
      if (overrides.userAvatar !== undefined) {
        localStorage.setItem(STORAGE_USER_AVATAR, overrides.userAvatar);
      }
      if (overrides.agentAvatar !== undefined) {
        localStorage.setItem(STORAGE_AGENT_AVATAR, overrides.agentAvatar);
      }
      if (overrides.glassBlur !== undefined) {
        localStorage.setItem(STORAGE_GLASS_BLUR, String(overrides.glassBlur));
      }
      if (overrides.avatarSize !== undefined) {
        localStorage.setItem(STORAGE_AVATAR_SIZE, String(overrides.avatarSize));
      }
      if (overrides.avatarRadius !== undefined) {
        localStorage.setItem(STORAGE_AVATAR_RADIUS, String(overrides.avatarRadius));
      }
      if (overrides.leavesEnabled !== undefined) {
        localStorage.setItem(STORAGE_LEAVES, String(overrides.leavesEnabled));
      }
      if (overrides.dynamicStart !== undefined) {
        localStorage.setItem(STORAGE_DYNAMIC_START, String(overrides.dynamicStart));
      }
      if (overrides.dynamicEnd !== undefined) {
        localStorage.setItem(STORAGE_DYNAMIC_END, String(overrides.dynamicEnd));
      }
      if (overrides.particleType !== undefined) {
        localStorage.setItem(STORAGE_PARTICLE_TYPE, overrides.particleType);
      }
      if (overrides.particleCount !== undefined) {
        localStorage.setItem(STORAGE_PARTICLE_COUNT, String(overrides.particleCount));
        window.__AGY_PARTICLE_TARGET_COUNT__ = overrides.particleCount;
      }
      if (overrides.particleSpeed !== undefined) {
        localStorage.setItem(STORAGE_PARTICLE_SPEED, String(overrides.particleSpeed));
        window.__AGY_PARTICLE_SPEED__ = overrides.particleSpeed;
      }
    } catch (e) {}

    if (window.agySaveThemeConfig) {
      try {
        window.agySaveThemeConfig(JSON.stringify(st));
      } catch (e) {}
    }

    syncAutumnLeaves(st);

    const mainTheme = resolveTheme(st.themeName, st);
    const bubbleTheme = resolveTheme(st.bubbleName, st);
    const wpUrl = st.customWp || mainTheme.wallpaper || '';
    window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ = getDynamicSubThemeName(st.themeName, st);

    const oldLegacy = document.getElementById('antigravity-ho-ly-chibi-theme');
    if (oldLegacy) oldLegacy.remove();

    let styleEl = document.getElementById('antigravity-custom-theme-active');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'antigravity-custom-theme-active';
      document.head.appendChild(styleEl);
    }

    const overlayAlpha = mainTheme.clearBackdrop
      ? Math.min(0.92, Math.max(0.0, ((st.dimming - 10) / 82) * 0.85))
      : Math.min(0.92, Math.max(0.12, (st.dimming / 100) * 0.78));
    const overlayRgb = mainTheme.overlayRgb || '10, 7, 6';
    const bgPosition = mainTheme.bgPosition || 'center center';
    const secondaryGlowStop = mainTheme.secondaryGlow
      ? `, radial-gradient(circle at 22% 72%, ${mainTheme.secondaryGlow} 0%, transparent 55%)`
      : '';

    let bgLayers = '';
    if (wpUrl) {
      bgLayers = mainTheme.clearBackdrop
        ? `linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`
        : `radial-gradient(circle at 75% 40%, ${mainTheme.glow} 0%, transparent 65%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.85}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`;
    } else {
      bgLayers = mainTheme.pureBg || `radial-gradient(circle at 75% 30%, ${mainTheme.glow} 0%, transparent 60%), linear-gradient(160deg, rgba(${overlayRgb}, 0.96) 0%, #070910 100%)`;
    }

    const wpCss = st.wpEnabled ? `
      .agy-shell {
        background-image: ${bgLayers} !important;
        background-size: cover !important;
        background-position: ${bgPosition} !important;
        background-repeat: no-repeat !important;
        image-rendering: auto !important;
      }
      /* Keep transparent scrollers on GPU composited-scrolling layers */
      .agy-shell .overflow-y-auto {
        will-change: scroll-position;
      }
      .agy-sheet,
      .agy-inset-shell,
      .browser-hole-opaque,
      [data-main-content-body="true"],
      [data-side-panel-body="true"],
      [class*="agy-inset-shell"],
      [class*="--shell-canvas"],
      .agy-shell div.absolute.bottom-0.pointer-events-none,
      .agy-shell [class*="z-50"] .pointer-events-none.right-full,
      .agy-shell .bg-background:not(.settings-modal-container):not(.settings-modal-container *):not(#agy-custom-theme-modal-backdrop *) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      /* Browser split-pane hole cutout: keep wallpaper & L-glass visible outside [data-browser-hole] without covering live BrowserView */
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: ${bgLayers};
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        clip-path: var(--agy-hole-clip, none);
        will-change: transform;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > :not([data-has-browser-hole="true"]):not([data-browser-hole]:not([data-browser-hole="false"])):not(.settings-modal-container),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .browser-hole-opaque:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-pane-id]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-tiling-pane]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-main-content-header]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-side-panel-strip]:not([data-has-browser-hole="true"]) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] :is([data-main-content-body], [data-side-panel-body]):not([data-has-browser-hole="true"]) {
        box-shadow: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-split-sash] {
        background: rgba(56, 189, 248, 0.14) !important;
        background-image: none !important;
      }
    ` : `
      .agy-shell {
        background: #111113 !important;
      }
    `;

    const defaultCornerSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M2 20 L2 6 Q2 2 6 2 L20 2' stroke='%23fbbf24' stroke-width='1.5' fill='none' opacity='0.65'/%3E%3Ccircle cx='6' cy='6' r='2' fill='%23fbbf24' opacity='0.75'/%3E%3C/svg%3E";
    const cornerFiligreeUrl = bubbleTheme.cornerSvg || defaultCornerSvg;

    const bubbleStickerCss = bubbleTheme.sticker ? (bubbleTheme.isOrnament ? `
      .group\\/user-input-step {
        padding-top: 18px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    ` : `
      .group\\/user-input-step {
        padding-top: ${Math.max(36, Math.abs(bubbleTheme.stickerTop) + 8)}px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    `) : `
      .agy-user-bubble-frame::before { display: none !important; }
    `;

    const showInputSticker = st.inputStyle !== 'minimal' && bubbleTheme.sticker;
    const inputStickerCss = showInputSticker ? (bubbleTheme.isOrnament ? `
      .surface-composer {
        margin-top: 16px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 8}px;
        height: ${bubbleTheme.stickerH + 2}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 4px;
        width: 16px;
        height: 16px;
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        transform: rotate(180deg);
        z-index: 25;
        pointer-events: none;
        opacity: 0.78;
      }
    ` : `
      .surface-composer {
        margin-top: 28px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop - 4}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 6}px;
        height: ${bubbleTheme.stickerH + 6}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after { display: none !important; }
    `) : `
      .surface-composer::before,
      .surface-composer::after { display: none !important; }
    `;

    const inputCardBg =
      st.inputStyle === 'glass'
        ? (bubbleTheme.inputGlassBg || 'rgba(20, 15, 13, 0.52)')
        : st.inputStyle === 'double_gold'
        ? 'linear-gradient(145deg, rgba(44, 28, 20, 0.90) 0%, rgba(24, 15, 12, 0.92) 100%)'
        : (bubbleTheme.inputCardBg || 'rgba(28, 19, 16, 0.88)');

    const inputOuterBorder =
      st.inputStyle === 'double_gold'
        ? 'linear-gradient(135deg, #f59e0b 0%, rgba(217, 119, 6, 0.35) 50%, #fbbf24 100%)'
        : bubbleTheme.frameBg;

    const sidebarBg = mainTheme.sidebarBg || 'rgba(14, 10, 8, 0.68)';
    const sidebarHoverBg = mainTheme.sidebarHoverBg || 'rgba(255, 255, 255, 0.08)';
    const btnBg = mainTheme.btnBg || 'rgba(48, 30, 22, 0.62)';
    const modalBg = mainTheme.modalBg || 'rgba(14, 12, 12, 0.96)';
    const innerBubbleBorder = bubbleTheme.isScroll
      ? '2px solid #78350f'
      : (bubbleTheme.innerBorder || '1px solid rgba(255, 255, 255, 0.06)');

    const isLight = Boolean(mainTheme.isLight);
    const uiInk = mainTheme.uiTextColor || (isLight ? '#0f172a' : 'rgba(248, 250, 252, 0.96)');
    const uiMutedInk = mainTheme.uiMutedColor || (isLight ? '#334155' : 'rgba(241, 245, 249, 0.92)');
    const uiShadow = isLight ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.92), 0 0 8px rgba(0, 0, 0, 0.68)';
    const pillBg = mainTheme.pillBg || (isLight ? 'rgba(255, 255, 255, 0.78)' : 'rgba(6, 11, 24, 0.78)');
    const pillHoverBg = mainTheme.pillHoverBg || (isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 18, 38, 0.92)');
    const pillText = mainTheme.pillTextColor || (isLight ? '#0f172a' : '#f8fafc');
    const pillBorder = mainTheme.pillBorder || (isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.16)');
    const preCodeBg = isLight ? `rgba(${overlayRgb}, 0.72)` : `rgba(${overlayRgb}, 0.56)`;

    const effectiveUserAvatar = st.userAvatar === 'none' ? '' : (st.userAvatar || mainTheme.userAvatar || '');
    const effectiveAgentAvatar = st.agentAvatar === 'none' ? '' : (st.agentAvatar || mainTheme.agentAvatar || '');
    const avSize = Math.min(52, Math.max(22, Number(st.avatarSize) || 32));
    const avAgentSize = Math.max(22, avSize - 2);
    const avRadius = Math.min(50, Math.max(0, Number.isFinite(Number(st.avatarRadius)) ? Number(st.avatarRadius) : 50));

    const avatarCss = `
      ${effectiveUserAvatar ? `
      .agy-shell [data-testid="user-message"] {
        position: relative !important;
        padding-right: ${avSize + 10}px !important;
      }
      .agy-shell [data-testid="user-message"]::after {
        content: "";
        position: absolute;
        right: 0;
        bottom: 6px;
        width: ${avSize}px;
        height: ${avSize}px;
        border-radius: ${avRadius}%;
        background-image: url("${effectiveUserAvatar}");
        background-size: cover;
        background-position: center;
        border: 1.5px solid ${mainTheme.primary};
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 8px ${mainTheme.glow};
        pointer-events: none;
      }
      ` : ''}
      ${effectiveAgentAvatar ? `
      .agy-shell [data-testid="agent-response"] {
        position: relative !important;
        padding-left: ${avAgentSize + 22}px !important;
        min-height: ${avAgentSize + 20}px !important;
      }
      .agy-shell [data-testid="agent-response"]::before {
        content: "";
        position: absolute;
        top: 12px;
        left: 12px;
        width: ${avAgentSize}px;
        height: ${avAgentSize}px;
        border-radius: ${avRadius}%;
        background-image: url("${effectiveAgentAvatar}");
        background-size: cover;
        background-position: center;
        border: 1.5px solid ${mainTheme.secondary || mainTheme.primary};
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 8px ${mainTheme.secondaryGlow || mainTheme.glow};
        pointer-events: none;
      }
      ` : ''}
    `;

    const sidebarEnhanceCss = (mainTheme.sidebarEnhanceText || isLight) ? `
      .agy-shell .bg-sidebar a,
      .agy-shell .bg-sidebar span,
      .agy-shell .bg-sidebar button {
        color: ${isLight ? uiInk : 'inherit'};
        text-shadow: ${isLight ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.88)'};
      }
      .agy-shell .bg-sidebar .text-muted-foreground,
      .agy-shell .bg-sidebar .text-secondary-foreground {
        color: ${uiMutedInk} !important;
      }
    ` : '';

    const aiCardCss = mainTheme.aiCardBg ? `
      /* Translucent reading card for AI responses (zero live backdrop-filter for max 120fps scroll) */
      .agy-shell [data-testid="agent-response"] {
        background: ${mainTheme.aiCardBg} !important;
        ${isLight ? `color: ${uiInk} !important;` : ''}
        backdrop-filter: none !important;
        border: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)')} !important;
        border-radius: 14px !important;
        padding: 12px 16px !important;
        box-shadow: ${isLight ? '0 4px 14px rgba(15, 23, 42, 0.08)' : '0 4px 14px rgba(0, 0, 0, 0.28)'} !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-bleed,
      .agy-shell [data-testid="agent-response"] .md-table-host {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        margin-inline: 0 !important;
        left: auto !important;
        right: auto !important;
        transform: none !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll,
      .agy-shell [data-testid="agent-response"] :has(> table):not(.md-table-frame) {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 2px !important;
        box-sizing: border-box !important;
        /* Keep standard scrollbar-width: auto so Chromium does not disable ::-webkit-scrollbar */
        scrollbar-width: auto !important;
        scrollbar-color: auto !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-frame {
        /* .md-table-frame sits INSIDE .md-table-scroll; forcing width:100% + overflow:hidden hid overflow from .md-table-scroll */
        width: fit-content !important;
        min-width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        transform: none !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] :is(.md-math-display, .katex-display) {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        padding-bottom: 4px !important;
        box-sizing: border-box !important;
        scrollbar-width: auto !important;
        scrollbar-color: auto !important;
      }
      .agy-shell [data-testid="agent-response"] :not(.md-math-display):not(.katex-display) > .katex {
        display: inline-block !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        vertical-align: middle !important;
        box-sizing: border-box !important;
        scrollbar-width: auto !important;
        scrollbar-color: auto !important;
      }
      .agy-shell [data-testid="agent-response"] :is(.md-table-scroll, :has(> table):not(.md-table-frame), .md-math-display, .katex-display, :not(.md-math-display):not(.katex-display) > .katex)::-webkit-scrollbar {
        height: 8px !important;
        display: block !important;
      }
      .agy-shell [data-testid="agent-response"] :is(.md-table-scroll, :has(> table):not(.md-table-frame), .md-math-display, .katex-display, :not(.md-math-display):not(.katex-display) > .katex)::-webkit-scrollbar-track {
        background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)'} !important;
        border-radius: 9999px !important;
      }
      .agy-shell [data-testid="agent-response"] :is(.md-table-scroll, :has(> table):not(.md-table-frame), .md-math-display, .katex-display, :not(.md-math-display):not(.katex-display) > .katex)::-webkit-scrollbar-thumb {
        background: ${isLight ? 'rgba(15, 23, 42, 0.34)' : 'rgba(148, 163, 184, 0.48)'} !important;
        border-radius: 9999px !important;
      }
      .agy-shell [data-testid="agent-response"] :is(.md-table-scroll, :has(> table):not(.md-table-frame), .md-math-display, .katex-display, :not(.md-math-display):not(.katex-display) > .katex)::-webkit-scrollbar-thumb:hover {
        background: ${isLight ? 'rgba(15, 23, 42, 0.54)' : 'rgba(148, 163, 184, 0.72)'} !important;
      }
      .agy-shell [data-testid="agent-response"] table {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        table-layout: auto !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] :is(th, td) {
        max-width: none !important;
        white-space: normal !important;
        word-break: normal !important;
        overflow-wrap: break-word !important;
        padding: 8px 12px !important;
      }
      .agy-shell [data-testid="agent-response"] :is(td, th) .inline-pill-wrap {
        min-width: 0 !important;
      }
      ${isLight ? `
      .agy-shell [data-main-content-body="true"],
      .agy-shell [data-testid="agent-response"] :is(p, li, span, code, h1, h2, h3, h4, strong, td, th) {
        color: ${uiInk};
      }
      ` : ''}
      .agy-shell [data-main-content-body="true"] h1,
      .agy-shell [data-main-content-body="true"] h2 {
        text-shadow: ${isLight ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.85)'};
      }
    ` : '';

    const useUnifiedGlass = Boolean(st.wpEnabled && wpUrl && mainTheme.unifiedGlass);
    if (useUnifiedGlass && typeof syncShellMetrics === 'function') {
      syncShellMetrics();
    }
    if (useUnifiedGlass) {
      const effectiveBlur = Number.isFinite(st.glassBlur) ? `${st.glassBlur}px` : (mainTheme.headerBlur || '3px');
      syncPrebakedGlass(wpUrl, overlayRgb, overlayAlpha, mainTheme.headerBg || '', effectiveBlur);
    } else {
      syncPrebakedGlass(null);
    }

    const sidePanelCss = st.wpEnabled ? `
      /* Frosted pre-baked glass + dark/light reading scrim for right-side Artifact / Text / Diff split panels */
      ${useUnifiedGlass ? `
      .agy-shell[data-agy-side-glass="1"]::before {
        clip-path: polygon(
          evenodd,
          0 0,
          100% 0,
          100% var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) 100%,
          0 100%,
          0 0,
          var(--agy-side-l, 100%) var(--agy-side-t, 75px),
          var(--agy-side-r, 100%) var(--agy-side-t, 75px),
          var(--agy-side-r, 100%) var(--agy-side-b, 100%),
          var(--agy-side-l, 100%) var(--agy-side-b, 100%),
          var(--agy-side-l, 100%) var(--agy-side-t, 75px)
        ) !important;
      }
      ` : ''}
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not(:has([data-browser-hole]:not([data-browser-hole="false"]))) {
        background: ${mainTheme.aiCardBg || `rgba(${overlayRgb}, 0.72)`} !important;
        ${isLight ? `color: ${uiInk} !important;` : ''}
        backdrop-filter: none !important;
        border-left: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)')} !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
      }
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not(:has([data-browser-hole]:not([data-browser-hole="false"]))) pre {
        background: ${preCodeBg} !important;
        border: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)')} !important;
        border-radius: 10px !important;
      }
      .agy-shell [data-side-panel-body="true"] :is(h1, h2, h3, h4) {
        ${isLight ? `color: ${uiInk} !important;` : ''}
        text-shadow: ${isLight ? 'none' : '0 1px 6px rgba(0, 0, 0, 0.85)'};
      }
    ` : '';

    const headerCss = mainTheme.headerBg ? `
      /* Frosted top titlebar & seamless L-shaped unified glass (zero live backdrop-filter) */
      ${useUnifiedGlass ? `
      .agy-shell {
        position: relative !important;
      }
      .agy-shell > div:first-of-type {
        position: relative !important;
        z-index: 3 !important;
      }
      .agy-shell > div:not(:first-of-type) {
        position: relative !important;
        z-index: 2 !important;
      }
      .agy-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-color: ${mainTheme.headerBg};
        background-image: var(--agy-l-glass-bg, none);
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        backdrop-filter: none !important;
        will-change: transform;
        clip-path: polygon(
          0 0,
          100% 0,
          100% var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) 100%,
          0 100%
        );
      }
      .agy-shell [class*="@container/titlebar"] {
        background: transparent !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || 'rgba(56, 189, 248, 0.10)'} !important;
      }
      ` : `
      .agy-shell [class*="@container/titlebar"] {
        background: ${mainTheme.headerBg} !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || 'rgba(56, 189, 248, 0.15)'} !important;
      }
      `}
      .agy-shell [class*="@container/titlebar"] [data-testid="breadcrumb-segment"],
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button,
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] span {
        color: ${uiInk} !important;
        text-shadow: ${uiShadow};
      }
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button.border {
        background: ${isLight ? 'rgba(255, 255, 255, 0.56)' : 'rgba(6, 11, 24, 0.36)'} !important;
        border-color: ${pillBorder} !important;
      }
    ` : '';

    const sidebarOuterCss = useUnifiedGlass ? `
      .agy-shell aside:not(.surface-opaque):not([data-browser-occluder="true"]),
      .agy-shell [data-sidebar="true"]:not(.surface-opaque):not([data-browser-occluder="true"]),
      .agy-shell .bg-sidebar:not(.surface-opaque):not([data-browser-occluder="true"]):not([role="menu"]) {
        background: transparent !important;
        backdrop-filter: none !important;
      }
    ` : `
      .agy-shell aside:not(.surface-opaque):not([data-browser-occluder="true"]),
      .agy-shell [data-sidebar="true"]:not(.surface-opaque):not([data-browser-occluder="true"]),
      .agy-shell .bg-sidebar:not(.surface-opaque):not([data-browser-occluder="true"]):not([role="menu"]) {
        background: ${sidebarBg} !important;
        backdrop-filter: none !important;
      }
    `;

    styleEl.textContent = `
      ${wpCss}

      /* Translucent themed sidebar (unified via ::before when unifiedGlass is active) */
      ${sidebarOuterCss}
      .agy-shell .bg-sidebar .bg-sidebar:not(.surface-opaque):not([data-browser-occluder="true"]):not([role="menu"]),
      .agy-shell [data-sidebar="true"] .bg-sidebar:not(.surface-opaque):not([data-browser-occluder="true"]):not([role="menu"]),
      .agy-shell .bg-sidebar [class*="group/headerbtn"],
      .agy-shell .bg-sidebar [class*="group/section-header"] {
        background: transparent !important;
        backdrop-filter: none !important;
      }
      /* === BUTTERY SMOOTH 60FPS / 120FPS GPU HARDWARE ACCELERATION & FLUID TRANSITIONS === */
      @keyframes agyModalPopIn {
        0% {
          opacity: 0;
          transform: scale(0.95) translateY(10px) translateZ(0);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0) translateZ(0);
        }
      }

      @keyframes agyBackdropFadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }

      /* Hardware-accelerated smooth scrolling & layer containment */
      .agy-shell .overflow-y-auto,
      .agy-shell .overflow-x-auto,
      .agy-shell [data-main-content-body="true"],
      .agy-shell [data-side-panel-body="true"] {
        -webkit-overflow-scrolling: touch !important;
        transform: translateZ(0) !important;
        will-change: scroll-position !important;
      }

      /* Fluid transitions for all UI interactive controls */
      .agy-shell button,
      .agy-shell a,
      .agy-shell [role="button"],
      .agy-shell [role="tab"],
      .agy-shell [role="menuitem"],
      .agy-shell [role="option"],
      .agy-shell [data-testid*="button"],
      .agy-shell [class*="group/headerbtn"],
      .agy-shell [class*="group/section-header"],
      .agy-shell input,
      .agy-shell textarea {
        transition: background-color 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                    color 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                    opacity 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      /* Floating dropdown menus, popovers, and context menus (zero-lag instant rendering) */
      .agy-shell .surface-opaque,
      .surface-opaque,
      [data-browser-occluder="true"],
      [role="menu"],
      [role="listbox"],
      [data-radix-menu-content],
      [data-radix-popper-content-wrapper] > div,
      div.border-menu-border,
      .agy-shell [data-browser-occluder="true"],
      .agy-shell [role="menu"],
      .agy-shell [role="listbox"],
      .agy-shell [data-radix-menu-content],
      .agy-shell [data-radix-popper-content-wrapper] > div,
      .agy-shell div.border-menu-border {
        background: ${modalBg || 'rgba(9, 14, 26, 0.98)'} !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: 1px solid ${mainTheme.borderColor || 'rgba(56, 189, 248, 0.28)'} !important;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.85) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        -webkit-app-region: no-drag !important;
        app-region: no-drag !important;
        animation: none !important;
        transition: none !important;
        transform: none !important;
        will-change: auto !important;
      }
      .agy-shell [data-testid="title-menu-bar-item"] {
        transition: background-color 0.08s ease, color 0.08s ease !important;
      }
      .agy-shell [data-testid="title-menu-bar-option"],
      .agy-shell [role="menuitem"],
      .agy-shell [role="option"] {
        color: ${mainTheme.textColor || '#f8fafc'} !important;
        transition: background-color 0.08s ease, color 0.08s ease !important;
      }
      .agy-shell [data-testid="title-menu-bar-option"]:hover,
      .agy-shell [role="menuitem"]:hover,
      .agy-shell [role="option"]:hover,
      .agy-shell [data-highlighted] {
        background: ${sidebarHoverBg || 'rgba(56, 189, 248, 0.22)'} !important;
        color: #ffffff !important;
      }
      /* Preserve virtual list positioning; hide sticky headers only while scrolled */
      .agy-shell .bg-sidebar .agy-scrolled > .w-full.relative > .bg-sidebar[style*="position: sticky"] {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.14s ease !important;
      }
      .agy-shell .bg-sidebar [class*="group/headerbtn"]:hover,
      .agy-shell .bg-sidebar a:hover {
        background: ${sidebarHoverBg} !important;
      }
      ${sidebarEnhanceCss}
      ${aiCardCss}
      ${sidePanelCss}
      ${avatarCss}
      ${headerCss}

      /* "+ New Conversation" button glow */
      .agy-button-custom.border.border-border {
        background: ${btnBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
      }

      /* User Chat Bubble Double-Border Frame & Ornament */
      .agy-user-bubble-frame {
        background: ${bubbleTheme.frameBg} !important;
        border-radius: ${bubbleTheme.isScroll ? '6px' : '14px'} !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 12px ${bubbleTheme.glow} !important;
        position: relative !important;
        overflow: visible !important;
        padding: 1.2px !important;
      }

      .agy-user-bubble-frame::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: ${bubbleTheme.isOrnament ? '16px' : '14px'};
        height: ${bubbleTheme.isOrnament ? '16px' : '14px'};
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        opacity: ${bubbleTheme.isOrnament ? '0.85' : '0.65'};
      }

      .agy-user-bubble {
        background: ${bubbleTheme.bg} !important;
        border-radius: ${bubbleTheme.isScroll ? '5px' : '13px'} !important;
        padding: 8px 16px !important;
        color: ${bubbleTheme.textColor} !important;
        border: ${innerBubbleBorder} !important;
        overflow: visible !important;
        font-weight: 450 !important;
      }

      .agy-user-bubble * {
        color: ${bubbleTheme.textColor} !important;
      }

      /* Double-Border Input Composer */
      .surface-composer {
        background: ${inputOuterBorder} !important;
        border-radius: 16px !important;
        padding: 1.5px !important;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 14px ${bubbleTheme.glow} !important;
        position: relative !important;
      }

      .surface-composer-card {
        background: ${inputCardBg} !important;
        backdrop-filter: none !important;
        border-radius: 14.5px !important;
        border: ${bubbleTheme.innerBorder || '1px solid rgba(255, 255, 255, 0.07)'} !important;
      }

      /* High-contrast pill badges for top composer bar (adaptive light/dark theme) */
      .surface-composer [data-testid="project-selector-trigger"],
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] {
        background: ${pillBg} !important;
        color: ${pillText} !important;
        border: 1px solid ${pillBorder} !important;
        border-radius: 9999px !important;
        font-weight: 500 !important;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25) !important;
        margin: 1px 2px !important;
        transition: background-color 0.15s ease, border-color 0.15s ease !important;
      }
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:not([data-testid="project-selector-trigger"]),
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:not([data-testid="project-selector-trigger"]) {
        padding-left: 8px !important;
        padding-right: 7px !important;
        gap: 4px !important;
      }
      .surface-composer [data-testid="project-selector-trigger"]:hover,
      .surface-composer [data-testid="branch-pill-trigger"]:hover,
      .surface-composer [aria-label="Select Environment"]:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:hover {
        background: ${pillHoverBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        color: ${pillText} !important;
      }
      .surface-composer [data-testid="project-selector-trigger"] *,
      .surface-composer [data-testid="branch-pill-trigger"] *,
      .surface-composer [aria-label="Select Environment"] *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] * {
        color: ${pillText} !important;
      }
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] .ml-auto > * {
        background: ${pillBg} !important;
        color: ${pillText} !important;
        border-radius: 9999px !important;
        padding: 2px 8px !important;
      }

      ${bubbleStickerCss}
      ${inputStickerCss}

      @media (max-width: 640px) {
        .agy-user-bubble-frame::before,
        .surface-composer::before {
          transform: scale(0.78);
          transform-origin: bottom right;
        }
      }

      .settings-modal-container {
        background: ${modalBg} !important;
        border: 1px solid ${mainTheme.borderColor} !important;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.75), 0 0 24px ${mainTheme.glow} !important;
        backdrop-filter: none !important;
      }

      #agy-custom-theme-modal-backdrop {
        animation: agyBackdropFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }
      #agy-custom-theme-modal-dialog {
        background: ${modalBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px ${mainTheme.glow} !important;
        animation: agyModalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        transform-origin: center center !important;
        will-change: transform, opacity !important;
      }
      #agy-custom-theme-modal-header {
        background: ${mainTheme.modalHeaderBg || 'rgba(22, 16, 14, 0.85)'} !important;
      }
      #agy-custom-theme-badge {
        color: ${mainTheme.primary} !important;
        border-color: ${mainTheme.borderColor} !important;
        background: ${mainTheme.glow} !important;
      }
      #agy-custom-theme-sidebar-btn svg,
      #agy-custom-theme-topbar-btn svg {
        color: ${mainTheme.primary} !important;
      }
      #agy-running-dogs-banner {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      #agy-running-dogs-banner:hover {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      #agy-running-dogs-banner img {
        transform: translateZ(0) !important;
        will-change: transform, filter !important;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), filter 0.22s ease !important;
      }
      #agy-running-dogs-banner:hover img {
        transform: scale(1.06) translateZ(0) !important;
        filter: drop-shadow(0 2px 10px ${mainTheme.primary}) !important;
      }
      /* Hover lift feedback on preset cards */
      .agy-preset-card,
      .agy-bubble-card,
      .agy-input-card {
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                    background-color 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
        will-change: transform !important;
      }
      .agy-preset-card:hover,
      .agy-bubble-card:hover,
      .agy-input-card:hover {
        transform: translateY(-2px) translateZ(0) !important;
      }
    `;

    syncTitleBarOverlay(st);
    scheduleTitleBarSync(st);
  }

  function syncTitleBarOverlay(stOverride) {
    const st = stOverride || getState();
    const activeTh = resolveTheme(st.themeName) || {};
    if (window.electronNative && typeof window.electronNative.setTitleBarOverlay === 'function') {
      try {
        window.electronNative.setTitleBarOverlay({
          color: st.wpEnabled ? '#00000000' : '#111114',
          symbolColor: (st.wpEnabled && activeTh.isLight) ? '#0f172a' : '#f8fafc'
        });
      } catch (e) {}
    }
  }

  function clearTitleBarTimers() {
    if (Array.isArray(window.__AGY_TBO_TIMERS__)) {
      window.__AGY_TBO_TIMERS__.forEach(id => clearTimeout(id));
    }
    window.__AGY_TBO_TIMERS__ = [];
  }

  function scheduleTitleBarSync(stOverride) {
    clearTitleBarTimers();
    const st = stOverride || getState();
    syncTitleBarOverlay(st);
    [300, 1500].forEach(ms => {
      window.__AGY_TBO_TIMERS__.push(setTimeout(() => syncTitleBarOverlay(), ms));
    });
  }

  function removeCustomTheme() {
    clearTitleBarTimers();
    if (window.__AGY_SCROLL_AC__) {
      try { window.__AGY_SCROLL_AC__.abort(); } catch (e) {}
    }
    const styleEl = document.getElementById('antigravity-custom-theme-active');
    if (styleEl) styleEl.remove();
    const navBtn = document.getElementById('agy-custom-theme-sidebar-btn');
    if (navBtn) navBtn.remove();
    const topBtn = document.getElementById('agy-custom-theme-topbar-btn');
    if (topBtn) topBtn.remove();
    const settingsBtn = document.getElementById('agy-custom-theme-settings-btn');
    if (settingsBtn) settingsBtn.remove();
    const modal = document.getElementById('agy-custom-theme-modal-backdrop');
    if (modal) modal.remove();
    const dogs = document.getElementById('agy-running-dogs-banner');
    if (dogs) dogs.remove();
    removeAutumnLeaves();
    const shell = document.querySelector('.agy-shell');
    if (shell) {
      delete shell.dataset.agyHoleActive;
      shell.style.removeProperty('--agy-hole-clip');
      shell.style.removeProperty('--agy-l-glass-bg');
    }
    if (window.electronNative && typeof window.electronNative.setTitleBarOverlay === 'function') {
      try {
        window.electronNative.setTitleBarOverlay({ color: '#111114', symbolColor: '#f8fafc' });
      } catch (e) {}
    }
  }

  window.__ANTIGRAVITY_APPLY_CUSTOM_THEME__ = applyTheme;
  window.__ANTIGRAVITY_REMOVE_CUSTOM_THEME__ = removeCustomTheme;
  window.__ANTIGRAVITY_OPEN_THEME_MODAL__ = openCustomThemeModal;
  window.__AGY_APPLY_THEME__ = applyTheme;
  window.__AGY_GET_STATE__ = getState;
  window.__AGY_THEMES__ = THEMES;

  applyTheme();

  function openCustomThemeModal() {
    let backdrop = document.getElementById('agy-custom-theme-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'agy-custom-theme-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(10px);
      `;

      backdrop.innerHTML = `
        <div id="agy-custom-theme-modal-dialog" style="background: rgba(16, 12, 11, 0.97); border: 1.2px solid rgba(212, 148, 106, 0.35); border-radius: 18px; width: 100%; max-width: 900px; height: 86vh; max-height: 860px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px rgba(224, 142, 85, 0.25); font-family: system-ui, -apple-system, sans-serif;">
          <div id="agy-custom-theme-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(22, 16, 14, 0.85);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 17px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.2px;">Custom Theme Studio</span>
              <span id="agy-custom-theme-badge" style="font-size: 11.5px; padding: 2.5px 9px; border-radius: 9999px; background: rgba(224, 142, 85, 0.2); color: #e08e55; font-weight: 500; border: 1px solid rgba(224, 142, 85, 0.3);">${PUBLIC_THEME_KEYS.length} Preset${PUBLIC_THEME_KEYS.length > 1 ? 's' : ''}</span>
            </div>
            <button id="agy-theme-modal-close-btn" type="button" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #d4d4d8; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; font-size: 15px; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">✕</button>
          </div>
          <div id="agy-theme-modal-body" style="flex: 1; overflow-y: auto; height: 100%;"></div>
        </div>
      `;

      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.style.display = 'none';
      });
      backdrop.querySelector('#agy-theme-modal-close-btn').addEventListener('click', () => {
        backdrop.style.display = 'none';
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop.style.display !== 'none') {
          backdrop.style.display = 'none';
        }
      });
    }

    backdrop.style.display = 'flex';
    const body = backdrop.querySelector('#agy-theme-modal-body');
    renderThemePanels(body);
  }

  function renderThemePanels(container) {
    const st = getState();
    const mainTheme = resolveTheme(st.themeName, st);
    const activeThDef = THEMES[st.themeName] || {};
    const isDynamicActive = !!activeThDef.isDynamic;
    const effUserAv = st.userAvatar === 'none' ? '' : (st.userAvatar || mainTheme.userAvatar || '');
    const effAgentAv = st.agentAvatar === 'none' ? '' : (st.agentAvatar || mainTheme.agentAvatar || '');
    const activeParticleMode = (st.particleType && st.particleType !== 'auto')
      ? st.particleType
      : (mainTheme.particleType || 'sakura');

    container.innerHTML = `
      <div id="agy-theme-scroll-container" style="padding: 24px 32px 48px 32px; max-width: 860px; margin: 0 auto; overflow-y: auto; height: 100%; color: #f4f4f5;">
        <div style="border: 1px solid ${mainTheme.borderColor}; background: ${mainTheme.cardBg || 'rgba(22, 16, 14, 0.72)'}; border-radius: 12px; padding: 16px 20px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 14.5px; font-weight: 600; color: #f4f4f5; margin-bottom: 2px;">Wallpaper, Pre-Baked Blur & Config</div>
              <div style="font-size: 12.5px; color: #a1a1aa;">Balance artwork clarity, 120fps pre-baked frosted glass blur, or share config JSON.</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #d4d4d8; cursor: pointer;">
                <input id="agy-wp-toggle" type="checkbox" ${st.wpEnabled ? 'checked' : ''} style="accent-color: ${mainTheme.primary}; cursor: pointer;" />
                Backdrop
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #fbcfe8; cursor: pointer;">
                <input id="agy-leaves-toggle" type="checkbox" ${st.leavesEnabled ? 'checked' : ''} style="accent-color: #f472b6; cursor: pointer;" />
                <span id="agy-particle-label">${activeParticleMode === 'sakura' ? '🌸 Hoa anh đào rơi' : '🍂 Lá vàng rơi'}</span>
              </label>
              <select id="agy-particle-select" style="background: rgba(15, 23, 42, 0.85); color: #f4f4f5; border: 1px solid ${mainTheme.borderColor}; border-radius: 6px; font-size: 11px; padding: 2px 6px; cursor: pointer;">
                <option value="auto" ${st.particleType === 'auto' ? 'selected' : ''}>Tự động theo Theme</option>
                <option value="sakura" ${st.particleType === 'sakura' ? 'selected' : ''}>🌸 Hoa anh đào</option>
                <option value="autumn" ${st.particleType === 'autumn' ? 'selected' : ''}>🍂 Lá vàng rơi</option>
              </select>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #a1a1aa;">
                Dim
                <input id="agy-dim-slider" type="range" min="15" max="92" value="${st.dimming}" style="width: 96px; cursor: pointer; accent-color: #ffffff; height: 5px;" />
                <span id="agy-dim-val" style="min-width: 32px; text-align: right;">${st.dimming}%</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #a1a1aa;">
                Blur
                <input id="agy-blur-slider" type="range" min="0" max="16" value="${st.glassBlur}" style="width: 78px; cursor: pointer; accent-color: ${mainTheme.primary}; height: 5px;" />
                <span id="agy-blur-val" style="min-width: 30px; text-align: right;">${st.glassBlur}px</span>
              </label>
              <label style="padding: 5px 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid ${mainTheme.borderColor}; color: #f4f4f5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                Custom Image
                <input id="agy-wp-upload" type="file" accept="image/*" style="display: none;" />
              </label>
              <button id="agy-export-btn" type="button" style="padding: 5px 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); color: #f4f4f5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                Export JSON
              </button>
              <button id="agy-import-toggle" type="button" style="padding: 5px 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); color: #f4f4f5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                Import JSON
              </button>
              <button id="agy-reset-btn" type="button" style="padding: 5px 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                Reset
              </button>
            </div>
          </div>
          <div id="agy-import-box" style="display: none; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);">
            <textarea id="agy-import-text" rows="3" placeholder='Paste exported theme config JSON here (e.g. {"themeName":"WLOP Cosmic","dimming":45,...})' style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.35); color: #f4f4f5; border: 1px solid ${mainTheme.borderColor}; border-radius: 8px; padding: 8px 10px; font-family: monospace; font-size: 12px; resize: vertical;"></textarea>
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
              <span id="agy-import-msg" style="font-size: 12px; color: #fca5a5;"></span>
              <button id="agy-import-apply" type="button" style="padding: 5px 12px; border-radius: 7px; background: ${mainTheme.primary}; color: #090d16; font-weight: 600; font-size: 12px; border: none; cursor: pointer;">Apply JSON</button>
            </div>
          </div>
          <div id="agy-dynamic-schedule-box" style="display: ${isDynamicActive ? 'flex' : 'none'}; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.28); border-radius: 10px; padding: 10px 14px; margin-top: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">⏰</span>
              <div>
                <div style="font-size: 13.5px; font-weight: 600; color: #7dd3fc;">Thời gian chuyển đổi Theme (Dynamic Schedule)</div>
                <div style="font-size: 11.5px; color: #94a3b8;">Tự động đổi hình nền & tone màu: Biển Xanh (Ban ngày) và Hoàng Hôn (Chiều/Tối).</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 12.5px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; color: #e0f2fe; font-weight: 500;">
                ☀️ Sáng từ:
                <select id="agy-dynamic-start-select" style="background: rgba(15, 23, 42, 0.90); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.45); border-radius: 6px; padding: 3px 8px; font-weight: 600; cursor: pointer;">
                  ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === st.dynamicStart ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
                </select>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; color: #fde68a; font-weight: 500;">
                🌅 Chiều/Tối từ:
                <select id="agy-dynamic-end-select" style="background: rgba(15, 23, 42, 0.90); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 6px; padding: 3px 8px; font-weight: 600; cursor: pointer;">
                  ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === st.dynamicEnd ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
                </select>
              </label>
              <span id="agy-dynamic-status-badge" style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); color: #bae6fd; font-weight: 600;">
                ${isHourDaytime(new Date().getHours(), st.dynamicStart, st.dynamicEnd) ? '☀️ Đang áp dụng: Ban ngày' : '🌅 Đang áp dụng: Hoàng hôn'}
              </span>
            </div>
          </div>
          <div id="agy-particle-controls-row" style="display: ${st.leavesEnabled ? 'flex' : 'none'}; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(244, 114, 182, 0.08); border: 1px solid rgba(244, 114, 182, 0.25); border-radius: 10px; padding: 10px 14px; margin-top: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">🌸</span>
              <div>
                <div style="font-size: 13.5px; font-weight: 600; color: #fbcfe8;">Mật độ & Tốc độ rơi cánh hoa (Particles Tuning)</div>
                <div style="font-size: 11.5px; color: #94a3b8;">Tùy chỉnh số lượng cánh hoa bay và tốc độ rơi chậm/nhanh theo sở thích.</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #fce7f3; font-weight: 500;">
                Số lượng:
                <input id="agy-particle-count-slider" type="range" min="6" max="48" step="2" value="${st.particleCount}" style="width: 85px; cursor: pointer; accent-color: #f472b6; height: 5px;" />
                <span id="agy-particle-count-val" style="min-width: 24px; text-align: right; font-weight: 600; color: #f472b6;">${st.particleCount}</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #fce7f3; font-weight: 500;">
                Tốc độ rơi:
                <input id="agy-particle-speed-slider" type="range" min="20" max="250" step="10" value="${Math.round(st.particleSpeed * 100)}" style="width: 85px; cursor: pointer; accent-color: #f472b6; height: 5px;" />
                <span id="agy-particle-speed-val" style="min-width: 34px; text-align: right; font-weight: 600; color: #f472b6;">${st.particleSpeed.toFixed(1)}x</span>
              </label>
            </div>
          </div>
        </div>

        <div style="border: 1px solid ${mainTheme.borderColor}; background: ${mainTheme.cardBg || 'rgba(22, 16, 14, 0.72)'}; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #f4f4f5; margin-bottom: 2px;">Chat Avatars (User & AI Agent)</div>
              <div style="font-size: 12px; color: #a1a1aa;">Profile badges rendered beside chat messages (auto-compressed WebP).</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div id="agy-user-av-preview" style="width: 30px; height: 30px; border-radius: ${st.avatarRadius}%; border: 1.5px solid ${mainTheme.primary}; background: rgba(255,255,255,0.06) ${effUserAv ? `url('${effUserAv}') center/cover no-repeat` : ''}; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #a1a1aa;">${effUserAv ? '' : 'U'}</div>
                <label style="padding: 4px 10px; border-radius: 7px; background: rgba(255, 255, 255, 0.08); border: 1px solid ${mainTheme.borderColor}; color: #f4f4f5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                  User
                  <input id="agy-user-av-upload" type="file" accept="image/*" style="display: none;" />
                </label>
                <button id="agy-user-av-clear" type="button" style="padding: 4px 8px; border-radius: 7px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.14); color: #a1a1aa; font-size: 11.5px; cursor: pointer;">Off</button>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div id="agy-agent-av-preview" style="width: 30px; height: 30px; border-radius: ${st.avatarRadius}%; border: 1.5px solid ${mainTheme.secondary || mainTheme.primary}; background: rgba(255,255,255,0.06) ${effAgentAv ? `url('${effAgentAv}') center/cover no-repeat` : ''}; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #a1a1aa;">${effAgentAv ? '' : 'AI'}</div>
                <label style="padding: 4px 10px; border-radius: 7px; background: rgba(255, 255, 255, 0.08); border: 1px solid ${mainTheme.borderColor}; color: #f4f4f5; font-size: 12px; cursor: pointer; white-space: nowrap;">
                  Agent
                  <input id="agy-agent-av-upload" type="file" accept="image/*" style="display: none;" />
                </label>
                <button id="agy-agent-av-clear" type="button" style="padding: 4px 8px; border-radius: 7px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.14); color: #a1a1aa; font-size: 11.5px; cursor: pointer;">Off</button>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.07);">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #a1a1aa;">
              Size
              <input id="agy-av-size" type="range" min="22" max="52" value="${st.avatarSize}" style="width: 100px; cursor: pointer; accent-color: ${mainTheme.primary}; height: 5px;" />
              <span id="agy-av-size-val" style="min-width: 34px;">${st.avatarSize}px</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #a1a1aa;">
              Corner Radius
              <input id="agy-av-rad" type="range" min="0" max="50" value="${st.avatarRadius}" style="width: 100px; cursor: pointer; accent-color: ${mainTheme.primary}; height: 5px;" />
              <span id="agy-av-rad-val" style="min-width: 34px;">${st.avatarRadius}%</span>
            </label>
          </div>
        </div>

        <div style="margin-bottom: 28px;">
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">User Chat Bubble</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 14px;">Mix and match bubble frame & ornament independently from the active wallpaper.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${PUBLIC_THEME_KEYS.map(name => {
              const th = resolveTheme(name, st);
              const isSelected = name === st.bubbleName || (name === 'Railway Horizon' && st.bubbleName === 'Railway Horizon (Dynamic)');
              const stickerTop = th.isOrnament ? Math.round((th.stickerTop || 0) * 0.85) : Math.round((th.stickerTop || 0) * 0.74);
              const stickerW = Math.round((th.stickerW || 0) * 0.78);
              const stickerH = th.isOrnament ? Math.round((th.stickerH || 0) * 0.8) : Math.round((th.stickerH || 0) * 0.78);
              return `
                <div class="agy-bubble-card" data-name="${name}" style="position: relative; border-radius: 12px; border: ${isSelected ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)'}; background: ${isSelected ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)'}; padding: 24px 18px 14px 18px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px; transition: border-color 0.15s ease, background-color 0.15s ease;">
                  <div style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 6px; margin-bottom: 10px;">
                    <div style="position: relative; width: 192px; height: 46px; padding: 1.2px; border-radius: ${th.isScroll ? '6px' : '12px'}; background: ${th.frameBg}; box-shadow: 0 4px 14px rgba(0,0,0,0.45), 0 0 10px ${th.glow};">
                      <div style="position: relative; width: 100%; height: 100%; background: ${th.bg}; border: ${th.innerBorder || '1px solid ' + th.borderColor}; border-radius: ${th.isScroll ? '4px' : '11px'}; display: flex; align-items: center; padding: 0 16px;">
                        ${th.sticker ? `<div style="position: absolute; top: ${stickerTop}px; right: 8px; width: ${stickerW}px; height: ${stickerH}px; background-image: url('${th.sticker}'); background-size: contain; background-position: ${th.isOrnament ? 'center' : 'bottom center'}; background-repeat: no-repeat; pointer-events: none;"></div>` : ''}
                        <span style="font-size: 13.5px; font-weight: 500; color: ${th.textColor};">Hello ✨</span>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13.5px; font-weight: 500; color: #e4e4e7;">${name}</span>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="margin-bottom: 28px;">
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Composer Style</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 14px;">Customize the chat input frame without affecting keyboard shortcuts or attachments.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${Object.entries(INPUT_STYLES).map(([key, item]) => {
              const isSelected = key === st.inputStyle;
              const activeBubbleTh = resolveTheme(st.bubbleName) || mainTheme;
              const previewStickerStyle = activeBubbleTh.isOrnament
                ? 'top: -12px; right: 10px; width: 72px; height: 22px; background-position: center;'
                : 'top: -22px; right: 10px; width: 32px; height: 28px; background-position: bottom center;';
              const previewInnerBg = key === 'glass'
                ? (activeBubbleTh.inputGlassBg || 'rgba(20, 15, 13, 0.45)')
                : (activeBubbleTh.inputCardBg || 'rgba(26, 18, 15, 0.92)');
              return `
                <div class="agy-input-card" data-style="${key}" style="border-radius: 12px; border: ${isSelected ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)'}; background: ${isSelected ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)'}; padding: 16px 18px; cursor: pointer; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.15s ease, background-color 0.15s ease;">
                  <div class="agy-input-preview-outer" style="position: relative; margin-top: 8px; padding: 1.5px; border-radius: 10px; background: ${key === 'double_gold' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : activeBubbleTh.frameBg};">
                    <div class="agy-input-preview-sticker" style="position: absolute; ${previewStickerStyle} background-image: url('${activeBubbleTh.sticker || ''}'); background-size: contain; background-repeat: no-repeat; display: ${key !== 'minimal' && activeBubbleTh.sticker ? 'block' : 'none'}; pointer-events: none;"></div>
                    <div class="agy-input-preview-inner" style="background: ${previewInnerBg}; border-radius: 9px; padding: 8px 12px; font-size: 12px; color: #a1a1aa; display: flex; justify-content: space-between; align-items: center;">
                      <span>Ask anything, @ to mention...</span>
                      <span class="agy-input-preview-turbo" style="color: ${activeBubbleTh.primary}; font-size: 11px;">Send →</span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 13.5px; font-weight: 500; color: #e4e4e7;">${item.label}</div>
                      <div style="font-size: 11.5px; color: #a1a1aa;">${item.desc}</div>
                    </div>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div>
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Theme Presets (${PUBLIC_THEME_KEYS.length})</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 14px;">Complete backdrop, palette, unified L-glass, and matching ornaments.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${PUBLIC_THEME_KEYS.map(name => {
              const th = THEMES[name];
              const resolvedTh = resolveTheme(name, st);
              const isSelected = name === st.themeName || (name === 'Railway Horizon' && st.themeName === 'Railway Horizon (Dynamic)');
              const thumbWp = (th.isDynamic ? resolvedTh.wallpaper : th.wallpaper);
              const thumbBg = thumbWp
                ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(14,12,12,0.85)), url('${thumbWp}')`
                : (th.pureBg || th.bg);
              const thumbOrnamentStyle = th.isOrnament
                ? 'right: 10px; bottom: 8px; width: 76px; height: 24px; background-position: center;'
                : 'right: 12px; bottom: 4px; width: 42px; height: 38px; background-position: bottom center;';
              const dynamicBadge = th.isDynamic
                ? `<span style="font-size: 10px; font-weight: 600; background: rgba(56, 189, 248, 0.22); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.45); border-radius: 4px; padding: 2px 6px; margin-left: 6px;">⏰ Auto ${st.dynamicStart}h-${st.dynamicEnd}h</span>`
                : '';
              return `
                <div class="agy-preset-card" data-name="${name}" style="border-radius: 12px; border: ${isSelected ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)'}; background: rgba(14, 12, 12, 0.82); overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: border-color 0.15s ease;">
                  <div style="height: 68px; width: 100%; background-image: ${thumbBg}; background-size: cover; background-position: ${th.bgPosition || 'center'}; position: relative; display: flex; align-items: flex-end; padding: 8px 14px;">
                    ${th.sticker ? `<div style="position: absolute; ${thumbOrnamentStyle} background-image: url('${th.sticker}'); background-size: contain; background-repeat: no-repeat; pointer-events: none;"></div>` : ''}
                    <div style="display: flex; align-items: center;"><span style="font-size: 13.5px; font-weight: 600; color: #fff;">${name}</span>${dynamicBadge}</div>
                  </div>
                  <div style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: #a1a1aa;">${th.concept || ''}</span>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    function updateInputPreviews(bName) {
      const activeTh = resolveTheme(bName);
      container.querySelectorAll('.agy-input-card').forEach(card => {
        const key = card.dataset.style;
        const outer = card.querySelector('.agy-input-preview-outer');
        if (outer) {
          outer.style.background = key === 'double_gold'
            ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
            : activeTh.frameBg;
        }
        const inner = card.querySelector('.agy-input-preview-inner');
        if (inner) {
          inner.style.background = key === 'glass'
            ? (activeTh.inputGlassBg || 'rgba(20, 15, 13, 0.45)')
            : (activeTh.inputCardBg || 'rgba(26, 18, 15, 0.92)');
        }
        const sticker = card.querySelector('.agy-input-preview-sticker');
        if (sticker) {
          if (key !== 'minimal' && activeTh.sticker) {
            sticker.style.display = 'block';
            sticker.style.backgroundImage = `url('${activeTh.sticker}')`;
            if (activeTh.isOrnament) {
              sticker.style.top = '-12px';
              sticker.style.width = '72px';
              sticker.style.height = '22px';
              sticker.style.backgroundPosition = 'center';
            } else {
              sticker.style.top = '-22px';
              sticker.style.width = '32px';
              sticker.style.height = '28px';
              sticker.style.backgroundPosition = 'bottom center';
            }
          } else {
            sticker.style.display = 'none';
          }
        }
        const turbo = card.querySelector('.agy-input-preview-turbo');
        if (turbo) {
          turbo.style.color = activeTh.primary;
        }
      });
    }

    const slider = container.querySelector('#agy-dim-slider');
    const valLabel = container.querySelector('#agy-dim-val');
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      valLabel.textContent = v + '%';
      applyTheme({ dimming: v });
    });

    const wpToggle = container.querySelector('#agy-wp-toggle');
    wpToggle.addEventListener('change', (e) => {
      applyTheme({ wpEnabled: e.target.checked });
    });

    const leavesToggle = container.querySelector('#agy-leaves-toggle');
    const particleControlsRow = container.querySelector('#agy-particle-controls-row');
    if (leavesToggle) {
      leavesToggle.addEventListener('change', (e) => {
        if (particleControlsRow) {
          particleControlsRow.style.display = e.target.checked ? 'flex' : 'none';
        }
        applyTheme({ leavesEnabled: e.target.checked });
      });
    }

    const countSlider = container.querySelector('#agy-particle-count-slider');
    const countVal = container.querySelector('#agy-particle-count-val');
    if (countSlider) {
      countSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (countVal) countVal.textContent = String(v);
        applyTheme({ particleCount: v });
      });
    }

    const speedSlider = container.querySelector('#agy-particle-speed-slider');
    const speedVal = container.querySelector('#agy-particle-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const raw = parseInt(e.target.value, 10);
        const v = Math.round(raw) / 100;
        if (speedVal) speedVal.textContent = v.toFixed(1) + 'x';
        applyTheme({ particleSpeed: v });
      });
    }

    const particleSelect = container.querySelector('#agy-particle-select');
    const particleLabel = container.querySelector('#agy-particle-label');
    if (particleSelect) {
      particleSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        const curTheme = resolveTheme(getState().themeName);
        const effectiveMode = mode === 'auto' ? (curTheme.particleType || 'sakura') : mode;
        if (particleLabel) {
          particleLabel.textContent = effectiveMode === 'sakura' ? '🌸 Hoa anh đào rơi' : '🍂 Lá vàng rơi';
        }
        applyTheme({ particleType: mode });
      });
    }

    const dynStartSelect = container.querySelector('#agy-dynamic-start-select');
    const dynEndSelect = container.querySelector('#agy-dynamic-end-select');
    const dynStatusBadge = container.querySelector('#agy-dynamic-status-badge');
    const dynScheduleBox = container.querySelector('#agy-dynamic-schedule-box');

    function updateDynamicBadge(s, e) {
      const isDay = isHourDaytime(new Date().getHours(), s, e);
      if (dynStatusBadge) {
        dynStatusBadge.textContent = isDay ? '☀️ Đang áp dụng: Ban ngày' : '🌅 Đang áp dụng: Hoàng hôn';
        dynStatusBadge.style.color = isDay ? '#bae6fd' : '#fde68a';
      }
    }

    if (dynStartSelect && dynEndSelect) {
      const onScheduleChange = () => {
        const s = parseInt(dynStartSelect.value, 10);
        const e = parseInt(dynEndSelect.value, 10);
        updateDynamicBadge(s, e);
        applyTheme({ dynamicStart: s, dynamicEnd: e });
      };
      dynStartSelect.addEventListener('change', onScheduleChange);
      dynEndSelect.addEventListener('change', onScheduleChange);
    }

    const wpUpload = container.querySelector('#agy-wp-upload');
    wpUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        applyTheme({ customWp: reader.result, wpEnabled: true });
        const toggle = container.querySelector('#agy-wp-toggle');
        if (toggle) toggle.checked = true;
      };
      reader.readAsDataURL(file);
    });

    const userAvUpload = container.querySelector('#agy-user-av-upload');
    const userAvPreview = container.querySelector('#agy-user-av-preview');
    const userAvClear = container.querySelector('#agy-user-av-clear');
    const agentAvUpload = container.querySelector('#agy-agent-av-upload');
    const agentAvPreview = container.querySelector('#agy-agent-av-preview');
    const agentAvClear = container.querySelector('#agy-agent-av-clear');

    function syncAvPreview(el, url, fallbackText) {
      if (!el) return;
      if (url) {
        el.style.backgroundImage = `url("${url}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      } else {
        el.style.backgroundImage = 'none';
        el.textContent = fallbackText;
      }
    }

    if (userAvUpload) {
      userAvUpload.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        compressAvatarFile(file, (dataUrl) => {
          applyTheme({ userAvatar: dataUrl });
          syncAvPreview(userAvPreview, dataUrl, 'U');
        });
      });
    }
    if (userAvClear) {
      userAvClear.addEventListener('click', () => {
        applyTheme({ userAvatar: 'none' });
        syncAvPreview(userAvPreview, '', 'U');
      });
    }
    if (agentAvUpload) {
      agentAvUpload.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        compressAvatarFile(file, (dataUrl) => {
          applyTheme({ agentAvatar: dataUrl });
          syncAvPreview(agentAvPreview, dataUrl, 'AI');
        });
      });
    }
    if (agentAvClear) {
      agentAvClear.addEventListener('click', () => {
        applyTheme({ agentAvatar: 'none' });
        syncAvPreview(agentAvPreview, '', 'AI');
      });
    }

    const blurSlider = container.querySelector('#agy-blur-slider');
    const blurLabel = container.querySelector('#agy-blur-val');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (blurLabel) blurLabel.textContent = v + 'px';
        applyTheme({ glassBlur: v });
      });
    }

    const avSizeSlider = container.querySelector('#agy-av-size');
    const avSizeVal = container.querySelector('#agy-av-size-val');
    if (avSizeSlider) {
      avSizeSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (avSizeVal) avSizeVal.textContent = v + 'px';
        applyTheme({ avatarSize: v });
      });
    }

    const avRadSlider = container.querySelector('#agy-av-rad');
    const avRadVal = container.querySelector('#agy-av-rad-val');
    if (avRadSlider) {
      avRadSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (avRadVal) avRadVal.textContent = v + '%';
        if (userAvPreview) userAvPreview.style.borderRadius = v + '%';
        if (agentAvPreview) agentAvPreview.style.borderRadius = v + '%';
        applyTheme({ avatarRadius: v });
      });
    }

    const exportBtn = container.querySelector('#agy-export-btn');
    const importToggle = container.querySelector('#agy-import-toggle');
    const importBox = container.querySelector('#agy-import-box');
    const importText = container.querySelector('#agy-import-text');
    const importApply = container.querySelector('#agy-import-apply');
    const importMsg = container.querySelector('#agy-import-msg');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const json = JSON.stringify(getState(), null, 2);
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(json).then(() => {
            exportBtn.textContent = 'Copied ✓';
            setTimeout(() => { exportBtn.textContent = 'Export JSON'; }, 1500);
          }).catch(() => {
            if (importBox && importText) {
              importBox.style.display = 'flex';
              importText.value = json;
              importText.select();
            }
          });
        } else if (importBox && importText) {
          importBox.style.display = 'flex';
          importText.value = json;
          importText.select();
        }
      });
    }
    if (importToggle && importBox) {
      importToggle.addEventListener('click', () => {
        importBox.style.display = importBox.style.display === 'none' ? 'flex' : 'none';
        if (importMsg) importMsg.textContent = '';
      });
    }
    if (importApply && importText) {
      importApply.addEventListener('click', () => {
        try {
          const parsed = JSON.parse(importText.value.trim());
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Config must be a JSON object');
          }
          const allowed = {};
          const keys = ['themeName', 'bubbleName', 'inputStyle', 'dimming', 'wpEnabled', 'customWp', 'userAvatar', 'agentAvatar', 'glassBlur', 'avatarSize', 'avatarRadius', 'leavesEnabled', 'dynamicStart', 'dynamicEnd', 'particleType', 'particleCount', 'particleSpeed'];
          keys.forEach((k) => {
            if (parsed[k] !== undefined) allowed[k] = parsed[k];
          });
          applyTheme(allowed);
          renderThemePanels(container);
        } catch (err) {
          if (importMsg) importMsg.textContent = 'Invalid JSON: ' + err.message;
        }
      });
    }

    const resetBtn = container.querySelector('#agy-reset-btn');
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_CUSTOM_WP);
      localStorage.removeItem(STORAGE_USER_AVATAR);
      localStorage.removeItem(STORAGE_AGENT_AVATAR);
      localStorage.removeItem(STORAGE_GLASS_BLUR);
      localStorage.removeItem(STORAGE_AVATAR_SIZE);
      localStorage.removeItem(STORAGE_AVATAR_RADIUS);
      localStorage.removeItem(STORAGE_THEME);
      localStorage.removeItem(STORAGE_BUBBLE);
      localStorage.removeItem(STORAGE_INPUT);
      localStorage.removeItem(STORAGE_DIMMING);
      localStorage.removeItem(STORAGE_WP_ENABLED);
      localStorage.removeItem(STORAGE_LEAVES_ENABLED);
      localStorage.removeItem(STORAGE_DYNAMIC_START);
      localStorage.removeItem(STORAGE_DYNAMIC_END);
      localStorage.removeItem(STORAGE_PARTICLE_TYPE);
      localStorage.removeItem(STORAGE_PARTICLE_COUNT);
      localStorage.removeItem(STORAGE_PARTICLE_SPEED);
      applyTheme({
        themeName: DEFAULT_THEME_KEY,
        bubbleName: DEFAULT_THEME_KEY,
        inputStyle: 'sync',
        dimming: 69,
        wpEnabled: true,
        customWp: '',
        userAvatar: '',
        agentAvatar: '',
        glassBlur: 3,
        avatarSize: 32,
        avatarRadius: 50,
        leavesEnabled: true,
        dynamicStart: 6,
        dynamicEnd: 16,
        particleType: 'auto',
        particleCount: 18,
        particleSpeed: 1.0
      });
      const defTh = THEMES[DEFAULT_THEME_KEY] || {};
      syncAvPreview(userAvPreview, defTh.userAvatar || '', 'U');
      syncAvPreview(agentAvPreview, defTh.agentAvatar || '', 'AI');
      if (userAvPreview) userAvPreview.style.borderRadius = '50%';
      if (agentAvPreview) agentAvPreview.style.borderRadius = '50%';
      if (slider) slider.value = 69;
      if (valLabel) valLabel.textContent = '69%';
      if (blurSlider) blurSlider.value = 3;
      if (blurLabel) blurLabel.textContent = '3px';
      if (avSizeSlider) avSizeSlider.value = 32;
      if (avSizeVal) avSizeVal.textContent = '32px';
      if (avRadSlider) avRadSlider.value = 50;
      if (avRadVal) avRadVal.textContent = '50%';
      if (wpToggle) wpToggle.checked = true;
      if (leavesToggle) leavesToggle.checked = true;
      if (particleControlsRow) particleControlsRow.style.display = 'flex';
      if (countSlider) countSlider.value = 18;
      if (countVal) countVal.textContent = '18';
      if (speedSlider) speedSlider.value = 100;
      if (speedVal) speedVal.textContent = '1.0x';

      container.querySelectorAll('.agy-preset-card').forEach(c => {
        const isSel = c.dataset.name === DEFAULT_THEME_KEY;
        c.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
        const slot = c.querySelector('.agy-card-check-slot');
        if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
      });
      container.querySelectorAll('.agy-bubble-card').forEach(b => {
        const isSel = b.dataset.name === DEFAULT_THEME_KEY;
        b.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
        b.style.background = isSel ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)';
        const slot = b.querySelector('.agy-card-check-slot');
        if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
      });
      container.querySelectorAll('.agy-input-card').forEach(c => {
        const isSel = c.dataset.style === 'sync';
        c.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
        c.style.background = isSel ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)';
        const slot = c.querySelector('.agy-card-check-slot');
        if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
      });
      updateInputPreviews(DEFAULT_THEME_KEY);
    });

    container.querySelectorAll('.agy-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        applyTheme({ themeName: name, bubbleName: name, customWp: '' });

        const chosenTh = THEMES[name];
        if (dynScheduleBox) {
          dynScheduleBox.style.display = (chosenTh && chosenTh.isDynamic) ? 'flex' : 'none';
        }
        if (particleLabel) {
          const effectiveMode = (getState().particleType && getState().particleType !== 'auto')
            ? getState().particleType
            : (chosenTh?.particleType || 'sakura');
          particleLabel.textContent = effectiveMode === 'sakura' ? '🌸 Hoa anh đào rơi' : '🍂 Lá vàng rơi';
        }

        container.querySelectorAll('.agy-preset-card').forEach(c => {
          const isSel = c.dataset.name === name;
          c.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
          const slot = c.querySelector('.agy-card-check-slot');
          if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
        });

        container.querySelectorAll('.agy-bubble-card').forEach(b => {
          const isSel = b.dataset.name === name;
          b.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
          b.style.background = isSel ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)';
          const slot = b.querySelector('.agy-card-check-slot');
          if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
        });

        updateInputPreviews(name);
      });
    });

    container.querySelectorAll('.agy-bubble-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        applyTheme({ bubbleName: name });

        container.querySelectorAll('.agy-bubble-card').forEach(b => {
          const isSel = b.dataset.name === name;
          b.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
          b.style.background = isSel ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)';
          const slot = b.querySelector('.agy-card-check-slot');
          if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
        });

        updateInputPreviews(name);
      });
    });

    container.querySelectorAll('.agy-input-card').forEach(card => {
      card.addEventListener('click', () => {
        const styleKey = card.dataset.style;
        applyTheme({ inputStyle: styleKey });

        container.querySelectorAll('.agy-input-card').forEach(c => {
          const isSel = c.dataset.style === styleKey;
          c.style.border = isSel ? '1.5px solid #f4f4f5' : '1px solid rgba(255, 255, 255, 0.12)';
          c.style.background = isSel ? 'rgba(42, 34, 30, 0.68)' : 'rgba(14, 12, 12, 0.78)';
          const slot = c.querySelector('.agy-card-check-slot');
          if (slot) slot.innerHTML = isSel ? CHECK_SVG : '';
        });
      });
    });
  }

  function injectMainSidebarButton() {
    const existing = document.getElementById('agy-custom-theme-sidebar-btn');
    if (existing) existing.remove();
  }

  function injectSettingsModalButton() {
    const modal = document.querySelector('.settings-modal-container');
    if (!modal || document.getElementById('agy-custom-theme-settings-btn')) return;

    const headers = Array.from(modal.querySelectorAll('h2, h3'));
    const appearanceHeader = headers.find(h => h.textContent?.trim() === 'Appearance');
    if (!appearanceHeader) return;

    let targetContainer = appearanceHeader.parentElement;
    while (targetContainer && !targetContainer.className.includes('justify-between') && targetContainer !== modal) {
      targetContainer = targetContainer.parentElement;
    }

    if (!targetContainer || !targetContainer.parentNode) return;

    Array.from(targetContainer.parentNode.children).forEach(child => {
      if (child.id === 'agy-custom-theme-settings-btn') child.remove();
    });

    const btn = document.createElement('button');
    btn.id = 'agy-custom-theme-settings-btn';
    btn.type = 'button';
    btn.className = 'select-none rounded px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer text-white';
    btn.style.cssText = 'background: linear-gradient(135deg, #e08e55 0%, #b45309 100%); border: 1px solid rgba(251, 191, 36, 0.4); box-shadow: 0 2px 10px rgba(224, 142, 85, 0.3); margin-top: 8px; margin-bottom: 8px; display: inline-flex; align-items: center; gap: 6px;';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span>Open Custom Theme Studio</span>
    `;

    targetContainer.parentNode.insertBefore(btn, targetContainer.nextSibling);

    btn.addEventListener('click', () => {
      window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
    });
  }

  function hookSidebarScroll() {
    if (!window.__AGY_SCROLL_AC__) return;
    const sidebar = document.querySelector('.agy-shell aside, .agy-shell [data-sidebar="true"], .agy-shell .bg-sidebar');
    if (!sidebar) return;
    const scrollers = sidebar.querySelectorAll('.overflow-y-auto');
    scrollers.forEach(sc => {
      if (sc.dataset.agyScrollBound) return;
      sc.dataset.agyScrollBound = '1';
      let wasScrolled = sc.scrollTop > 2;
      sc.classList.toggle('agy-scrolled', wasScrolled);
      sc.addEventListener('scroll', () => {
        const isScrolled = sc.scrollTop > 2;
        if (isScrolled !== wasScrolled) {
          wasScrolled = isScrolled;
          sc.classList.toggle('agy-scrolled', isScrolled);
        }
      }, { passive: true, signal: window.__AGY_SCROLL_AC__.signal });
    });
  }

  function syncShellMetrics() {
    const shell = document.querySelector('.agy-shell');
    if (!shell) return;
    const split = shell.querySelector('[data-testid="sidebar-split"]');
    const sidebarPane = split ? split.firstElementChild : null;
    const titleBar = shell.querySelector('[class*="@container/titlebar"]');
    const sw = sidebarPane ? Math.round(sidebarPane.getBoundingClientRect().width) : 0;
    const shellRect = shell.getBoundingClientRect();
    const hdrBottom = titleBar ? Math.round(titleBar.getBoundingClientRect().bottom - shellRect.top) : 35;
    if (sw !== _lastSw) {
      _lastSw = sw;
      shell.style.setProperty('--agy-sidebar-w', sw + 'px');
    }
    if (hdrBottom !== _lastHdrBottom) {
      _lastHdrBottom = hdrBottom;
      shell.style.setProperty('--agy-hdr-h', hdrBottom + 'px');
    }

    const hasHoleAttr = document.body.getAttribute('data-has-browser-hole') === 'true';
    const holeEl = hasHoleAttr ? shell.querySelector('[data-browser-hole]:not([data-browser-hole="false"])') : null;
    if (holeEl) {
      if (window.__AGY_SHELL_RO__ && window.__AGY_HOLE_EL__ !== holeEl) {
        try { window.__AGY_SHELL_RO__.observe(holeEl); } catch (e) {}
        window.__AGY_HOLE_EL__ = holeEl;
      }
      const hRect = holeEl.getBoundingClientRect();
      if (hRect.width > 1 && hRect.height > 1) {
        const l = Math.max(0, Math.round(hRect.left - shellRect.left));
        const t = Math.max(0, Math.round(hRect.top - shellRect.top));
        const r = Math.max(l, Math.round(hRect.right - shellRect.left));
        const b = Math.max(t, Math.round(hRect.bottom - shellRect.top));
        const holeClip = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px ${t}px)`;
        if (holeClip !== _lastHoleClip) {
          _lastHoleClip = holeClip;
          shell.style.setProperty('--agy-hole-clip', holeClip);
        }
        shell.dataset.agyHoleActive = '1';
        delete shell.dataset.agySideGlass;
        return;
      }
    }
    window.__AGY_HOLE_EL__ = null;
    delete shell.dataset.agyHoleActive;
    if (_lastHoleClip) {
      _lastHoleClip = '';
      shell.style.removeProperty('--agy-hole-clip');
    }

    const sideBody = shell.querySelector('[data-side-panel-body="true"]');
    if (sideBody) {
      if (window.__AGY_SHELL_RO__ && window.__AGY_SIDE_EL__ !== sideBody) {
        try { window.__AGY_SHELL_RO__.observe(sideBody); } catch (e) {}
        window.__AGY_SIDE_EL__ = sideBody;
      }
      const sRect = sideBody.getBoundingClientRect();
      const hasContent = sideBody.children.length > 0;
      if (hasContent && sRect.width > 24 && sRect.height > 24 && sRect.left < shellRect.right - 8 && sRect.right > shellRect.left + 8) {
        const sl = Math.max(sw, Math.round(sRect.left - shellRect.left));
        const st = Math.max(hdrBottom, Math.round(sRect.top - shellRect.top));
        const sr = Math.min(Math.round(shellRect.width), Math.max(sl, Math.round(sRect.right - shellRect.left)));
        const sb = Math.min(Math.round(shellRect.height), Math.max(st, Math.round(sRect.bottom - shellRect.top)));
        if (sr - sl > 20 && sb - st > 20) {
          const sideDims = `${sl},${st},${sr},${sb}`;
          if (sideDims !== _lastSideDims) {
            _lastSideDims = sideDims;
            shell.style.setProperty('--agy-side-l', sl + 'px');
            shell.style.setProperty('--agy-side-t', st + 'px');
            shell.style.setProperty('--agy-side-r', sr + 'px');
            shell.style.setProperty('--agy-side-b', sb + 'px');
          }
          shell.dataset.agySideGlass = '1';
          return;
        }
      }
    }
    delete shell.dataset.agySideGlass;
  }

  function hookShellMetrics() {
    const shell = document.querySelector('.agy-shell');
    if (!shell) return;
    if (!shell.dataset.agyTboMounted) {
      shell.dataset.agyTboMounted = '1';
      scheduleTitleBarSync();
    }
    if (!window.__AGY_SHELL_RO__ && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (!window.__AGY_METRIC_RAF__) {
          window.__AGY_METRIC_RAF__ = requestAnimationFrame(() => {
            window.__AGY_METRIC_RAF__ = 0;
            syncShellMetrics();
          });
        }
      });
      ro.observe(shell);
      const sidebarPane = shell.querySelector('[data-testid="sidebar-split"]')?.firstElementChild;
      if (sidebarPane) ro.observe(sidebarPane);
      window.__AGY_SHELL_RO__ = ro;

      window.addEventListener('resize', () => {
        if (!window.__AGY_METRIC_RAF__) {
          window.__AGY_METRIC_RAF__ = requestAnimationFrame(() => {
            window.__AGY_METRIC_RAF__ = 0;
            syncShellMetrics();
          });
        }
      }, { passive: true, signal: window.__AGY_SCROLL_AC__.signal });
    }
  }

  function injectRunningDogs() {
    const st = getState();
    const theme = resolveTheme(st.themeName);
    const runningDogsSrc = (theme && theme.runningDogs)
      ? theme.runningDogs
      : (Object.values(THEMES).find(t => t && t.runningDogs)?.runningDogs || '');

    const existing = document.getElementById('agy-running-dogs-banner');
    if (!runningDogsSrc) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.isConnected) {
      if (existing.dataset.src !== runningDogsSrc) {
        existing.dataset.src = runningDogsSrc;
        const img = existing.querySelector('img');
        if (img) img.src = runningDogsSrc;
      }
      return;
    }

    const sidebars = document.querySelectorAll('.bg-sidebar, [data-sidebar="true"]');
    let span = null;
    for (const sb of sidebars) {
      const found = Array.from(sb.querySelectorAll('span')).find(s => s.textContent?.trim() === 'Projects');
      if (found) { span = found; break; }
    }
    if (!span) {
      span = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.trim() === 'Projects');
    }
    if (!span) return;
    const header = span.closest('.group\\/section-header') || span.closest('h2')?.parentElement || span.closest('div');
    if (!header || !header.parentNode) return;

    const banner = document.createElement('div');
    banner.id = 'agy-running-dogs-banner';
    banner.dataset.src = runningDogsSrc;
    banner.title = '🐾 Bấm vào đàn cún để mở Cài đặt Theme (Custom Theme)';
    banner.style.cssText = 'height: 44px; position: relative; overflow: visible; margin: 8px 10px 2px 10px; background: transparent !important; border: none !important; box-shadow: none !important; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; user-select: none; transform: translateZ(0); will-change: transform;';

    banner.innerHTML = `
      <img src="${runningDogsSrc}" alt="running dogs" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; pointer-events: none; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45)); transform: translateZ(0); will-change: transform, filter;" />
    `;

    banner.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      banner.style.transform = 'scale(0.92) translateZ(0)';
      setTimeout(() => { banner.style.transform = 'scale(1) translateZ(0)'; }, 150);
      if (typeof window.__ANTIGRAVITY_OPEN_THEME_MODAL__ === 'function') {
        window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
      }
    });

    header.parentNode.insertBefore(banner, header);
  }

  function checkDynamicTheme() {
    const st = getState();
    const th = THEMES[st.themeName];
    if (!th || !th.isDynamic) return;
    const currentSub = getDynamicSubThemeName(st.themeName, st);
    if (window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ && window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ !== currentSub) {
      window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ = currentSub;
      applyTheme(st);
    }
  }

  function tick() {
    checkDynamicTheme();
    injectMainSidebarButton();
    injectSettingsModalButton();
    injectRunningDogs();
    hookSidebarScroll();
    hookShellMetrics();
    hookTitleMenuBar();
    syncAutumnLeaves();
  }

  function hookTitleMenuBar() {
    const bar = document.querySelector('[data-testid="title-menu-bar"]');
    if (!bar || bar.dataset.agyMenuHooked) return;
    bar.dataset.agyMenuHooked = '1';

    let pointerDownTime = 0;
    let openedOnPointerDown = false;

    bar.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest?.('[data-testid="title-menu-bar-item"]');
      if (!btn) return;
      const wasOpenBefore = !!document.querySelector('.border-menu-border');
      pointerDownTime = performance.now();

      setTimeout(() => {
        const isOpenAfter = !!document.querySelector('.border-menu-border');
        if (!wasOpenBefore && isOpenAfter) {
          openedOnPointerDown = true;
          setTimeout(() => { openedOnPointerDown = false; }, 350);
        }
      }, 0);
    }, true);

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-testid="title-menu-bar-item"]');
      if (!btn) return;
      if (openedOnPointerDown || (performance.now() - pointerDownTime < 300 && !!document.querySelector('.border-menu-border'))) {
        e.stopPropagation();
        e.preventDefault();
        openedOnPointerDown = false;
      }
    }, true);
  }

  function removeAutumnLeaves() {
    if (window.__AGY_LEAVES_RAF__) {
      cancelAnimationFrame(window.__AGY_LEAVES_RAF__);
      window.__AGY_LEAVES_RAF__ = 0;
    }
    const canvas = document.getElementById('agy-autumn-leaves-canvas');
    if (canvas) canvas.remove();
  }

  function syncAutumnLeaves(stOverride) {
    const st = stOverride || getState();
    if (!st.leavesEnabled) {
      removeAutumnLeaves();
      return;
    }

    const shell = document.querySelector('.agy-shell');
    if (!shell) return;

    let canvas = document.getElementById('agy-autumn-leaves-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'agy-autumn-leaves-canvas';
      canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5 !important; opacity: 0.85; contain: strict; will-change: transform; transform: translateZ(0);';
      shell.insertBefore(canvas, shell.firstChild);
    }

    const activeMainTh = resolveTheme(st.themeName, st);
    const particleMode = (st.particleType && st.particleType !== 'auto')
      ? st.particleType
      : (activeMainTh.particleType || 'sakura');

    window.__AGY_PARTICLE_SPEED__ = typeof st.particleSpeed === 'number' ? st.particleSpeed : 1.0;
    window.__AGY_PARTICLE_TARGET_COUNT__ = typeof st.particleCount === 'number' ? st.particleCount : (particleMode === 'sakura' ? 18 : 14);

    if (canvas.dataset.running === '1' && canvas.dataset.mode === particleMode) return;
    canvas.dataset.running = '1';
    canvas.dataset.mode = particleMode;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = shell.clientWidth || window.innerWidth);
    let height = (canvas.height = shell.clientHeight || window.innerHeight);

    const onResize = () => {
      if (!canvas || !canvas.isConnected) return;
      width = canvas.width = shell.clientWidth || window.innerWidth;
      height = canvas.height = shell.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    const SAKURA_COLORS = [
      { fill: '#fbcfe8', stroke: '#f472b6', opacity: 0.76 },
      { fill: '#f472b6', stroke: '#db2777', opacity: 0.65 },
      { fill: '#fff1f2', stroke: '#fbcfe8', opacity: 0.82 },
      { fill: '#fda4af', stroke: '#f43f5e', opacity: 0.70 },
      { fill: '#fce7f3', stroke: '#ec4899', opacity: 0.72 }
    ];

    const AUTUMN_COLORS = [
      { fill: '#f59e0b', vein: '#b45309', opacity: 0.60 },
      { fill: '#eab308', vein: '#a16207', opacity: 0.65 },
      { fill: '#f97316', vein: '#c2410c', opacity: 0.55 },
      { fill: '#f43f5e', vein: '#9f1239', opacity: 0.50 },
      { fill: '#d97706', vein: '#78350f', opacity: 0.58 },
      { fill: '#fbbf24', vein: '#d97706', opacity: 0.62 }
    ];

    const PARTICLE_COUNT = particleMode === 'sakura' ? 18 : 14;
    const particles = [];

    function resetParticle(p, fromTop = true) {
      if (particleMode === 'sakura') {
        const pal = SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)];
        p.x = Math.random() * width;
        p.y = fromTop ? -(10 + Math.random() * 25) : Math.random() * height;
        p.size = 7 + Math.random() * 5;
        p.vy = 0.22 + Math.random() * 0.26;
        p.wind = 0.15 + Math.random() * 0.22;
        p.swing = Math.random() * Math.PI * 2;
        p.swingSpeed = 0.010 + Math.random() * 0.015;
        p.swingAmp = 0.7 + Math.random() * 0.9;
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = (Math.random() - 0.5) * 0.014;
        p.flip = Math.random() * Math.PI * 2;
        p.vFlip = 0.014 + Math.random() * 0.018;
        p.color = pal.fill;
        p.stroke = pal.stroke;
        p.opacity = pal.opacity * (0.75 + Math.random() * 0.25);
      } else {
        const pal = AUTUMN_COLORS[Math.floor(Math.random() * AUTUMN_COLORS.length)];
        p.x = Math.random() * width;
        p.y = fromTop ? -(10 + Math.random() * 25) : Math.random() * height;
        p.size = 8 + Math.random() * 6;
        p.vy = 0.20 + Math.random() * 0.28;
        p.wind = 0.10 + Math.random() * 0.18;
        p.swing = Math.random() * Math.PI * 2;
        p.swingSpeed = 0.008 + Math.random() * 0.012;
        p.swingAmp = 0.6 + Math.random() * 0.8;
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = (Math.random() - 0.5) * 0.012;
        p.flip = Math.random() * Math.PI * 2;
        p.vFlip = 0.012 + Math.random() * 0.016;
        p.color = pal.fill;
        p.stroke = pal.vein;
        p.opacity = pal.opacity * (0.7 + Math.random() * 0.3);
      }
      return p;
    }

    const initTargetCount = window.__AGY_PARTICLE_TARGET_COUNT__ || (particleMode === 'sakura' ? 18 : 14);
    for (let i = 0; i < initTargetCount; i++) {
      particles.push(resetParticle({}, false));
    }

    let isVisible = true;
    const onVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && !window.__AGY_LEAVES_RAF__) {
        lastTime = performance.now();
        render(lastTime);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    let lastTime = performance.now();
    function render(now) {
      if (!canvas || !canvas.isConnected) {
        window.__AGY_LEAVES_RAF__ = 0;
        return;
      }
      if (!isVisible) {
        window.__AGY_LEAVES_RAF__ = 0;
        return;
      }

      const targetCount = window.__AGY_PARTICLE_TARGET_COUNT__ || 18;
      while (particles.length < targetCount) {
        particles.push(resetParticle({}, true));
      }
      while (particles.length > targetCount) {
        particles.pop();
      }

      const speedMult = window.__AGY_PARTICLE_SPEED__ || 1.0;
      const elapsed = now - lastTime;
      lastTime = now;
      const dt = Math.min(2.0, Math.max(0.4, elapsed / 16.67));
      const spd = speedMult * dt;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const l = particles[i];
        l.swing += l.swingSpeed * spd;
        l.angle += l.vAngle * spd;
        l.flip += l.vFlip * spd;
        l.y += l.vy * spd;
        l.x += (l.wind + Math.sin(l.swing) * l.swingAmp) * spd;

        if (l.y > height + 25 || l.x > width + 25) {
          resetParticle(l, true);
        }

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        const curl = 0.65 + 0.35 * Math.cos(l.flip);
        ctx.scale(curl, 1);
        ctx.globalAlpha = l.opacity;

        if (particleMode === 'sakura') {
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.moveTo(0, l.size);
          ctx.bezierCurveTo(l.size * 0.75, l.size * 0.4, l.size * 0.85, -l.size * 0.5, l.size * 0.25, -l.size);
          ctx.quadraticCurveTo(0, -l.size * 0.75, -l.size * 0.25, -l.size);
          ctx.bezierCurveTo(-l.size * 0.85, -l.size * 0.5, -l.size * 0.75, l.size * 0.4, 0, l.size);
          ctx.fill();

          ctx.strokeStyle = l.stroke;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.moveTo(0, -l.size);
          ctx.bezierCurveTo(l.size * 0.68, -l.size * 0.30, l.size * 0.68, l.size * 0.60, 0, l.size);
          ctx.bezierCurveTo(-l.size * 0.68, l.size * 0.60, -l.size * 0.68, -l.size * 0.30, 0, -l.size);
          ctx.fill();

          ctx.strokeStyle = l.stroke;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, -l.size * 0.85);
          ctx.lineTo(0, l.size * 0.85);
          ctx.stroke();
        }

        ctx.restore();
      }

      window.__AGY_LEAVES_RAF__ = requestAnimationFrame(render);
    }

    if (window.__AGY_LEAVES_RAF__) {
      cancelAnimationFrame(window.__AGY_LEAVES_RAF__);
    }
    lastTime = performance.now();
    window.__AGY_LEAVES_RAF__ = requestAnimationFrame(render);
  }

  let _tickScheduled = false;
  let _tickTimer = 0;

  function scheduleTick() {
    if (_tickScheduled) return;
    _tickScheduled = true;
    clearTimeout(_tickTimer);
    _tickTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        _tickScheduled = false;
        tick();
      });
    }, 100);
  }

  clearTitleBarTimers();
  if (window.__AGY_TICK_RAF__) {
    cancelAnimationFrame(window.__AGY_TICK_RAF__);
    window.__AGY_TICK_RAF__ = 0;
  }
  if (window.__AGY_METRIC_RAF__) {
    cancelAnimationFrame(window.__AGY_METRIC_RAF__);
    window.__AGY_METRIC_RAF__ = 0;
  }
  if (window.__AGY_SHELL_RO__) {
    try { window.__AGY_SHELL_RO__.disconnect(); } catch (e) {}
    window.__AGY_SHELL_RO__ = null;
  }
  if (window.__AGY_DYNAMIC_TIMER__) {
    clearInterval(window.__AGY_DYNAMIC_TIMER__);
    window.__AGY_DYNAMIC_TIMER__ = 0;
  }
  window.__AGY_DYNAMIC_TIMER__ = setInterval(checkDynamicTheme, 30000);

  if (window.__AGY_SCROLL_AC__) {
    try { window.__AGY_SCROLL_AC__.abort(); } catch (e) {}
  }
  window.__AGY_SCROLL_AC__ = new AbortController();
  window.addEventListener('load', () => { scheduleTitleBarSync(); checkDynamicTheme(); }, { signal: window.__AGY_SCROLL_AC__.signal });
  window.addEventListener('focus', () => { syncTitleBarOverlay(); checkDynamicTheme(); }, { signal: window.__AGY_SCROLL_AC__.signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { syncTitleBarOverlay(); checkDynamicTheme(); }
  }, { signal: window.__AGY_SCROLL_AC__.signal });
  document.querySelectorAll('[data-agy-scroll-bound]').forEach(el => delete el.dataset.agyScrollBound);
  document.querySelectorAll('[data-agy-tbo-mounted]').forEach(el => delete el.dataset.agyTboMounted);
  document.querySelectorAll('[data-agy-menu-hooked]').forEach(el => delete el.dataset.agyMenuHooked);
  const staleLeaves = document.getElementById('agy-autumn-leaves-canvas');
  if (staleLeaves) staleLeaves.remove();
  const staleBackdrop = document.getElementById('agy-custom-theme-modal-backdrop');
  if (staleBackdrop) staleBackdrop.remove();
  const staleSidebarBtn = document.getElementById('agy-custom-theme-sidebar-btn');
  if (staleSidebarBtn) staleSidebarBtn.remove();
  const staleSettingsBtn = document.getElementById('agy-custom-theme-settings-btn');
  if (staleSettingsBtn) staleSettingsBtn.remove();
  const staleDogs = document.getElementById('agy-running-dogs-banner');
  if (staleDogs) staleDogs.remove();

  window.__AGY_HOLE_EL__ = null;
  if (window.__AGY_MODAL_OBSERVER__) {
    window.__AGY_MODAL_OBSERVER__.disconnect();
  }
  window.__AGY_MODAL_OBSERVER__ = new MutationObserver((mutations) => {
    let relevant = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'attributes') {
        if (m.attributeName === 'data-has-browser-hole' || m.attributeName === 'data-browser-hole') {
          relevant = true;
          break;
        }
        continue;
      }
      const target = m.target;
      if (target && target.nodeType === 1) {
        if (
          target.closest?.('[data-testid="agent-response"]') ||
          target.closest?.('[data-testid="user-message"]') ||
          target.closest?.('.surface-composer') ||
          target.closest?.('pre') ||
          target.closest?.('code') ||
          target.closest?.('#agy-custom-theme-modal-backdrop') ||
          target.closest?.('[data-testid="title-menu-bar"]') ||
          target.closest?.('.surface-opaque') ||
          target.closest?.('[role="menu"]') ||
          target.closest?.('[data-radix-popper-content-wrapper]') ||
          target.closest?.('div.border-menu-border')
        ) {
          continue;
        }
      }
      relevant = true;
      break;
    }
    if (relevant) {
      scheduleTick();
    }
  });
  window.__AGY_MODAL_OBSERVER__.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-has-browser-hole', 'data-browser-hole']
  });
  syncShellMetrics();
  tick();

  return 'Antigravity Custom Theme Engine Ready!';
})();
