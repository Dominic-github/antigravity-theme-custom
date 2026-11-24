#!/usr/bin/env node
'use strict';

/**
 * Antigravity Custom Theme Daemon (Windows / macOS / Linux)
 * Connects to Antigravity CDP (DevToolsActivePort), injects dist/theme_payload.js,
 * persists user theme preferences in theme_config.json, and hot-reloads on rebuild.
 */

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

if (typeof globalThis.WebSocket !== 'function') {
    console.error('[theme-daemon] Node.js >= 22 with built-in WebSocket is required.');
    process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, '..');
const PID_FILE = path.join(ROOT_DIR, 'daemon.pid');
const CONFIG_FILE = process.env.AGY_CONFIG_PATH || path.join(ROOT_DIR, 'theme_config.json');
const WEATHER_CACHE_FILE = process.env.AGY_WEATHER_CACHE_PATH || path.join(ROOT_DIR, 'weather_cache.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PAYLOAD_PATH = path.join(DIST_DIR, 'theme_payload.js');
const LOG_FILE = path.join(ROOT_DIR, 'daemon.log');
const DEFAULT_CONFIG = {};

const WEATHER_POLL_MS = Math.max(60000, parseInt(process.env.AGY_WEATHER_POLL_MS || '600000', 10) || 600000);
const WEATHER_API_BASE = process.env.AGY_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_API_BASE = process.env.AGY_GEOCODE_API_URL || 'https://geocoding-api.open-meteo.com/v1/search';
const GEOIP_PRIMARY_URL = process.env.AGY_GEOIP_URL || 'https://ipwho.is/';
const GEOIP_FALLBACK_URL = process.env.AGY_GEOIP_FALLBACK_URL || 'https://get.geojs.io/v1/ip/geo.json';
const GEOIP_TERTIARY_URL = process.env.AGY_GEOIP_TERTIARY_URL || 'http://ip-api.com/json/?fields=status,country,city,regionName,lat,lon,timezone';

function resolvePortFile() {
    if (process.env.AGY_PORT_FILE) {
        return process.env.AGY_PORT_FILE;
    }

    const home = os.homedir();
    let candidates;
    if (process.platform === 'win32') {
        const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
        candidates = [
            path.join(appData, 'antigravity', 'DevToolsActivePort'),
            path.join(appData, 'Antigravity', 'DevToolsActivePort'),
        ];
    } else if (process.platform === 'darwin') {
        const appSupport = path.join(home, 'Library', 'Application Support');
        candidates = [
            path.join(appSupport, 'antigravity', 'DevToolsActivePort'),
            path.join(appSupport, 'Antigravity', 'DevToolsActivePort'),
        ];
    } else {
        const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
        candidates = [
            path.join(xdgConfig, 'antigravity', 'DevToolsActivePort'),
            path.join(xdgConfig, 'Antigravity', 'DevToolsActivePort'),
        ];
    }

    return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 512 * 1024) {
            fs.writeFileSync(LOG_FILE, '');
        }
        fs.appendFileSync(LOG_FILE, line);
    } catch (_) {}
    if (process.stdout.isTTY || process.env.AGY_DAEMON_STDOUT === '1') {
        process.stdout.write(line);
    }
}

function isPidAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (_) {
        return false;
    }
}

function acquirePidLock() {
    if (fs.existsSync(PID_FILE)) {
        const existingPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
        if (existingPid && existingPid !== process.pid && isPidAlive(existingPid)) {
            log(`Another daemon instance is already running (PID ${existingPid}). Exiting.`);
            process.exit(0);
        }
    }
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
}

function removePidLock() {
    try {
        if (fs.existsSync(PID_FILE)) {
            const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
            if (pid === process.pid) {
                fs.unlinkSync(PID_FILE);
            }
        }
    } catch (_) {}
}

function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (parsed && typeof parsed === 'object') {
                return { ...DEFAULT_CONFIG, ...parsed };
            }
        }
    } catch (err) {
        log(`Failed reading theme_config.json: ${err.message}`);
    }
    return { ...DEFAULT_CONFIG };
}

