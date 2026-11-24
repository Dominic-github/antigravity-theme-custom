---
name: antigravity-custom-theme
description: Use when the user wants to design, customize, install, update, or troubleshoot an Antigravity IDE or Manager visual theme from a wallpaper image, color palette, aesthetic mood, or preset.
---

# Antigravity Custom Theme Skill

Creates and applies custom glassmorphic themes (wallpapers, cohesive palettes, custom composer ornaments, pre-baked glass panels, and split-browser-safe overlays) to Antigravity without modifying application binaries.

## Repository Layout

- `themes/themes.json` — Theme presets (colors, wallpaper path, SVG ornaments, glass alpha/saturation defaults).
- `themes/assets/` — Raster wallpapers (`.webp`/`.png`/`.jpg`) and SVG stickers/corner flourishes.
- `engine/core.js` — Standalone DOM + CSS injection engine (Zero Live Blur, L-glass layout, split-browser hole cutout, composer pill contrast, live theme settings modal).
- `scripts/build_payload.py` — Compiles `themes/themes.json` + `engine/core.js` into gitignored `dist/theme_payload.js` (auto-downscales >2560px rasters to WebP when Pillow is installed).
- `daemon/theme_daemon.js` — Cross-platform Node.js (>= 22) CDP daemon watching `DevToolsActivePort` and `dist/theme_payload.js`.
- `scripts/install-win.ps1`, `scripts/install-unix.sh`, `scripts/uninstall.js`, `scripts/verify_cdp.js` — OS setup, removal, and live CDP verification.
- `references/theme-schema.md` — Exact `themes.json` schema, contrast rules, and Antigravity selector notes.

## Workflow

1. **Gather aesthetic & inspect image**
   - Ask briefly for any missing intent only if ambiguous (mood: cozy warm, cyberpunk neon, anime cel, cosmic gold, minimalist pure-CSS gradient, etc.).
   - If the user provides an image with an unwanted corner watermark/signature, clean/crop it cleanly before staging.
2. **Design cohesive tokens (Dark or Light Glass)**
   - Read `references/theme-schema.md` for every `themes.json` key.
   - Extract dominant & accent colors from the image to populate `primary`, `secondary`, `overlayRgb`, `bg`, `frameBg`, `sidebarBg`, `aiCardBg`, `headerBg`, `inputCardBg`, and `modalBg` with crisp readable contrast.
   - For bright/daytime/pastel wallpapers, set `"isLight": true` with high-contrast dark ink (`uiTextColor`, `pillTextColor`) and light frosted `aiCardBg`/`overlayRgb`.
   - When the user wants matching chat avatars (or provides character/themed artwork), also craft or crop square `userAvatar` & `agentAvatar` assets (PNG/WebP or bespoke SVG emblems) and custom `sticker`/`cornerSvg` flourishes.
3. **Stage assets & edit `themes/themes.json`**
   - Save wallpaper under `themes/assets/<slug>.webp` (or `.png`), optional SVG stickers/corners, and optional `userAvatar` / `agentAvatar` files under `themes/assets/`.
   - Add a new entry in `themes/themes.json` referencing `"assets/<filename>"` (keep existing sample presets unless asked to remove them).
   - Never hardcode personal OS paths (`C:\Users\...`, `/Users/...`, `/home/...`) in JSON, JS, or scripts.
4. **Compile & syntax-check payload**
   - Run `python scripts/build_payload.py` (or `python3 scripts/build_payload.py`).
   - Run `node --check dist/theme_payload.js` to ensure zero syntax issues.
5. **Run / hot-reload daemon**
   - **Windows:** `powershell -ExecutionPolicy Bypass -File scripts/install-win.ps1`
   - **macOS / Linux:** `bash scripts/install-unix.sh` (or `--foreground` for interactive testing)
   - If the daemon is already running, rebuilding `dist/theme_payload.js` triggers automatic hot-reload via `fs.watch`.
6. **Verify live via CDP**
   - Run `node scripts/verify_cdp.js` while Antigravity is open.
   - Confirm `themeActive: true`, `hasLiveBlurRule: false`, valid `.agy-shell` background, and readable composer pills before reporting success.

## Non-Negotiable Architecture Rules