function saveConfig(next) {
    try {
        const merged = { ...readConfig(), ...next };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
        return merged;
    } catch (err) {
        log(`Failed saving theme_config.json: ${err.message}`);
        return null;
    }
}

let weatherState = null;
let weatherFetchInFlight = null;

function readWeatherCache() {
    try {
        if (fs.existsSync(WEATHER_CACHE_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(WEATHER_CACHE_FILE, 'utf8'));
            if (parsed && typeof parsed === 'object' && parsed.condition) {
                return parsed;
            }
        }
    } catch (_) {}
    return null;
}

function writeWeatherCache(data) {
    try {
        fs.writeFileSync(WEATHER_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        log(`Failed saving weather_cache.json: ${err.message}`);
    }
}

function getWeatherState() {
    if (!weatherState) {
        weatherState = readWeatherCache();
    }
    return weatherState;
}

async function fetchExternalJson(url, timeoutMs = 6500) {
    const res = await globalThis.fetch(url, {
        headers: { 'User-Agent': 'AntigravityCustomTheme/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
}

function classifyWeather(cur) {
    const code = Number(cur.weather_code ?? 0);
    const cloud = Number(cur.cloud_cover ?? 0);
    const wind = Number(cur.wind_speed_10m ?? 0);
    const gusts = Number(cur.wind_gusts_10m ?? wind);
    const precip = Number(cur.precipitation ?? 0);
    const rain = Number(cur.rain ?? 0);
    const showers = Number(cur.showers ?? 0);
    const snow = Number(cur.snowfall ?? 0);
    const isDay = Number(cur.is_day ?? 1) === 1;

    let condition = 'clear';
    let label = isDay ? 'Nắng quang' : 'Quang đãng';
    let icon = isDay ? '☀️' : '✨';
    let intensity = 0.4;

    if (code === 95 || code === 96 || code === 99 || ((rain + showers) >= 4 && wind >= 30) || gusts >= 62) {
        condition = 'storm';
        label = code === 96 || code === 99 ? 'Bão giông kèm mưa đá' : 'Bão giông';
        icon = '⛈️';
        intensity = Math.min(1, Math.max(0.75, (precip / 8) + (gusts / 80) * 0.4));
    } else if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86 || snow > 0) {
        condition = 'snow';
        label = (code === 75 || code === 86) ? 'Tuyết dày' : 'Tuyết rơi';
        icon = '❄️';
        intensity = (code === 75 || code === 86) ? 0.9 : (code === 73 ? 0.65 : 0.45);
    } else if (code === 65 || code === 82 || precip >= 5.0) {
        condition = 'heavy_rain';
        label = 'Mưa lớn';
        icon = '🌧️';
        intensity = Math.min(1, Math.max(0.75, precip / 8));
    } else if (code === 61 || code === 63 || code === 66 || code === 67 || code === 80 || code === 81 || rain >= 0.35 || showers >= 0.35) {
        condition = 'rain';
        label = (code === 80 || code === 81 || showers > rain) ? 'Mưa rào' : 'Mưa vừa';
        icon = '🌧️';
        intensity = (code === 63 || code === 81) ? 0.72 : 0.52;
    } else if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57 || precip > 0) {
        condition = 'drizzle';
        label = 'Mưa phùn';
        icon = '🌦️';
        intensity = code === 55 ? 0.55 : 0.35;
    } else if (code === 45 || code === 48) {
        condition = 'fog';
        label = 'Sương mù';
        icon = '🌫️';
        intensity = code === 48 ? 0.85 : 0.65;
    } else if (wind >= 22 || gusts >= 38) {
        condition = 'windy';
        label = 'Gió mạnh';
        icon = '🍃';
        intensity = Math.min(1, Math.max(0.55, wind / 40));
    } else if ((code === 3 && cloud >= 85) || cloud >= 90) {
        condition = 'overcast';
        label = 'Âm u';
        icon = '☁️';
        intensity = Math.min(1, cloud / 100);
    } else if (code === 3 || (code === 2 && cloud >= 55) || cloud >= 60) {
        condition = 'mostly_cloudy';
        label = 'Nhiều mây';
        icon = '⛅';
        intensity = Math.min(0.85, cloud / 100);
    } else if (code === 1 || code === 2 || cloud >= 18) {
        condition = 'partly_cloudy';
        label = 'Ít mây';
        icon = isDay ? '🌤️' : '🌙';
        intensity = Math.max(0.25, cloud / 100);
    }

    return {
        condition,
        label,
        icon,
        intensity: Number(intensity.toFixed(2)),
    };
}

async function resolveGeoLocation(cityOverride) {
    const cfg = readConfig();
    const manualCity = String(
        cityOverride !== undefined ? cityOverride : (cfg.weatherCity || process.env.AGY_WEATHER_CITY || '')
    ).trim();

    if (manualCity) {
        const q = encodeURIComponent(manualCity);
        for (const lang of ['vi', 'en']) {
            try {
                const data = await fetchExternalJson(`${GEOCODE_API_BASE}?name=${q}&count=1&language=${lang}&format=json`);
                const hit = data && Array.isArray(data.results) ? data.results[0] : null;
                if (hit && Number.isFinite(hit.latitude) && Number.isFinite(hit.longitude)) {
                    return {
                        city: hit.name || manualCity,
                        region: hit.admin1 || '',
                        country: hit.country || '',
                        lat: Number(hit.latitude),
                        lon: Number(hit.longitude),
                        timezone: hit.timezone || 'auto',
                        source: 'manual',
                    };
                }
            } catch (_) {}
        }
        log(`Weather geocode failed for city "${manualCity}", falling back to auto location.`);
    }

    const envLat = parseFloat(process.env.AGY_WEATHER_LAT || '');
    const envLon = parseFloat(process.env.AGY_WEATHER_LON || '');
    if (Number.isFinite(envLat) && Number.isFinite(envLon)) {
        return {
            city: process.env.AGY_WEATHER_CITY || 'Custom Location',
            region: '',
            country: '',
            lat: envLat,
            lon: envLon,
            timezone: 'auto',
            source: 'env',
        };
    }

    try {
        const g1 = await fetchExternalJson(GEOIP_PRIMARY_URL);
        if (g1 && g1.success !== false && Number.isFinite(Number(g1.latitude)) && Number.isFinite(Number(g1.longitude))) {
            return {
                city: g1.city || g1.region || 'Local',
                region: g1.region || '',
                country: g1.country || '',
                lat: Number(g1.latitude),
                lon: Number(g1.longitude),
                timezone: (g1.timezone && g1.timezone.id) || 'auto',
                source: 'ipwho.is',
            };
        }
    } catch (_) {}

    try {
        const g2 = await fetchExternalJson(GEOIP_FALLBACK_URL);
        if (g2 && Number.isFinite(Number(g2.latitude)) && Number.isFinite(Number(g2.longitude))) {
            return {
                city: g2.city || g2.region || 'Local',
                region: g2.region || '',
                country: g2.country || '',
                lat: Number(g2.latitude),
                lon: Number(g2.longitude),
                timezone: g2.timezone || 'auto',
                source: 'geojs.io',
            };
        }
    } catch (_) {}

    try {
        const g3 = await fetchExternalJson(GEOIP_TERTIARY_URL);
        if (g3 && g3.status === 'success' && Number.isFinite(Number(g3.lat)) && Number.isFinite(Number(g3.lon))) {
            return {
                city: g3.city || g3.regionName || 'Local',
                region: g3.regionName || '',
                country: g3.country || '',
                lat: Number(g3.lat),
                lon: Number(g3.lon),
                timezone: g3.timezone || 'auto',
                source: 'ip-api',
            };
        }
    } catch (_) {}

    return null;
}

function broadcastWeather(state) {
    if (!state) return;
    const serialized = JSON.stringify(state);
    const expr = `window.__AGY_WEATHER_STATE__ = ${serialized}; if (typeof window.__AGY_ON_WEATHER_UPDATE__ === 'function') { window.__AGY_ON_WEATHER_UPDATE__(window.__AGY_WEATHER_STATE__); }`;
    for (const s of sessions.values()) {
        if (s && s.ws && s.ws.readyState === 1 && typeof s.send === 'function') {
            s.send('Runtime.evaluate', { expression: expr, awaitPromise: false }).catch(() => {});
        }
    }
}

async function refreshWeather(opts = {}) {
    if (weatherFetchInFlight && !opts.force) {
        return weatherFetchInFlight;
    }
    weatherFetchInFlight = (async () => {
        try {
            const loc = await resolveGeoLocation(opts.city);
            if (!loc) {
                log('Weather refresh skipped: unable to resolve geolocation.');
                return getWeatherState();
            }

            const params = new URLSearchParams({
                latitude: String(loc.lat),
                longitude: String(loc.lon),
                current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
                daily: 'sunrise,sunset',
                forecast_days: '1',
                timezone: 'auto',
            });
            const data = await fetchExternalJson(`${WEATHER_API_BASE}?${params.toString()}`);
            const cur = data && data.current ? data.current : null;
            if (!cur) throw new Error('Missing current weather payload');

            const classified = classifyWeather(cur);
            const nextState = {
                city: loc.city,
                region: loc.region,
                country: loc.country,
                lat: loc.lat,
                lon: loc.lon,
                timezone: data.timezone || loc.timezone || 'auto',
                source: loc.source,
                condition: classified.condition,
                label: classified.label,
                icon: classified.icon,
                intensity: classified.intensity,
                weatherCode: Number(cur.weather_code ?? 0),
                temperature: Number(cur.temperature_2m ?? 0),
                apparentTemperature: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
                humidity: Number(cur.relative_humidity_2m ?? 0),
                cloudCover: Number(cur.cloud_cover ?? 0),
                windSpeed: Number(cur.wind_speed_10m ?? 0),
                windGusts: Number(cur.wind_gusts_10m ?? cur.wind_speed_10m ?? 0),
                windDirection: Number(cur.wind_direction_10m ?? 0),
                precipitation: Number(cur.precipitation ?? 0),
                rain: Number(cur.rain ?? 0),
                showers: Number(cur.showers ?? 0),
                snowfall: Number(cur.snowfall ?? 0),
                isDay: Number(cur.is_day ?? 1) === 1,
                sunrise: data.daily && Array.isArray(data.daily.sunrise) ? data.daily.sunrise[0] : null,
                sunset: data.daily && Array.isArray(data.daily.sunset) ? data.daily.sunset[0] : null,
                updatedAt: new Date().toISOString(),
            };

            weatherState = nextState;
            writeWeatherCache(nextState);
            broadcastWeather(nextState);
            log(`Weather synced: ${nextState.city} (${nextState.temperature}°C, ${nextState.condition}/${nextState.label}, cloud=${nextState.cloudCover}%, wind=${nextState.windSpeed}km/h)`);
            return nextState;
        } catch (err) {
            log(`Weather refresh error: ${err.message}`);
            return getWeatherState();
        } finally {
            weatherFetchInFlight = null;
        }
    })();
    return weatherFetchInFlight;
}

let missingPayloadLogged = false;
let cachedPayloadCode = null;
let lastPayloadMtime = 0;
function buildInjectedSource() {
    if (!fs.existsSync(PAYLOAD_PATH)) {
        if (!missingPayloadLogged) {
            log(`Payload not built yet (${PAYLOAD_PATH}). Run: python scripts/build_payload.py`);
            missingPayloadLogged = true;
        }
        return null;
    }
    missingPayloadLogged = false;

    try {
        const st = fs.statSync(PAYLOAD_PATH);
        if (!cachedPayloadCode || st.mtimeMs !== lastPayloadMtime) {
            cachedPayloadCode = fs.readFileSync(PAYLOAD_PATH, 'utf8');
            lastPayloadMtime = st.mtimeMs;
        }
    } catch (_) {}

    const cfgJson = JSON.stringify(readConfig());
    const weatherJson = JSON.stringify(getWeatherState());
    return `window.__AGY_INITIAL_CONFIG__ = ${cfgJson};\nwindow.__AGY_WEATHER_STATE__ = ${weatherJson};\n${cachedPayloadCode || ''}`;
}

function getPortInfo() {
    const portFile = resolvePortFile();
    if (!fs.existsSync(portFile)) return null;
    const lines = fs
        .readFileSync(portFile, 'utf8')
        .trim()
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    const port = parseInt(lines[0], 10);
    if (!Number.isFinite(port) || port <= 0) return null;
    return { port, token: lines[1] || '' };
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout: 2000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(err);
                }
            });
        });
        req.on('timeout', () => req.destroy(new Error('HTTP timeout')));
        req.on('error', reject);
    });
}

const sessions = new Map();
let lastPort = null;
let reloadTimer = null;

function createSession(target) {
    const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);
    let nextId = 1;
    const pending = new Map();
    const session = { id: target.id, ws, target };
    sessions.set(target.id, session);

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (ws.readyState !== 1) {
                reject(new Error('WebSocket is not open'));
                return;
            }
            const id = nextId++;
            pending.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }
    session.send = send;

    let reinjectTimer = null;
    session.reinject = () => {
        clearTimeout(reinjectTimer);
        reinjectTimer = setTimeout(async () => {
            const src = buildInjectedSource();
            if (!src) return;
            try {
                await send('Runtime.evaluate', { expression: src, awaitPromise: false });
            } catch (_) {}
        }, 150);
    };

    ws.addEventListener('message', async (event) => {
        let msg;
        try {
            msg = JSON.parse(String(event.data));
        } catch (_) {
            return;
        }

        if (msg.id && pending.has(msg.id)) {
            const p = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error.message || 'CDP error'));
            else p.resolve(msg.result);
            return;
        }

        if (msg.method === 'Runtime.bindingCalled' && msg.params && msg.params.name === 'agySaveThemeConfig') {
            try {
                const prevCfg = readConfig();
                const payload = JSON.parse(msg.params.payload || '{}');
                saveConfig(payload);
                if (payload.weatherCity !== undefined && String(payload.weatherCity || '') !== String(prevCfg.weatherCity || '')) {
                    refreshWeather({ force: true, city: payload.weatherCity });
                }
                for (const other of sessions.values()) {
                    if (other.id !== target.id) {
                        other.reinject();
                    }
                }
            } catch (err) {
                log(`Config binding error: ${err.message}`);
            }
            return;
        }

        if (msg.method === 'Runtime.bindingCalled' && msg.params && msg.params.name === 'agyRequestWeatherRefresh') {
            try {
                const reqData = msg.params.payload ? JSON.parse(msg.params.payload) : {};
                if (reqData.city !== undefined) {
                    saveConfig({ weatherCity: String(reqData.city || '').trim() });
                }
                refreshWeather({ force: true, city: reqData.city });
            } catch (err) {
                log(`Weather refresh binding error: ${err.message}`);
            }
            return;
        }

        if (msg.method === 'Page.frameNavigated' && msg.params && msg.params.frame && !msg.params.frame.parentId) {
            session.reinject();
        }
    });

    ws.addEventListener('open', async () => {
        try {
            await send('Page.enable');
            await send('Runtime.enable');
            try {
                await send('Runtime.addBinding', { name: 'agySaveThemeConfig' });
            } catch (_) {}
            try {
                await send('Runtime.addBinding', { name: 'agyRequestWeatherRefresh' });
            } catch (_) {}

            const src = buildInjectedSource();
            if (src) {
                await send('Page.addScriptToEvaluateOnNewDocument', { source: src });
                await send('Runtime.evaluate', { expression: src, awaitPromise: false });
            }
            log(`Attached target ${target.id} (${target.url})`);
        } catch (err) {
            log(`Attach error for ${target.id}: ${err.message}`);
        }
    });

    const cleanup = () => {
        for (const p of pending.values()) {
            p.reject(new Error('WebSocket closed'));
        }
        pending.clear();
        sessions.delete(target.id);
    };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
}