- **Zero Live Blur:** Never add CSS `backdrop-filter: blur(...)` to `.agy-shell`, `.agy-chat-frame`, modals, or scrollable panes — Electron scrolling drops frames badly under live blur. `engine/core.js` pre-bakes blurred canvas textures (`syncPrebakedGlass`) instead.
- **Data-Only Theme Authoring:** Add themes in `themes/themes.json` + `themes/assets/`. Leave `engine/core.js` untouched unless Antigravity changes its upstream DOM selectors. Keep public theme names clean (avoid artist/brand tags like `WLOP`; use `THEME_ALIASES` in `engine/core.js` to migrate renamed keys cleanly).
- **Titlebar Stacking Context & Menus:** Never write `.agy-shell > *:not(#agy-autumn-leaves-canvas)` without `:where(...)` — an `#id` inside `:not()` gives ID specificity `(1, 0, 0)`, overriding the titlebar rule and trapping `[data-testid="title-menu-bar"]` dropdowns (`Antigravity`, `Workspace`, `View`, `Window`) behind the sidebar and particle canvas. Always keep `.agy-shell > :where(*:not(#agy-autumn-leaves-canvas))` at `z-index: 2`, `#agy-autumn-leaves-canvas` at `z-index: 5`, `.agy-shell > div:has([data-testid="title-menu-bar"])` at `z-index: 50`, and dropdown surfaces (`div.border-menu-border`, `[role="menu"]`, `[data-radix-menu-content]`, `.surface-opaque`) solid opaque `#121216`.
- **Split Browser Cutout (`data-has-browser-hole`):** Never paint opaque overlays over the right-side embedded browser pane, and never rely on `querySelector('[data-browser-hole]')` alone (cached inactive tabs leave `0×0` hole nodes in the DOM). Always scan all `[data-browser-hole]` nodes for a visible rect (`width > 24 && height > 24`), sync `syncShellMetrics()` on `tick()`, `ResizeObserver`, and `MutationObserver` (`data-has-browser-hole` / `data-browser-hole` attributes), and gate nested `.browser-hole-ancestor > :not(...)` transparency overrides strictly on `.agy-shell[data-agy-hole-active="1"]`.
- **Native Antigravity UI Grammar (Modal & HUD):** Any injected modal or settings entry must mirror Antigravity's native Settings UI (`"Google Sans Flex"` with `350–450` variable weights, `#111114` sidebar + `#070708` content pane, `24px` dialog radius, `rgba(255,255,255,0.06)` hairline dividers, tight `7px 12px` / `38px` grouped rows, `26px` pill controls, `var(--primary, #2f71e3)` switches, monochrome SVG icons). Never use rainbow emojis, verbose filler subtitles, neon modal borders, or loud gradient buttons inside native `Settings`.
- **Per-Theme Particles & Audio Hot-Reload:** Store particle ON/OFF and type per theme (`themeParticles` / `agy_theme_particles_v3`) using each preset's `particleType` default (`"none"` = off by default). Always call `stopWeatherAudio()` **before** `applyTheme()` at payload bootstrap so CDP hot-reloads never leak duplicate `AudioContext` instances.
- **No Personal Data Leakage:** Never commit personal OS paths, `theme_config.json`, or `weather_cache.json`.
- **Mandatory Visual & CDP Verification:** After every UI/CSS change, run `node --check engine/core.js`, `python scripts/build_payload.py`, `node --check dist/theme_payload.js`, and `node scripts/verify_cdp.js`, then verify live rendering (including titlebar dropdown stacking and split-browser pane when CSS/layout changes).

## Troubleshooting: Theme Disappeared After Antigravity Update

Antigravity v2.33.0+ no longer opens `DevToolsActivePort` by default when launched without `--remote-debugging-port=0`, and its auto-updater relaunches `Antigravity.exe --updated` directly (which can also reset shortcuts).

- **Windows:**
  1. Re-run `powershell -ExecutionPolicy Bypass -File scripts/install-win.ps1` — it patches `--remote-debugging-port=0` onto `Antigravity.lnk` shortcuts (Desktop, Start Menu, Startup, Taskbar).
  2. **Quit Antigravity completely** (System Tray -> Quit, not just closing the window) and reopen from **Start Menu**.
  3. If you launch from a **Taskbar pin**, unpin the old icon and re-pin it from the Start Menu `Antigravity` shortcut (direct `.exe` pins drop shortcut arguments).
- **macOS / Linux:**
  - Launch Antigravity with `--remote-debugging-port=0` (e.g., `open -a Antigravity --args --remote-debugging-port=0` on macOS, or add `--remote-debugging-port=0` to the `Exec=` line in your `.desktop` launcher on Linux).