let browserWs = null;
let currentBrowserUrl = null;

function connectBrowserWs(info) {
    if (!info || !info.token || !info.token.startsWith('/devtools/browser/')) return;
    const browserWsUrl = `ws://127.0.0.1:${info.port}${info.token}`;
    if (browserWs && currentBrowserUrl === browserWsUrl && (browserWs.readyState === 0 || browserWs.readyState === 1)) {
        return;
    }
    if (browserWs) {
        try { browserWs.close(); } catch (_) {}
    }
    currentBrowserUrl = browserWsUrl;

    try {
        browserWs = new globalThis.WebSocket(browserWsUrl);
    } catch (_) {
        return;
    }

    browserWs.addEventListener('open', () => {
        log(`Connected to Browser CDP WebSocket at port ${info.port}`);
        browserWs.send(JSON.stringify({
            id: 100,
            method: 'Target.setDiscoverTargets',
            params: { discover: true }
        }));
    });

    browserWs.addEventListener('message', (event) => {
        let msg;
        try {
            msg = JSON.parse(String(event.data));
        } catch (_) {
            return;
        }

        if (msg.method === 'Target.targetCreated' || msg.method === 'Target.targetInfoChanged') {
            const targetInfo = msg.params && msg.params.targetInfo;
            if (!targetInfo || targetInfo.type !== 'page') return;
            const url = String(targetInfo.url || '');
            if (url.startsWith('devtools://') || url.startsWith('chrome-extension://')) return;
            if (url.includes('127.0.0.1') || url.includes('workbench') || url.includes('launchpad')) {
                if (!sessions.has(targetInfo.targetId)) {
                    createSession({
                        id: targetInfo.targetId,
                        url: targetInfo.url,
                        title: targetInfo.title,
                        webSocketDebuggerUrl: `ws://127.0.0.1:${info.port}/devtools/page/${targetInfo.targetId}`
                    });
                }
            }
        } else if (msg.method === 'Target.targetDestroyed') {
            const id = msg.params && msg.params.targetId;
            if (id && sessions.has(id)) {
                const s = sessions.get(id);
                try { s.ws.close(); } catch (_) {}
                sessions.delete(id);
            }
        }
    });

    const onErr = () => {
        browserWs = null;
        currentBrowserUrl = null;
    };
    browserWs.addEventListener('close', onErr);
    browserWs.addEventListener('error', onErr);
}

let lastShortcutPatch = 0;
function patchShortcuts() {
    if (process.platform !== 'win32') return;
    const now = Date.now();
    if (now - lastShortcutPatch < 25000) return;
    lastShortcutPatch = now;

    const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Dirs = @(
    [Environment]::GetFolderPath('DesktopDirectory'),
    [Environment]::GetFolderPath('Programs'),
    [Environment]::GetFolderPath('Startup'),
    (Join-Path $env:APPDATA 'Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar')
) | Where-Object { $_ -and (Test-Path $_) }

foreach ($d in $Dirs) {
    Get-ChildItem -Path $d -Recurse -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $sc = $WshShell.CreateShortcut($_.FullName)
            if ($sc.TargetPath -and ($sc.TargetPath -imatch '\\\\Antigravity\\.exe$')) {
                if ($sc.Arguments -notmatch '--remote-debugging-port') {
                    $sc.Arguments = ("$($sc.Arguments) --remote-debugging-port=0").Trim()
                    $sc.Save()
                }
            }
        } catch {}
    }
}
`;
    try {
        const child = require('child_process').spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
            windowsHide: true,
            stdio: 'ignore'
        });
        child.unref();
    } catch (_) {}
}

async function scanPages() {
    patchShortcuts();
    const info = getPortInfo();
    if (!info) {
        if (browserWs) {
            try { browserWs.close(); } catch (_) {}
            browserWs = null;
            currentBrowserUrl = null;
        }
        return;
    }

    connectBrowserWs(info);

    if (lastPort !== null && lastPort !== info.port) {
        for (const s of sessions.values()) {
            try {
                s.ws.close();
            } catch (_) {}
        }
        sessions.clear();
    }
    lastPort = info.port;

    let targets;
    try {
        targets = await fetchJson(`http://127.0.0.1:${info.port}/json`);
    } catch (_) {
        return;
    }
    if (!Array.isArray(targets)) return;

    const pages = targets.filter((t) => {
        if (!t || t.type !== 'page' || !t.webSocketDebuggerUrl) return false;
        const url = String(t.url || '');
        if (url.startsWith('devtools://') || url.startsWith('chrome-extension://')) return false;
        return url.includes('127.0.0.1') || url.includes('workbench') || url.includes('launchpad');
    });

    const liveIds = new Set(pages.map((p) => p.id));
    for (const [id, session] of sessions.entries()) {
        if (!liveIds.has(id)) {
            try {
                session.ws.close();
            } catch (_) {}
            sessions.delete(id);
        }
    }

    for (const page of pages) {
        if (!sessions.has(page.id)) {
            createSession(page);
        } else {
            // Heartbeat: verify theme is still active in attached DOM (at most once every 5s per target)
            const session = sessions.get(page.id);
            const now = Date.now();
            if (session && session.ws && session.ws.readyState === 1 && typeof session.send === 'function') {
                if (!session.lastCheck || now - session.lastCheck > 5000) {
                    session.lastCheck = now;
                    session.send('Runtime.evaluate', {
                        expression: 'Boolean(document.getElementById("antigravity-custom-theme-active"))',
                        returnByValue: true
                    }).then((res) => {
                        if (res && res.result && res.result.value === false) {
                            log(`Auto-healing missing theme on target ${page.id} (${page.title || page.url})`);
                            session.reinject();
                        }
                    }).catch(() => {});
                }
            }
        }
    }
}

function watchPayload() {
    try {
        if (!fs.existsSync(DIST_DIR)) {
            fs.mkdirSync(DIST_DIR, { recursive: true });
        }
        fs.watch(DIST_DIR, (_eventType, filename) => {
            if (filename && filename !== 'theme_payload.js') return;
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(() => {
                log('Detected dist/theme_payload.js update; hot-reloading attached pages.');
                for (const s of sessions.values()) {
                    s.reinject();
                }
            }, 250);
        });
    } catch (err) {
        log(`fs.watch skipped: ${err.message}`);
    }
}

function shutdown(signal) {
    log(`Shutting down on ${signal}.`);
    if (browserWs) {
        try { browserWs.close(); } catch (_) {}
    }
    for (const s of sessions.values()) {
        try {
            s.ws.close();
        } catch (_) {}
    }
    sessions.clear();
    removePidLock();
    process.exit(0);
}

process.on('uncaughtException', (err) => {
    log(`Uncaught exception: ${err && err.stack ? err.stack : err}`);
});
process.on('unhandledRejection', (reason) => {
    log(`Unhandled rejection: ${reason && reason.stack ? reason.stack : reason}`);
});

acquirePidLock();
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', removePidLock);

log(`Theme daemon started (PID ${process.pid}, platform=${process.platform}, portFile=${resolvePortFile()}).`);
watchPayload();
refreshWeather({ force: true });
setInterval(() => refreshWeather(), WEATHER_POLL_MS);
scanPages();
setInterval(scanPages, 1500);
