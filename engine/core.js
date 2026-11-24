(() => {
  if (typeof window !== 'undefined' && window.self !== window.top) return;

  const THEMES = /*__THEMES_PLACEHOLDER__*/{};
  if (THEMES['Railway Horizon']) {
    THEMES['Railway Horizon (Dynamic)'] = THEMES['Railway Horizon'];
  }
  const THEME_KEYS = Object.keys(THEMES);
  const PUBLIC_THEME_KEYS = THEME_KEYS.filter(name => !THEMES[name]?.isInternal && name !== 'Railway Horizon (Dynamic)');
  const THEME_ALIASES = {
    'WLOP Citadel (Live Weather)': 'Ashen Citadel',
    'WLOP Cosmic': 'Astral Violin'
  };
  const DEFAULT_THEME_KEY = THEMES['Ashen Citadel']
    ? 'Ashen Citadel'
    : (THEMES['Railway Horizon'] ? 'Railway Horizon' : (THEME_KEYS[0] || 'Default'));

  const TIME_PERIODS = {
    morning:   { label: 'Sáng',  icon: '🌅', range: '05:00 - 11:00', isDay: true  },
    noon:      { label: 'Trưa',  icon: '☀️', range: '11:00 - 15:00', isDay: true  },
    afternoon: { label: 'Chiều', icon: '🌇', range: '15:00 - 18:00', isDay: true  },
    evening:   { label: 'Tối',   icon: '🌆', range: '18:00 - 21:00', isDay: false },
    night:     { label: 'Đêm',   icon: '🌙', range: '21:00 - 05:00', isDay: false }
  };

  const WEATHER_CATALOG = {
    clear:         { label: 'Nắng quang',  nightLabel: 'Quang đãng', icon: '☀️', nightIcon: '✨', windSpeed: 7,  windGusts: 12, cloudCover: 6,   intensity: 0.45 },
    partly_cloudy: { label: 'Ít mây',      nightLabel: 'Ít mây',     icon: '🌤️', nightIcon: '🌙', windSpeed: 10, windGusts: 18, cloudCover: 35,  intensity: 0.40 },
    mostly_cloudy: { label: 'Nhiều mây',   nightLabel: 'Nhiều mây',  icon: '⛅', nightIcon: '☁️', windSpeed: 13, windGusts: 22, cloudCover: 72,  intensity: 0.72 },
    overcast:      { label: 'Âm u',        nightLabel: 'Âm u',       icon: '☁️', nightIcon: '☁️', windSpeed: 15, windGusts: 26, cloudCover: 96,  intensity: 0.92 },
    fog:           { label: 'Sương mù',    nightLabel: 'Sương mù',   icon: '🌫️', nightIcon: '🌫️', windSpeed: 5,  windGusts: 9,  cloudCover: 90,  intensity: 0.80 },
    windy:         { label: 'Gió mạnh',    nightLabel: 'Gió mạnh',   icon: '🍃', nightIcon: '🍃', windSpeed: 32, windGusts: 50, cloudCover: 45,  intensity: 0.85 },
    drizzle:       { label: 'Mưa phùn',    nightLabel: 'Mưa phùn',   icon: '🌦️', nightIcon: '🌧️', windSpeed: 11, windGusts: 18, cloudCover: 88,  intensity: 0.40 },
    rain:          { label: 'Mưa rào',     nightLabel: 'Mưa rào',    icon: '🌧️', nightIcon: '🌧️', windSpeed: 18, windGusts: 30, cloudCover: 95,  intensity: 0.68 },
    heavy_rain:    { label: 'Mưa lớn',     nightLabel: 'Mưa lớn',    icon: '🌧️', nightIcon: '🌧️', windSpeed: 26, windGusts: 44, cloudCover: 100, intensity: 0.92 },
    storm:         { label: 'Bão giông',   nightLabel: 'Bão giông',  icon: '⛈️', nightIcon: '⛈️', windSpeed: 42, windGusts: 70, cloudCover: 100, intensity: 1.00 },
    snow:          { label: 'Tuyết rơi',   nightLabel: 'Tuyết rơi',  icon: '❄️', nightIcon: '❄️', windSpeed: 12, windGusts: 20, cloudCover: 85,  intensity: 0.70 }
  };

  function getTimePeriod(dateObj, overrideVal) {
    if (overrideVal && overrideVal !== 'auto' && TIME_PERIODS[overrideVal]) {
      return overrideVal;
    }
    const h = (dateObj || new Date()).getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 15) return 'noon';
    if (h >= 15 && h < 18) return 'afternoon';
    if (h >= 18 && h < 21) return 'evening';
    return 'night';
  }

  function getEffectiveWeather(optSt) {
    const st = optSt || getState();
    const period = getTimePeriod(new Date(), st.timeOverride);
    const periodMeta = TIME_PERIODS[period] || TIME_PERIODS.afternoon;
    const live = (window.__AGY_WEATHER_STATE__ && typeof window.__AGY_WEATHER_STATE__ === 'object')
      ? window.__AGY_WEATHER_STATE__
      : null;

    const overrideCond = (st.weatherOverride && st.weatherOverride !== 'auto' && WEATHER_CATALOG[st.weatherOverride])
      ? st.weatherOverride
      : null;

    const cond = overrideCond || (live && WEATHER_CATALOG[live.condition] ? live.condition : 'partly_cloudy');
    const meta = WEATHER_CATALOG[cond] || WEATHER_CATALOG.partly_cloudy;
    const isDay = periodMeta.isDay;
    const label = overrideCond
      ? (isDay ? meta.label : meta.nightLabel)
      : ((live && live.label) ? (cond === 'clear' ? (isDay ? 'Nắng quang' : 'Quang đãng') : live.label) : (isDay ? meta.label : meta.nightLabel));
    const icon = isDay ? meta.icon : meta.nightIcon;

    return {
      condition: cond,
      label,
      icon,
      period,
      periodLabel: periodMeta.label,
      periodIcon: periodMeta.icon,
      isDay,
      isSimulated: Boolean(overrideCond) || Boolean(st.timeOverride && st.timeOverride !== 'auto'),
      city: (live && live.city) ? live.city : (st.weatherCity || 'Vị trí máy'),
      country: (live && live.country) ? live.country : '',
      temperature: live && Number.isFinite(live.temperature) ? Math.round(live.temperature) : null,
      humidity: live && Number.isFinite(live.humidity) ? Math.round(live.humidity) : null,
      windSpeed: overrideCond ? meta.windSpeed : (live && Number.isFinite(live.windSpeed) ? live.windSpeed : meta.windSpeed),
      windGusts: overrideCond ? meta.windGusts : (live && Number.isFinite(live.windGusts) ? live.windGusts : meta.windGusts),
      windDirection: live && Number.isFinite(live.windDirection) ? live.windDirection : 65,
      cloudCover: overrideCond ? meta.cloudCover : (live && Number.isFinite(live.cloudCover) ? live.cloudCover : meta.cloudCover),
      intensity: overrideCond ? meta.intensity : (live && Number.isFinite(live.intensity) ? live.intensity : meta.intensity),
      updatedAt: live ? live.updatedAt : null,
      hasLive: Boolean(live)
    };
  }

  function buildWeatherAtmosphericOverlay(weather) {
    if (!weather) return '';
    const c = weather.condition;
    const isDay = weather.isDay;
    switch (c) {
      case 'clear':
        return isDay
          ? 'radial-gradient(ellipse at 64% 20%, rgba(255, 236, 178, 0.14) 0%, transparent 58%)'
          : 'radial-gradient(ellipse at 28% 18%, rgba(186, 220, 255, 0.10) 0%, transparent 55%)';
      case 'partly_cloudy':
        return isDay
          ? 'linear-gradient(180deg, rgba(226, 238, 252, 0.06) 0%, transparent 45%)'
          : 'linear-gradient(180deg, rgba(30, 42, 74, 0.10) 0%, transparent 50%)';
      case 'mostly_cloudy':
        return isDay
          ? 'linear-gradient(180deg, rgba(52, 66, 88, 0.12) 0%, rgba(30, 40, 56, 0.06) 55%, rgba(18, 24, 38, 0.10) 100%)'
          : 'linear-gradient(180deg, rgba(16, 24, 44, 0.14) 0%, rgba(12, 18, 34, 0.08) 100%)';
      case 'overcast':
        return isDay
          ? 'linear-gradient(180deg, rgba(44, 52, 66, 0.18) 0%, rgba(32, 38, 50, 0.12) 55%, rgba(20, 24, 34, 0.16) 100%)'
          : 'linear-gradient(180deg, rgba(16, 20, 30, 0.20) 0%, rgba(12, 16, 24, 0.14) 100%)';
      case 'fog':
        return isDay
          ? 'linear-gradient(180deg, rgba(148, 166, 188, 0.16) 0%, rgba(184, 198, 216, 0.22) 64%, rgba(140, 156, 176, 0.24) 100%)'
          : 'linear-gradient(180deg, rgba(72, 88, 112, 0.16) 0%, rgba(92, 108, 134, 0.20) 68%, rgba(56, 70, 92, 0.22) 100%)';
      case 'windy':
        return 'linear-gradient(112deg, rgba(148, 172, 200, 0.08) 0%, transparent 48%, rgba(20, 30, 48, 0.10) 100%)';
      case 'drizzle':
        return 'linear-gradient(180deg, rgba(24, 36, 54, 0.16) 0%, rgba(18, 28, 44, 0.12) 100%)';
      case 'rain':
        return 'linear-gradient(180deg, rgba(14, 24, 42, 0.22) 0%, rgba(10, 18, 34, 0.16) 100%)';
      case 'heavy_rain':
        return 'linear-gradient(180deg, rgba(10, 18, 34, 0.28) 0%, rgba(8, 14, 28, 0.22) 100%)';
      case 'storm':
        return 'linear-gradient(180deg, rgba(8, 12, 24, 0.34) 0%, rgba(10, 16, 30, 0.26) 55%, rgba(6, 10, 20, 0.30) 100%)';
      case 'snow':
        return isDay
          ? 'linear-gradient(180deg, rgba(206, 226, 248, 0.22) 0%, rgba(164, 194, 228, 0.14) 100%)'
          : 'linear-gradient(180deg, rgba(124, 156, 198, 0.18) 0%, rgba(44, 66, 98, 0.14) 100%)';
      default:
        return '';
    }
  }

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
    if (th && th.isWeatherDynamic && th.timeThemes) {
      const st = optSt || getState();
      const period = getTimePeriod(new Date(), st.timeOverride);
      const targetName = th.timeThemes[period] || th.timeThemes.afternoon || th.timeThemes.morning;
      th = THEMES[targetName] || th;
    } else if (th && th.isDynamic) {
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
    if (!th) return name;
    if (th.isWeatherDynamic && th.timeThemes) {
      const st = optSt || getState();
      const period = getTimePeriod(new Date(), st.timeOverride);
      return th.timeThemes[period] || name;
    }
    if (!th.isDynamic) return name;
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
  const STORAGE_THEME_PARTICLES = 'agy_theme_particles_v3';
  const STORAGE_PARTICLE_COUNT = 'agy_particle_count_v3';
  const STORAGE_PARTICLE_SPEED = 'agy_particle_speed_v3';
  const STORAGE_WEATHER_CITY = 'agy_weather_city_v3';
  const STORAGE_WEATHER_OVERRIDE = 'agy_weather_override_v3';
  const STORAGE_TIME_OVERRIDE = 'agy_time_override_v3';
  const STORAGE_SOUND_ENABLED = 'agy_weather_sound_v3';
  const STORAGE_SOUND_VOLUME = 'agy_weather_volume_v3';

  const PARTICLE_TYPES = [
    { key: 'auto', label: 'Theo chủ đề', shortLabel: 'Theo chủ đề' },
    { key: 'weather', label: 'Thời tiết', shortLabel: 'Thời tiết thực tế' },
    { key: 'sakura', label: 'Hoa anh đào', shortLabel: 'Hoa anh đào' },
    { key: 'autumn', label: 'Lá thu', shortLabel: 'Lá thu' },
    { key: 'ash', label: 'Tro tàn', shortLabel: 'Tro & tàn lửa' },
    { key: 'snow', label: 'Tuyết', shortLabel: 'Tuyết rơi' },
    { key: 'rain', label: 'Mưa', shortLabel: 'Mưa rơi' },
    { key: 'feathers', label: 'Lông vũ', shortLabel: 'Lông vũ' },
    { key: 'fireflies', label: 'Đom đóm', shortLabel: 'Đom đóm' }
  ];
  const VALID_PARTICLE_KEYS = new Set(PARTICLE_TYPES.map(p => p.key));

  const UI_ICONS = {
    palette: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    sparkles: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    chat: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    close: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
    upload: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    reset: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    soundOn: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    soundOff: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
    auto: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    weather: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    sakura: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m3 4.5a4.5 4.5 0 1 0 4.5-4.5M12 16.5V15m4.5-3H15"/><circle cx="12" cy="12" r="2"/></svg>`,
    autumn: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    ash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    snow: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>`,
    rain: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v2"/><path d="M12 17v2"/><path d="M16 19v2"/></svg>`,
    feathers: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>`,
    fireflies: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="m4.93 4.93 2.12 2.12"/><path d="m16.95 16.95 2.12 2.12"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.93 19.07 2.12-2.12"/><path d="m16.95 7.05 2.12-2.12"/></svg>`
  };

  function sanitizeThemeParticlesMap(raw) {
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch (_) { parsed = null; }
    }
    const out = {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return out;
    Object.keys(parsed).forEach((k) => {
      const v = parsed[k];
      if (!v || typeof v !== 'object') return;
      const entry = {};
      if (v.enabled !== undefined) entry.enabled = Boolean(v.enabled);
      if (v.type && VALID_PARTICLE_KEYS.has(v.type)) entry.type = v.type;
      if (Object.keys(entry).length > 0) out[normalizeThemeKey(k)] = entry;
    });
    return out;
  }

  function resolveThemeParticleConfig(st, optThemeName) {
    const state = st || getState();
    const tName = optThemeName || state.themeName;
    const rootDef = THEMES[tName] || {};
    const resolved = resolveTheme(tName, state) || rootDef;
    const defaultType = resolved.particleType || rootDef.particleType || 'none';
    const map = (state.themeParticles && typeof state.themeParticles === 'object') ? state.themeParticles : {};
    const entry = map[tName];

    let enabled;
    let selectedType;
    if (entry && typeof entry === 'object') {
      enabled = entry.enabled !== undefined ? Boolean(entry.enabled) : (defaultType !== 'none');
      selectedType = (entry.type && VALID_PARTICLE_KEYS.has(entry.type)) ? entry.type : 'auto';
    } else {
      enabled = defaultType !== 'none';
      selectedType = 'auto';
    }

    let effectiveMode;
    if (!enabled) {
      effectiveMode = 'none';
    } else if (selectedType === 'auto') {
      effectiveMode = (defaultType && defaultType !== 'none') ? defaultType : 'sakura';
    } else {
      effectiveMode = selectedType;
    }

    return { themeName: tName, enabled, selectedType, defaultType, effectiveMode };
  }

  let _lastSw = -1;
  let _lastHdrBottom = -1;
  let _lastHoleClip = '';
  let _lastSideDims = '';

  const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const INPUT_STYLES = {
    'sync': { label: 'Theo chủ đề' },
    'double_gold': { label: 'Viền vàng kép' },
    'glass': { label: 'Kính trong suốt' },
    'minimal': { label: 'Tối giản' }
  };

  function normalizeThemeKey(name) {
    if (!name) return '';
    return THEME_ALIASES[name] || name;
  }

  function getState() {
    const init = window.__AGY_INITIAL_CONFIG__ || {};
    const localTheme = normalizeThemeKey(localStorage.getItem(STORAGE_THEME));
    const initTheme = normalizeThemeKey(init.themeName);
    const rawTheme = (localTheme && THEMES[localTheme])
      ? localTheme
      : (initTheme && THEMES[initTheme] ? initTheme : DEFAULT_THEME_KEY);
    const themeName = THEMES[rawTheme] ? rawTheme : DEFAULT_THEME_KEY;

    const localBubble = normalizeThemeKey(localStorage.getItem(STORAGE_BUBBLE));
    const initBubble = normalizeThemeKey(init.bubbleName);
    const rawBubble = (localBubble && THEMES[localBubble])
      ? localBubble
      : (initBubble && THEMES[initBubble] ? initBubble : themeName);
    const bubbleName = THEMES[rawBubble] ? rawBubble : themeName;

    const inputStyle = localStorage.getItem(STORAGE_INPUT) || init.inputStyle || 'sync';
    const dimming = parseInt(localStorage.getItem(STORAGE_DIMMING) !== null ? localStorage.getItem(STORAGE_DIMMING) : (init.dimming !== undefined ? init.dimming : '62'), 10);
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
    const rawThemeParticles = localStorage.getItem(STORAGE_THEME_PARTICLES);
    const themeParticles = sanitizeThemeParticlesMap(rawThemeParticles !== null ? rawThemeParticles : (init.themeParticles || {}));
    const rawCount = localStorage.getItem(STORAGE_PARTICLE_COUNT);
    const particleCount = rawCount !== null ? parseInt(rawCount, 10) : (init.particleCount !== undefined ? parseInt(init.particleCount, 10) : 22);
    const rawSpeed = localStorage.getItem(STORAGE_PARTICLE_SPEED);
    const particleSpeed = rawSpeed !== null ? parseFloat(rawSpeed) : (init.particleSpeed !== undefined ? parseFloat(init.particleSpeed) : 1.0);
    const weatherCity = localStorage.getItem(STORAGE_WEATHER_CITY) !== null
      ? localStorage.getItem(STORAGE_WEATHER_CITY)
      : (init.weatherCity || '');
    const weatherOverride = localStorage.getItem(STORAGE_WEATHER_OVERRIDE) || init.weatherOverride || 'auto';
    const timeOverride = localStorage.getItem(STORAGE_TIME_OVERRIDE) || init.timeOverride || 'auto';
    const soundEnabled = localStorage.getItem(STORAGE_SOUND_ENABLED) !== null
      ? localStorage.getItem(STORAGE_SOUND_ENABLED) === 'true'
      : (init.soundEnabled !== undefined ? !!init.soundEnabled : true);
    const rawSoundVol = localStorage.getItem(STORAGE_SOUND_VOLUME) ?? init.soundVolume;
    const soundVolume = rawSoundVol !== undefined && rawSoundVol !== null && rawSoundVol !== ''
      ? Math.min(100, Math.max(0, parseInt(rawSoundVol, 10)))
      : 42;

    try {
      if (localStorage.getItem(STORAGE_THEME) !== themeName) {
        localStorage.setItem(STORAGE_THEME, themeName);
      }
      if (localStorage.getItem(STORAGE_BUBBLE) !== bubbleName) {
        localStorage.setItem(STORAGE_BUBBLE, bubbleName);
      }
    } catch (_) {}

    return { themeName, bubbleName, inputStyle, dimming, wpEnabled, customWp, userAvatar, agentAvatar, glassBlur, avatarSize, avatarRadius, leavesEnabled, dynamicStart, dynamicEnd, particleType, themeParticles, particleCount, particleSpeed, weatherCity, weatherOverride, timeOverride, soundEnabled, soundVolume };
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
      if (overrides.themeParticles !== undefined) {
        const cleanMap = sanitizeThemeParticlesMap(overrides.themeParticles);
        st.themeParticles = cleanMap;
        localStorage.setItem(STORAGE_THEME_PARTICLES, JSON.stringify(cleanMap));
      }
      if (overrides.particleCount !== undefined) {
        localStorage.setItem(STORAGE_PARTICLE_COUNT, String(overrides.particleCount));
        window.__AGY_PARTICLE_TARGET_COUNT__ = overrides.particleCount;
      }
      if (overrides.particleSpeed !== undefined) {
        localStorage.setItem(STORAGE_PARTICLE_SPEED, String(overrides.particleSpeed));
        window.__AGY_PARTICLE_SPEED__ = overrides.particleSpeed;
      }
      if (overrides.weatherCity !== undefined) {
        localStorage.setItem(STORAGE_WEATHER_CITY, String(overrides.weatherCity));
      }
      if (overrides.weatherOverride !== undefined) {
        localStorage.setItem(STORAGE_WEATHER_OVERRIDE, String(overrides.weatherOverride));
      }
      if (overrides.timeOverride !== undefined) {
        localStorage.setItem(STORAGE_TIME_OVERRIDE, String(overrides.timeOverride));
      }
      if (overrides.soundEnabled !== undefined) {
        localStorage.setItem(STORAGE_SOUND_ENABLED, String(overrides.soundEnabled));
      }
      if (overrides.soundVolume !== undefined) {
        localStorage.setItem(STORAGE_SOUND_VOLUME, String(overrides.soundVolume));
      }
    } catch (e) {}

    if (window.agySaveThemeConfig) {
      try {
        window.agySaveThemeConfig(JSON.stringify(st));
      } catch (e) {}
    }

    syncAutumnLeaves(st);
    if (typeof syncWeatherAudio === 'function') {
      syncWeatherAudio(st);
    }

    const activeRootDef = THEMES[st.themeName] || {};
    const isWeatherTheme = Boolean(activeRootDef.isWeatherDynamic);
    const effWeather = getEffectiveWeather(st);
    const mainTheme = resolveTheme(st.themeName, st);
    const bubbleTheme = resolveTheme(st.bubbleName, st);
    const wpUrl = st.customWp || mainTheme.wallpaper || '';
    window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ = getDynamicSubThemeName(st.themeName, st);
    window.__AGY_CURRENT_WEATHER_SIG__ = `${window.__AGY_CURRENT_DYNAMIC_SUBTHEME__}|${effWeather.condition}|${effWeather.period}`;

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
    const weatherOverlay = isWeatherTheme ? buildWeatherAtmosphericOverlay(effWeather) : '';
    const weatherOverlayPrefix = weatherOverlay ? `${weatherOverlay}, ` : '';

    let bgLayers = '';
    if (wpUrl) {
      bgLayers = mainTheme.clearBackdrop
        ? `linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), ${weatherOverlayPrefix}url("${wpUrl}")`
        : `radial-gradient(circle at 75% 40%, ${mainTheme.glow} 0%, transparent 65%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.85}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), ${weatherOverlayPrefix}url("${wpUrl}")`;
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
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] #agy-autumn-leaves-canvas {
        clip-path: var(--agy-hole-clip, none) !important;
      }
      /* Keep transparent scrollers on GPU composited-scrolling layers */
      .agy-shell .overflow-y-auto {
        will-change: scroll-position;
      }
      .agy-sheet,
      .agy-inset-shell,
      body:not([data-has-browser-hole="true"]) .browser-hole-opaque,
      body:not([data-has-browser-hole="true"]) [data-main-content-body="true"],
      body:not([data-has-browser-hole="true"]) [data-side-panel-body="true"],
      [class*="agy-inset-shell"],
      [class*="--shell-canvas"],
      .agy-shell div.absolute.bottom-0.pointer-events-none,
      .agy-shell [class*="z-50"] .pointer-events-none.right-full,
      body:not([data-has-browser-hole="true"]) .agy-shell .bg-background:not(.settings-modal-container):not(.settings-modal-container *):not(#agy-custom-theme-modal-backdrop *) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      /* Browser split-pane hole cutout: keep opaque wallpaper & L-glass visible outside [data-browser-hole] without covering live BrowserView */
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0 !important;
        pointer-events: none;
        background-color: rgb(${overlayRgb});
        background-image: ${bgLayers};
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        clip-path: var(--agy-hole-clip, none);
        will-change: transform;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > :not([data-has-browser-hole="true"]):not([data-browser-hole]:not([data-browser-hole="false"])):not(.settings-modal-container),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .browser-hole-ancestor[data-has-browser-hole="true"] > :not([data-has-browser-hole="true"]):not([data-browser-hole]:not([data-browser-hole="false"])):not(.absolute):not(.fixed),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .browser-hole-opaque:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-main-content-body="true"]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-side-panel-body="true"]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-pane-id]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-tiling-pane]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-tiling-pane] > [data-pane-id] > :first-child,
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-main-content-header]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-side-panel-strip]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .bg-background:not(.settings-modal-container):not(.settings-modal-container *):not(#agy-custom-theme-modal-backdrop *) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] :is([data-main-content-body], [data-side-panel-body], [data-side-panel-strip]):not([data-has-browser-hole="true"]) {
        box-shadow: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-split-sash] {
        background: ${mainTheme.borderColor || 'rgba(200, 164, 107, 0.22)'} !important;
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
        isolation: isolate !important;
      }
      .agy-shell > :where(*:not(#agy-autumn-leaves-canvas)) {
        position: relative !important;
        z-index: 2 !important;
      }
      .agy-shell > div:first-of-type,
      .agy-shell > div:has([data-testid="title-menu-bar"]) {
        position: relative !important;
        z-index: 50 !important;
      }
      .agy-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1 !important;
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
        background: #121216 !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: 1px solid rgba(255, 255, 255, 0.10) !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.88) !important;
        border-radius: 10px !important;
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
        background: #070708 !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        box-shadow: 0 24px 72px rgba(0, 0, 0, 0.78) !important;
        backdrop-filter: none !important;
      }

      #agy-custom-theme-modal-backdrop {
        font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        animation: agyBackdropFadeIn 0.14s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }
      #agy-custom-theme-modal-backdrop * {
        box-sizing: border-box;
        font-family: inherit;
      }
      #agy-custom-theme-modal-dialog {
        background: #070708 !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 24px !important;
        box-shadow: 0 24px 72px rgba(0, 0, 0, 0.82) !important;
        animation: agyModalPopIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        transform-origin: center center !important;
        will-change: transform, opacity !important;
        color: #ffffff;
      }
      .agy-nav-item {
        width: calc(100% - 16px);
        height: 28px;
        margin: 0 8px;
        padding: 4px 8px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: #bcbdc6;
        font-size: 13.5px;
        font-weight: 350;
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.12s ease, color 0.12s ease;
      }
      .agy-nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
      }
      .agy-nav-item.is-active {
        background: rgba(255, 255, 255, 0.09);
        color: #ffffff;
        font-weight: 400;
      }
      .agy-nav-footer-btn {
        width: calc(100% - 16px);
        height: 28px;
        margin: 0 8px;
        padding: 4px 8px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: #87888f;
        font-size: 12.5px;
        font-weight: 350;
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.12s ease, color 0.12s ease;
      }
      .agy-nav-footer-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #e4e4e7;
      }
      .agy-nav-footer-btn.is-danger:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #fca5a5;
      }
      .agy-close-btn {
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        border: none;
        background: transparent;
        color: #87888f;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.12s ease, color 0.12s ease;
      }
      .agy-close-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      .agy-sec-title {
        font-size: 13px;
        font-weight: 450;
        color: #ffffff;
        margin: 0 0 6px 0;
        letter-spacing: -0.1px;
      }
      .agy-group {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        overflow: hidden;
      }
      .agy-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 7px 12px;
        min-height: 38px;
      }
      .agy-row + .agy-row {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .agy-row-label {
        font-size: 13.5px;
        font-weight: 350;
        color: #ffffff;
        line-height: 18px;
      }
      .agy-row-meta {
        font-size: 12px;
        font-weight: 350;
        color: #87888f;
        line-height: 16px;
        margin-top: 1px;
      }
      .agy-val {
        font-size: 12px;
        font-weight: 350;
        color: #87888f;
        font-variant-numeric: tabular-nums;
        min-width: 32px;
        text-align: right;
      }
      .agy-switch {
        position: relative;
        appearance: none;
        -webkit-appearance: none;
        width: 32px;
        height: 18px;
        border-radius: 9999px;
        background: #24252a;
        border: 1px solid rgba(255, 255, 255, 0.08);
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color 0.14s ease, border-color 0.14s ease;
        outline: none;
      }
      .agy-switch::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 12px;
        height: 12px;
        border-radius: 9999px;
        background: #bcbdc6;
        transition: transform 0.14s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.14s ease;
      }
      .agy-switch:checked {
        background: var(--primary, #2f71e3);
        border-color: var(--primary, #2f71e3);
      }
      .agy-switch:checked::after {
        transform: translateX(14px);
        background: #ffffff;
      }
      .agy-range {
        -webkit-appearance: none;
        appearance: none;
        height: 3px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.14);
        outline: none;
        cursor: pointer;
      }
      .agy-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 11px;
        height: 11px;
        border-radius: 9999px;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      .agy-range::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
      .agy-select {
        appearance: none;
        -webkit-appearance: none;
        height: 26px;
        padding: 0 24px 0 10px;
        border-radius: 9999px;
        background-color: #16161a;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2387888f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #f4f4f5;
        font-size: 12.5px;
        font-weight: 350;
        cursor: pointer;
        outline: none;
        transition: background-color 0.12s ease, border-color 0.12s ease;
      }
      .agy-select:hover {
        background-color: #1f2026;
        border-color: rgba(255, 255, 255, 0.14);
      }
      .agy-select option {
        background: #141418;
        color: #f4f4f5;
      }
      .agy-btn {
        height: 26px;
        padding: 0 10px;
        border-radius: 9999px;
        background: #16161a;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #d4d4d8;
        font-size: 12.5px;
        font-weight: 350;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
      }
      .agy-btn:hover {
        background: #24252a;
        border-color: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }
      .agy-btn-solid {
        background: #24252a;
        border-color: rgba(255, 255, 255, 0.14);
        color: #ffffff;
        font-weight: 400;
      }
      .agy-btn-solid:hover {
        background: #2e3038;
        border-color: rgba(255, 255, 255, 0.22);
        color: #ffffff;
      }
      .agy-input {
        height: 26px;
        padding: 0 10px;
        border-radius: 9999px;
        background: #111115;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #ffffff;
        font-size: 12.5px;
        font-weight: 350;
        outline: none;
        transition: border-color 0.12s ease, background-color 0.12s ease;
      }
      .agy-input::placeholder {
        color: #6b6c73;
      }
      .agy-input:focus {
        border-color: rgba(255, 255, 255, 0.24);
        background: #16161b;
      }
      .agy-particle-pill {
        height: 26px;
        padding: 0 9px;
        border-radius: 9999px;
        background: #111115;
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: #bcbdc6;
        font-size: 12px;
        font-weight: 350;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
      }
      .agy-particle-pill:hover {
        background: #1d1e23;
        border-color: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }
      .agy-particle-pill.is-active {
        background: #24252a;
        border-color: rgba(255, 255, 255, 0.20);
        color: #ffffff;
        font-weight: 400;
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
      .agy-preset-card,
      .agy-bubble-card,
      .agy-input-card {
        transition: border-color 0.14s ease, background-color 0.14s ease !important;
      }
      .agy-preset-card:hover,
      .agy-bubble-card:hover,
      .agy-input-card:hover {
        border-color: rgba(255, 255, 255, 0.24) !important;
      }
    `;

    syncTitleBarOverlay(st);
    scheduleTitleBarSync(st);
    if (typeof injectWeatherHud === 'function') {
      injectWeatherHud(st);
    }
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
    const weatherHud = document.getElementById('agy-weather-hud-pill');
    if (weatherHud) weatherHud.remove();
    removeAutumnLeaves();
    if (typeof stopWeatherAudio === 'function') {
      stopWeatherAudio();
    }
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
  window.__AGY_GET_EFFECTIVE_WEATHER__ = () => getEffectiveWeather(getState());
  window.__AGY_THEMES__ = THEMES;
  window.__AGY_ON_WEATHER_UPDATE__ = (nextWeather) => {
    window.__AGY_WEATHER_STATE__ = nextWeather;
    const st = getState();
    const rootDef = THEMES[st.themeName] || {};
    const pCfg = resolveThemeParticleConfig(st, st.themeName);
    if (rootDef.isWeatherDynamic || pCfg.effectiveMode === 'weather') {
      applyTheme(st);
    } else if (typeof injectWeatherHud === 'function') {
      injectWeatherHud(st);
    }
    const modalBackdrop = document.getElementById('agy-custom-theme-modal-backdrop');
    if (modalBackdrop && modalBackdrop.style.display !== 'none') {
      const modalBody = modalBackdrop.querySelector('#agy-theme-modal-body');
      if (modalBody) {
        const sc = modalBody.querySelector('#agy-theme-scroll-container');
        const prevTop = sc ? sc.scrollTop : 0;
        renderThemePanels(modalBody);
        const nextSc = modalBody.querySelector('#agy-theme-scroll-container');
        if (nextSc) nextSc.scrollTop = prevTop;
      }
    }
  };

  stopWeatherAudio();
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
        padding: 24px;
        background: rgba(0, 0, 0, 0.58);
      `;

      backdrop.innerHTML = `
        <div id="agy-custom-theme-modal-dialog" style="width: 100%; max-width: 840px; height: 74vh; max-height: 640px; display: flex; overflow: hidden;">
          <div id="agy-theme-modal-body" style="display: flex; width: 100%; height: 100%; min-width: 0;"></div>
        </div>
      `;

      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.style.display = 'none';
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

  function formatParticleLabel(mode, effWeather) {
    if (!mode || mode === 'none') return 'Tắt';
    if (mode === 'weather') {
      const w = effWeather || getEffectiveWeather();
      return w.label;
    }
    const found = PARTICLE_TYPES.find(p => p.key === mode);
    return found ? found.shortLabel : 'Hoa anh đào';
  }

  function formatParticleChip(cfg, effWeather) {
    if (!cfg || !cfg.enabled || cfg.effectiveMode === 'none') return 'Tắt';
    if (cfg.effectiveMode === 'weather') return 'Thời tiết';
    const found = PARTICLE_TYPES.find(p => p.key === cfg.effectiveMode);
    return found ? found.label : 'Hoa anh đào';
  }

  function renderThemePanels(container) {
    const st = getState();
    const mainTheme = resolveTheme(st.themeName, st);
    const activeThDef = THEMES[st.themeName] || {};
    const isDynamicActive = !!activeThDef.isDynamic && !activeThDef.isWeatherDynamic;
    const isWeatherActive = !!activeThDef.isWeatherDynamic;
    const effWeather = getEffectiveWeather(st);
    const effUserAv = st.userAvatar === 'none' ? '' : (st.userAvatar || mainTheme.userAvatar || '');
    const effAgentAv = st.agentAvatar === 'none' ? '' : (st.agentAvatar || mainTheme.agentAvatar || '');
    const pCfg = resolveThemeParticleConfig(st, st.themeName);
    const activeParticleMode = pCfg.effectiveMode;
    const showWeatherSection = isWeatherActive || (pCfg.enabled && activeParticleMode === 'weather');
    const showQuickParticleSound = !showWeatherSection && pCfg.enabled && (activeParticleMode === 'rain' || activeParticleMode === 'snow');
    const activeTab = window.__AGY_MODAL_TAB__ || 'appearance';
    const tabTitle = activeTab === 'effects' ? 'Hiệu ứng' : (activeTab === 'chat' ? 'Khung chat' : 'Chủ đề');

    const weatherSummary = [
      effWeather.city,
      effWeather.temperature !== null ? `${effWeather.temperature}°C` : null,
      effWeather.label,
      `${Math.round(effWeather.windSpeed)} km/h`
    ].filter(Boolean).join(' · ');

    const appearanceTabHtml = `
      <div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
          ${PUBLIC_THEME_KEYS.map(name => {
            const th = THEMES[name];
            const resolvedTh = resolveTheme(name, st);
            const isSelected = name === st.themeName || (name === 'Railway Horizon' && st.themeName === 'Railway Horizon (Dynamic)');
            const thumbWp = ((th.isDynamic || th.isWeatherDynamic) ? resolvedTh.wallpaper : th.wallpaper);
            const thumbBg = thumbWp
              ? `linear-gradient(180deg, rgba(7,7,8,0.06) 0%, rgba(7,7,8,0.72) 100%), url('${thumbWp}')`
              : (th.pureBg || th.bg);
            const cardPCfg = resolveThemeParticleConfig(st, name);
            const cardMeta = formatParticleChip(cardPCfg, effWeather);
            return `
              <div class="agy-preset-card" data-name="${name}" style="border-radius: 10px; border: 1px solid ${isSelected ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.06)'}; background: ${isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)'}; overflow: hidden; cursor: pointer; display: flex; flex-direction: column;">
                <div style="height: 66px; width: 100%; background-image: ${thumbBg}; background-size: cover; background-position: ${th.bgPosition || 'center'}; position: relative;">
                  ${isSelected ? `<div class="agy-card-check-slot" style="position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; border-radius: 9999px; background: rgba(7, 7, 8, 0.78); border: 1px solid rgba(255, 255, 255, 0.20); display: flex; align-items: center; justify-content: center;">${CHECK_SVG}</div>` : '<div class="agy-card-check-slot"></div>'}
                </div>
                <div style="padding: 7px 10px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                  <span style="font-size: 13px; font-weight: 400; color: #ffffff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
                  <span style="font-size: 11.5px; font-weight: 350; color: #87888f; white-space: nowrap; flex-shrink: 0;">${cardMeta}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div>
        <h3 class="agy-sec-title">Hiển thị</h3>
        <div class="agy-group">
          <div class="agy-row">
            <span class="agy-row-label">Hình nền</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label class="agy-btn" style="cursor: pointer;">
                Ảnh riêng
                <input id="agy-wp-upload" type="file" accept="image/*" style="display: none;" />
              </label>
              <input id="agy-wp-toggle" class="agy-switch" type="checkbox" ${st.wpEnabled ? 'checked' : ''} />
            </div>
          </div>
          <div class="agy-row">
            <span class="agy-row-label">Độ tối nền</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input id="agy-dim-slider" class="agy-range" type="range" min="15" max="92" value="${st.dimming}" style="width: 136px;" />
              <span id="agy-dim-val" class="agy-val">${st.dimming}%</span>
            </div>
          </div>
          <div class="agy-row">
            <span class="agy-row-label">Độ mờ kính</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input id="agy-blur-slider" class="agy-range" type="range" min="0" max="16" value="${st.glassBlur}" style="width: 136px;" />
              <span id="agy-blur-val" class="agy-val">${st.glassBlur}px</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const effectsTabHtml = `
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <h3 class="agy-sec-title" style="margin: 0;">Hiệu ứng rơi</h3>
          <span id="agy-particle-status-badge" style="font-size: 12px; font-weight: 350; color: #87888f;">${st.themeName} · ${pCfg.enabled ? formatParticleLabel(activeParticleMode, effWeather) : 'Tắt'}</span>
        </div>
        <div id="agy-particle-controls-row" class="agy-group">
          <div class="agy-row">
            <span class="agy-row-label">Bật cho chủ đề này</span>
            <input id="agy-theme-particle-toggle" class="agy-switch" type="checkbox" ${pCfg.enabled ? 'checked' : ''} />
          </div>
          <div id="agy-particle-picker-grid" style="padding: 8px 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 5px;">
            ${PARTICLE_TYPES.map(pt => {
              const isActivePill = pCfg.enabled && pCfg.selectedType === pt.key;
              return `
                <button type="button" class="agy-particle-pill ${isActivePill ? 'is-active' : ''}" data-ptype="${pt.key}">
                  ${UI_ICONS[pt.key] || UI_ICONS.sparkles}
                  <span>${pt.label}</span>
                </button>
              `;
            }).join('')}
          </div>
          <div class="agy-row" style="opacity: ${pCfg.enabled ? '1' : '0.4'}; pointer-events: ${pCfg.enabled ? 'auto' : 'none'};">
            <span class="agy-row-label">Mật độ</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input id="agy-particle-count-slider" class="agy-range" type="range" min="6" max="48" step="2" value="${st.particleCount}" style="width: 136px;" />
              <span id="agy-particle-count-val" class="agy-val">${st.particleCount}</span>
            </div>
          </div>
          <div class="agy-row" style="opacity: ${pCfg.enabled ? '1' : '0.4'}; pointer-events: ${pCfg.enabled ? 'auto' : 'none'};">
            <span class="agy-row-label">Tốc độ</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input id="agy-particle-speed-slider" class="agy-range" type="range" min="20" max="250" step="10" value="${Math.round(st.particleSpeed * 100)}" style="width: 136px;" />
              <span id="agy-particle-speed-val" class="agy-val">${st.particleSpeed.toFixed(1)}x</span>
            </div>
          </div>
          ${showQuickParticleSound ? `
            <div class="agy-row">
              <span class="agy-row-label">Âm thanh mưa & gió</span>
              <input id="agy-particle-sound-quick" class="agy-switch" type="checkbox" ${st.soundEnabled ? 'checked' : ''} />
            </div>
          ` : ''}
        </div>
      </div>

      ${showWeatherSection ? `
        <div id="agy-weather-control-box">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <h3 class="agy-sec-title" style="margin: 0;">Thời tiết</h3>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="agy-weather-live-meta" style="font-size: 12px; font-weight: 350; color: #87888f;">${weatherSummary}</span>
              <button id="agy-weather-refresh-btn" type="button" class="agy-btn" style="height: 24px; padding: 0 8px; font-size: 12px;">
                ${UI_ICONS.refresh}
                <span>Cập nhật</span>
              </button>
            </div>
          </div>
          <div class="agy-group">
            <div class="agy-row">
              <span class="agy-row-label">Vị trí</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <input id="agy-weather-city-input" class="agy-input" type="text" value="${String(st.weatherCity || '').replace(/"/g, '&quot;')}" placeholder="Tự động theo máy" style="width: 156px;" />
                <button id="agy-weather-city-apply" type="button" class="agy-btn agy-btn-solid">Áp dụng</button>
                <button id="agy-weather-city-auto" type="button" class="agy-btn">Tự động</button>
              </div>
            </div>
            <div class="agy-row">
              <span class="agy-row-label">Khung giờ</span>
              <select id="agy-time-override-select" class="agy-select">
                <option value="auto" ${st.timeOverride === 'auto' ? 'selected' : ''}>Tự động</option>
                <option value="morning" ${st.timeOverride === 'morning' ? 'selected' : ''}>Sáng (05h – 11h)</option>
                <option value="noon" ${st.timeOverride === 'noon' ? 'selected' : ''}>Trưa (11h – 15h)</option>
                <option value="afternoon" ${st.timeOverride === 'afternoon' ? 'selected' : ''}>Chiều (15h – 18h)</option>
                <option value="evening" ${st.timeOverride === 'evening' ? 'selected' : ''}>Tối (18h – 21h)</option>
                <option value="night" ${st.timeOverride === 'night' ? 'selected' : ''}>Đêm (21h – 05h)</option>
              </select>
            </div>
            <div class="agy-row">
              <span class="agy-row-label">Trạng thái</span>
              <select id="agy-weather-override-select" class="agy-select">
                <option value="auto" ${st.weatherOverride === 'auto' ? 'selected' : ''}>Tự động</option>
                <option value="clear" ${st.weatherOverride === 'clear' ? 'selected' : ''}>Quang đãng</option>
                <option value="partly_cloudy" ${st.weatherOverride === 'partly_cloudy' ? 'selected' : ''}>Ít mây</option>
                <option value="mostly_cloudy" ${st.weatherOverride === 'mostly_cloudy' ? 'selected' : ''}>Nhiều mây</option>
                <option value="overcast" ${st.weatherOverride === 'overcast' ? 'selected' : ''}>Âm u</option>
                <option value="fog" ${st.weatherOverride === 'fog' ? 'selected' : ''}>Sương mù</option>
                <option value="windy" ${st.weatherOverride === 'windy' ? 'selected' : ''}>Gió mạnh</option>
                <option value="drizzle" ${st.weatherOverride === 'drizzle' ? 'selected' : ''}>Mưa phùn</option>
                <option value="rain" ${st.weatherOverride === 'rain' ? 'selected' : ''}>Mưa rào</option>
                <option value="heavy_rain" ${st.weatherOverride === 'heavy_rain' ? 'selected' : ''}>Mưa lớn</option>
                <option value="storm" ${st.weatherOverride === 'storm' ? 'selected' : ''}>Bão giông</option>
                <option value="snow" ${st.weatherOverride === 'snow' ? 'selected' : ''}>Tuyết rơi</option>
              </select>
            </div>
            <div class="agy-row">
              <span class="agy-row-label">Âm thanh môi trường</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input id="agy-weather-volume-slider" class="agy-range" type="range" min="0" max="100" step="2" value="${st.soundVolume}" style="width: 106px; opacity: ${st.soundEnabled ? '1' : '0.4'};" />
                <span id="agy-weather-volume-val" class="agy-val">${st.soundVolume}%</span>
                <input id="agy-weather-sound-toggle" class="agy-switch" type="checkbox" ${st.soundEnabled ? 'checked' : ''} />
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      ${isDynamicActive ? `
        <div id="agy-dynamic-schedule-box">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <h3 class="agy-sec-title" style="margin: 0;">Lịch chuyển đổi</h3>
            <span id="agy-dynamic-status-badge" style="font-size: 12px; font-weight: 350; color: #87888f;">
              ${isHourDaytime(new Date().getHours(), st.dynamicStart, st.dynamicEnd) ? 'Ban ngày' : 'Hoàng hôn'}
            </span>
          </div>
          <div class="agy-group">
            <div class="agy-row">
              <span class="agy-row-label">Bắt đầu ban ngày</span>
              <select id="agy-dynamic-start-select" class="agy-select">
                ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === st.dynamicStart ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
              </select>
            </div>
            <div class="agy-row">
              <span class="agy-row-label">Bắt đầu hoàng hôn</span>
              <select id="agy-dynamic-end-select" class="agy-select">
                ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === st.dynamicEnd ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    const chatTabHtml = `
      <div>
        <h3 class="agy-sec-title">Ảnh đại diện</h3>
        <div class="agy-group">
          <div class="agy-row">
            <span class="agy-row-label">Người dùng</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div id="agy-user-av-preview" style="width: 24px; height: 24px; border-radius: ${st.avatarRadius}%; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04) ${effUserAv ? `url('${effUserAv}') center/cover no-repeat` : ''}; display: flex; align-items: center; justify-content: center; font-size: 10.5px; color: #87888f;">${effUserAv ? '' : 'U'}</div>
              <label class="agy-btn" style="cursor: pointer;">
                Chọn ảnh
                <input id="agy-user-av-upload" type="file" accept="image/*" style="display: none;" />
              </label>
              <button id="agy-user-av-clear" type="button" class="agy-btn">Ẩn</button>
            </div>
          </div>
          <div class="agy-row">
            <span class="agy-row-label">Agent</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div id="agy-agent-av-preview" style="width: 24px; height: 24px; border-radius: ${st.avatarRadius}%; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04) ${effAgentAv ? `url('${effAgentAv}') center/cover no-repeat` : ''}; display: flex; align-items: center; justify-content: center; font-size: 10.5px; color: #87888f;">${effAgentAv ? '' : 'AI'}</div>
              <label class="agy-btn" style="cursor: pointer;">
                Chọn ảnh
                <input id="agy-agent-av-upload" type="file" accept="image/*" style="display: none;" />
              </label>
              <button id="agy-agent-av-clear" type="button" class="agy-btn">Ẩn</button>
            </div>
          </div>
          <div class="agy-row" style="gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex: 1; min-width: 200px; gap: 8px;">
              <span class="agy-row-label">Kích thước</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input id="agy-av-size" class="agy-range" type="range" min="22" max="52" value="${st.avatarSize}" style="width: 100px;" />
                <span id="agy-av-size-val" class="agy-val">${st.avatarSize}px</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; flex: 1; min-width: 200px; gap: 8px;">
              <span class="agy-row-label">Bo góc</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input id="agy-av-rad" class="agy-range" type="range" min="0" max="50" value="${st.avatarRadius}" style="width: 100px;" />
                <span id="agy-av-rad-val" class="agy-val">${st.avatarRadius}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="agy-sec-title">Bong bóng tin nhắn</h3>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
          ${PUBLIC_THEME_KEYS.map(name => {
            const th = resolveTheme(name, st);
            const isSelected = name === st.bubbleName || (name === 'Railway Horizon' && st.bubbleName === 'Railway Horizon (Dynamic)');
            const stickerTop = th.isOrnament ? Math.round((th.stickerTop || 0) * 0.78) : Math.round((th.stickerTop || 0) * 0.68);
            const stickerW = Math.round((th.stickerW || 0) * 0.68);
            const stickerH = th.isOrnament ? Math.round((th.stickerH || 0) * 0.72) : Math.round((th.stickerH || 0) * 0.70);
            return `
              <div class="agy-bubble-card" data-name="${name}" style="position: relative; border-radius: 10px; border: 1px solid ${isSelected ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.06)'}; background: ${isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)'}; padding: 12px 12px 8px 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
                <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                  <div style="position: relative; width: 164px; height: 34px; padding: 1.2px; border-radius: ${th.isScroll ? '6px' : '10px'}; background: ${th.frameBg};">
                    <div style="position: relative; width: 100%; height: 100%; background: ${th.bg}; border: ${th.innerBorder || '1px solid ' + th.borderColor}; border-radius: ${th.isScroll ? '4px' : '9px'}; display: flex; align-items: center; padding: 0 11px;">
                      ${th.sticker ? `<div style="position: absolute; top: ${stickerTop}px; right: 7px; width: ${stickerW}px; height: ${stickerH}px; background-image: url('${th.sticker}'); background-size: contain; background-position: ${th.isOrnament ? 'center' : 'bottom center'}; background-repeat: no-repeat; pointer-events: none;"></div>` : ''}
                      <span style="font-size: 12.5px; font-weight: 350; color: ${th.textColor};">Xin chào</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12.5px; font-weight: 400; color: #e4e4e7;">${name}</span>
                  <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ''}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div>
        <h3 class="agy-sec-title">Ô nhập liệu</h3>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
          ${Object.entries(INPUT_STYLES).map(([key, item]) => {
            const isSelected = key === st.inputStyle;
            const activeBubbleTh = resolveTheme(st.bubbleName) || mainTheme;
            const previewStickerStyle = activeBubbleTh.isOrnament
              ? 'top: -10px; right: 9px; width: 60px; height: 18px; background-position: center;'
              : 'top: -18px; right: 9px; width: 28px; height: 24px; background-position: bottom center;';
            const previewInnerBg = key === 'glass'
              ? (activeBubbleTh.inputGlassBg || 'rgba(20, 15, 13, 0.45)')
              : (activeBubbleTh.inputCardBg || 'rgba(26, 18, 15, 0.92)');
            return `
              <div class="agy-input-card" data-style="${key}" style="border-radius: 10px; border: 1px solid ${isSelected ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.06)'}; background: ${isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)'}; padding: 10px 12px 8px 12px; cursor: pointer; display: flex; flex-direction: column; gap: 8px;">
                <div class="agy-input-preview-outer" style="position: relative; margin-top: 4px; padding: 1.2px; border-radius: 9px; background: ${key === 'double_gold' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : activeBubbleTh.frameBg};">
                  <div class="agy-input-preview-sticker" style="position: absolute; ${previewStickerStyle} background-image: url('${activeBubbleTh.sticker || ''}'); background-size: contain; background-repeat: no-repeat; display: ${key !== 'minimal' && activeBubbleTh.sticker ? 'block' : 'none'}; pointer-events: none;"></div>
                  <div class="agy-input-preview-inner" style="background: ${previewInnerBg}; border-radius: 8px; padding: 6px 10px; font-size: 12px; color: #87888f; display: flex; justify-content: space-between; align-items: center;">
                    <span>Ask anything...</span>
                    <span class="agy-input-preview-turbo" style="color: ${activeBubbleTh.primary}; font-size: 11px;">Send</span>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12.5px; font-weight: 400; color: #e4e4e7;">${item.label}</span>
                  <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ''}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = `
      <aside style="width: 184px; flex-shrink: 0; background: #111114; border-right: 1px solid rgba(255, 255, 255, 0.06); padding: 12px 0; display: flex; flex-direction: column; justify-content: space-between; user-select: none;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="font-size: 12px; font-weight: 450; color: #87888f; letter-spacing: -0.18px; padding: 2px 16px 6px 16px;">Custom Theme</div>
          <button type="button" class="agy-nav-item ${activeTab === 'appearance' ? 'is-active' : ''}" data-tab="appearance">
            ${UI_ICONS.palette}<span>Chủ đề</span>
          </button>
          <button type="button" class="agy-nav-item ${activeTab === 'effects' ? 'is-active' : ''}" data-tab="effects">
            ${UI_ICONS.sparkles}<span>Hiệu ứng</span>
          </button>
          <button type="button" class="agy-nav-item ${activeTab === 'chat' ? 'is-active' : ''}" data-tab="chat">
            ${UI_ICONS.chat}<span>Khung chat</span>
          </button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
          <button id="agy-export-btn" type="button" class="agy-nav-footer-btn">
            ${UI_ICONS.download}<span id="agy-export-label">Xuất JSON</span>
          </button>
          <button id="agy-import-toggle" type="button" class="agy-nav-footer-btn">
            ${UI_ICONS.upload}<span>Nhập JSON</span>
          </button>
          <button id="agy-reset-btn" type="button" class="agy-nav-footer-btn is-danger">
            ${UI_ICONS.reset}<span>Đặt lại</span>
          </button>
        </div>
      </aside>
      <section style="flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%; background: #070708;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 10px 20px; flex-shrink: 0;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 450; color: #ffffff; letter-spacing: -0.25px; line-height: 26px;">${tabTitle}</h2>
          <button id="agy-theme-modal-close-btn" type="button" class="agy-close-btn" aria-label="Close">${UI_ICONS.close}</button>
        </div>
        <div id="agy-import-box" style="display: none; flex-direction: column; gap: 6px; padding: 0 20px 10px 20px; flex-shrink: 0;">
          <textarea id="agy-import-text" rows="3" placeholder='{"themeName":"...","dimming":60}' style="width: 100%; background: #111115; color: #f4f4f5; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; resize: vertical; outline: none;"></textarea>
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <span id="agy-import-msg" style="font-size: 12px; color: #fca5a5;"></span>
            <button id="agy-import-apply" type="button" class="agy-btn agy-btn-solid">Áp dụng</button>
          </div>
        </div>
        <div id="agy-theme-scroll-container" style="flex: 1; overflow-y: auto; padding: 2px 20px 18px 20px; display: flex; flex-direction: column; gap: 14px;">
          ${activeTab === 'effects' ? effectsTabHtml : (activeTab === 'chat' ? chatTabHtml : appearanceTabHtml)}
        </div>
      </section>
    `;

    function rerenderKeepScroll() {
      const scroller = container.querySelector('#agy-theme-scroll-container');
      const prevScroll = scroller ? scroller.scrollTop : 0;
      renderThemePanels(container);
      const nextScroller = container.querySelector('#agy-theme-scroll-container');
      if (nextScroller) nextScroller.scrollTop = prevScroll;
    }

    const closeBtn = container.querySelector('#agy-theme-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const bd = document.getElementById('agy-custom-theme-modal-backdrop');
        if (bd) bd.style.display = 'none';
      });
    }

    container.querySelectorAll('.agy-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        window.__AGY_MODAL_TAB__ = btn.dataset.tab || 'appearance';
        renderThemePanels(container);
      });
    });

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
              sticker.style.top = '-11px';
              sticker.style.width = '66px';
              sticker.style.height = '20px';
              sticker.style.backgroundPosition = 'center';
            } else {
              sticker.style.top = '-20px';
              sticker.style.width = '30px';
              sticker.style.height = '26px';
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
    if (slider) {
      slider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (valLabel) valLabel.textContent = v + '%';
        applyTheme({ dimming: v });
      });
    }

    const wpToggle = container.querySelector('#agy-wp-toggle');
    if (wpToggle) {
      wpToggle.addEventListener('change', (e) => {
        applyTheme({ wpEnabled: e.target.checked });
      });
    }

    const themeParticleToggle = container.querySelector('#agy-theme-particle-toggle');
    if (themeParticleToggle) {
      themeParticleToggle.addEventListener('change', (e) => {
        const curSt = getState();
        const curCfg = resolveThemeParticleConfig(curSt, curSt.themeName);
        const nextMap = { ...(curSt.themeParticles || {}) };
        nextMap[curSt.themeName] = {
          enabled: e.target.checked,
          type: curCfg.selectedType
        };
        applyTheme({ themeParticles: nextMap });
        rerenderKeepScroll();
      });
    }

    container.querySelectorAll('.agy-particle-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const ptype = pill.dataset.ptype;
        if (!ptype || !VALID_PARTICLE_KEYS.has(ptype)) return;
        const curSt = getState();
        const curCfg = resolveThemeParticleConfig(curSt, curSt.themeName);
        const nextMap = { ...(curSt.themeParticles || {}) };
        nextMap[curSt.themeName] = {
          enabled: ptype === 'auto' ? (curCfg.defaultType !== 'none') : true,
          type: ptype
        };
        applyTheme({ themeParticles: nextMap });
        rerenderKeepScroll();
      });
    });

    const quickParticleSound = container.querySelector('#agy-particle-sound-quick');
    if (quickParticleSound) {
      quickParticleSound.addEventListener('change', (e) => {
        applyTheme({ soundEnabled: e.target.checked });
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

    const dynStartSelect = container.querySelector('#agy-dynamic-start-select');
    const dynEndSelect = container.querySelector('#agy-dynamic-end-select');
    const dynStatusBadge = container.querySelector('#agy-dynamic-status-badge');

    const weatherRefreshBtn = container.querySelector('#agy-weather-refresh-btn');
    const weatherCityInput = container.querySelector('#agy-weather-city-input');
    const weatherCityApply = container.querySelector('#agy-weather-city-apply');
    const weatherCityAuto = container.querySelector('#agy-weather-city-auto');
    const timeOverrideSelect = container.querySelector('#agy-time-override-select');
    const weatherOverrideSelect = container.querySelector('#agy-weather-override-select');
    const weatherSoundToggle = container.querySelector('#agy-weather-sound-toggle');
    const weatherVolumeSlider = container.querySelector('#agy-weather-volume-slider');
    const weatherVolumeVal = container.querySelector('#agy-weather-volume-val');

    if (weatherSoundToggle) {
      weatherSoundToggle.addEventListener('change', (e) => {
        if (weatherVolumeSlider) weatherVolumeSlider.style.opacity = e.target.checked ? '1' : '0.4';
        applyTheme({ soundEnabled: e.target.checked });
      });
    }

    if (weatherVolumeSlider) {
      weatherVolumeSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (weatherVolumeVal) weatherVolumeVal.textContent = v + '%';
        applyTheme({ soundVolume: v });
      });
    }

    if (weatherRefreshBtn) {
      weatherRefreshBtn.addEventListener('click', () => {
        const lbl = weatherRefreshBtn.querySelector('span');
        if (lbl) lbl.textContent = 'Đang tải...';
        if (typeof window.agyRequestWeatherRefresh === 'function') {
          try {
            window.agyRequestWeatherRefresh(JSON.stringify({ force: true, city: getState().weatherCity || '' }));
          } catch (_) {}
        }
        setTimeout(() => {
          if (lbl && lbl.isConnected) lbl.textContent = 'Cập nhật';
        }, 1800);
      });
    }

    if (weatherCityApply && weatherCityInput) {
      const applyCity = () => {
        const cityVal = weatherCityInput.value.trim();
        applyTheme({ weatherCity: cityVal });
        if (typeof window.agyRequestWeatherRefresh === 'function') {
          try {
            window.agyRequestWeatherRefresh(JSON.stringify({ force: true, city: cityVal }));
          } catch (_) {}
        }
      };
      weatherCityApply.addEventListener('click', applyCity);
      weatherCityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyCity();
      });
    }

    if (weatherCityAuto && weatherCityInput) {
      weatherCityAuto.addEventListener('click', () => {
        weatherCityInput.value = '';
        applyTheme({ weatherCity: '' });
        if (typeof window.agyRequestWeatherRefresh === 'function') {
          try {
            window.agyRequestWeatherRefresh(JSON.stringify({ force: true, city: '' }));
          } catch (_) {}
        }
      });
    }

    if (timeOverrideSelect) {
      timeOverrideSelect.addEventListener('change', (e) => {
        applyTheme({ timeOverride: e.target.value });
        rerenderKeepScroll();
      });
    }

    if (weatherOverrideSelect) {
      weatherOverrideSelect.addEventListener('change', (e) => {
        applyTheme({ weatherOverride: e.target.value });
        rerenderKeepScroll();
      });
    }

    if (dynStartSelect && dynEndSelect) {
      const onScheduleChange = () => {
        const s = parseInt(dynStartSelect.value, 10);
        const e = parseInt(dynEndSelect.value, 10);
        if (dynStatusBadge) {
          dynStatusBadge.textContent = isHourDaytime(new Date().getHours(), s, e) ? 'Ban ngày' : 'Hoàng hôn';
        }
        applyTheme({ dynamicStart: s, dynamicEnd: e });
      };
      dynStartSelect.addEventListener('change', onScheduleChange);
      dynEndSelect.addEventListener('change', onScheduleChange);
    }

    const wpUpload = container.querySelector('#agy-wp-upload');
    if (wpUpload) {
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
    }

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
    const exportLabel = container.querySelector('#agy-export-label');
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
            if (exportLabel) exportLabel.textContent = 'Đã sao chép';
            setTimeout(() => { if (exportLabel && exportLabel.isConnected) exportLabel.textContent = 'Xuất JSON'; }, 1500);
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
            throw new Error('JSON không hợp lệ');
          }
          const allowed = {};
          const keys = ['themeName', 'bubbleName', 'inputStyle', 'dimming', 'wpEnabled', 'customWp', 'userAvatar', 'agentAvatar', 'glassBlur', 'avatarSize', 'avatarRadius', 'leavesEnabled', 'dynamicStart', 'dynamicEnd', 'particleType', 'themeParticles', 'particleCount', 'particleSpeed', 'weatherCity', 'weatherOverride', 'timeOverride', 'soundEnabled', 'soundVolume'];
          keys.forEach((k) => {
            if (parsed[k] !== undefined) allowed[k] = parsed[k];
          });
          applyTheme(allowed);
          renderThemePanels(container);
        } catch (err) {
          if (importMsg) importMsg.textContent = err.message;
        }
      });
    }

    const resetBtn = container.querySelector('#agy-reset-btn');
    if (resetBtn) {
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
        localStorage.removeItem(STORAGE_LEAVES);
        localStorage.removeItem(STORAGE_DYNAMIC_START);
        localStorage.removeItem(STORAGE_DYNAMIC_END);
        localStorage.removeItem(STORAGE_PARTICLE_TYPE);
        localStorage.removeItem(STORAGE_THEME_PARTICLES);
        localStorage.removeItem(STORAGE_PARTICLE_COUNT);
        localStorage.removeItem(STORAGE_PARTICLE_SPEED);
        localStorage.removeItem(STORAGE_WEATHER_CITY);
        localStorage.removeItem(STORAGE_WEATHER_OVERRIDE);
        localStorage.removeItem(STORAGE_TIME_OVERRIDE);
        localStorage.removeItem(STORAGE_SOUND_ENABLED);
        localStorage.removeItem(STORAGE_SOUND_VOLUME);
        applyTheme({
          themeName: DEFAULT_THEME_KEY,
          bubbleName: DEFAULT_THEME_KEY,
          inputStyle: 'sync',
          dimming: 62,
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
          themeParticles: {},
          particleCount: 22,
          particleSpeed: 1.0,
          weatherCity: '',
          weatherOverride: 'auto',
          timeOverride: 'auto',
          soundEnabled: true,
          soundVolume: 42
        });
        renderThemePanels(container);
      });
    }

    container.querySelectorAll('.agy-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        applyTheme({ themeName: name, bubbleName: name, customWp: '' });
        rerenderKeepScroll();
      });
    });

    container.querySelectorAll('.agy-bubble-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        applyTheme({ bubbleName: name });
        container.querySelectorAll('.agy-bubble-card').forEach(b => {
          const isSel = b.dataset.name === name;
          b.style.border = isSel ? '1px solid rgba(255, 255, 255, 0.34)' : '1px solid rgba(255, 255, 255, 0.08)';
          b.style.background = isSel ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)';
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
          c.style.border = isSel ? '1px solid rgba(255, 255, 255, 0.34)' : '1px solid rgba(255, 255, 255, 0.08)';
          c.style.background = isSel ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)';
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

    const row = document.createElement('div');
    row.id = 'agy-custom-theme-settings-btn';
    row.style.cssText = 'margin: 6px 0 2px 0; padding: 8px 12px; border-radius: 12px; background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: space-between; gap: 12px;';
    const activeName = getState().themeName || DEFAULT_THEME_KEY;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
        <span style="font-size: 13.5px; font-weight: 400; color: #ffffff;">Custom Theme</span>
        <span style="font-size: 12px; font-weight: 350; color: #87888f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${activeName}</span>
      </div>
      <button type="button" style="height: 26px; padding: 0 11px; border-radius: 9999px; background: #24252a; border: 1px solid rgba(255, 255, 255, 0.08); color: #ffffff; font-size: 12.5px; font-weight: 350; cursor: pointer; flex-shrink: 0;">Tùy chỉnh</button>
    `;

    targetContainer.parentNode.insertBefore(row, targetContainer.nextSibling);

    const openBtn = row.querySelector('button');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
      });
    }
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
    let holeEl = null;
    if (hasHoleAttr) {
      const candidates = shell.querySelectorAll('[data-browser-hole]:not([data-browser-hole="false"]), [data-side-panel-body="true"][data-has-browser-hole="true"], [data-pane-id][data-has-browser-hole="true"]');
      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i].getBoundingClientRect();
        if (r.width > 4 && r.height > 4) {
          holeEl = candidates[i];
          break;
        }
      }
    }
    if (holeEl) {
      if (window.__AGY_SHELL_RO__ && window.__AGY_HOLE_EL__ !== holeEl) {
        try { window.__AGY_SHELL_RO__.observe(holeEl); } catch (e) {}
        window.__AGY_HOLE_EL__ = holeEl;
      }
      const hRect = holeEl.getBoundingClientRect();
      if (hRect.width > 4 && hRect.height > 4) {
        const l = Math.max(0, Math.round(hRect.left - shellRect.left));
        const t = Math.max(0, Math.round(hRect.top - shellRect.top));
        const r = Math.max(l, Math.round(hRect.right - shellRect.left));
        const b = Math.max(t, Math.round(hRect.bottom - shellRect.top));
        const clampedHdr = Math.min(hdrBottom, t);
        if (clampedHdr !== _lastHdrBottom) {
          _lastHdrBottom = clampedHdr;
          shell.style.setProperty('--agy-hdr-h', clampedHdr + 'px');
        }
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
      const auxSplit = shell.querySelector('[data-testid="aux-pane-split"]');
      if (auxSplit) ro.observe(auxSplit);
      const mainBody = shell.querySelector('[data-main-content-body="true"]');
      if (mainBody) ro.observe(mainBody);
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

  function injectWeatherHud(stOverride) {
    const st = stOverride || getState();
    const rootDef = THEMES[st.themeName] || {};
    const existing = document.getElementById('agy-weather-hud-pill');

    if (!rootDef.isWeatherDynamic) {
      if (existing) existing.remove();
      return;
    }

    const w = getEffectiveWeather(st);
    const mainTheme = resolveTheme(st.themeName, st);
    const audioEng = window.__AGY_WEATHER_AUDIO__;
    const audioSuspended = Boolean(st.soundEnabled && audioEng && audioEng.ctx && audioEng.ctx.state === 'suspended');
    const sig = `${w.city}|${w.temperature}|${w.condition}|${w.label}|${w.period}|${Math.round(w.windSpeed)}|${Math.round(w.cloudCover)}|${w.isSimulated}|${mainTheme.primary}|${st.soundEnabled}|${st.soundVolume}|${audioSuspended}`;

    if (existing && existing.isConnected) {
      if (existing.dataset.sig !== sig) {
        existing.dataset.sig = sig;
        existing.innerHTML = buildWeatherHudHtml(w, mainTheme, st, audioSuspended);
      }
      return;
    }

    const dogs = document.getElementById('agy-running-dogs-banner');
    let anchor = dogs;
    if (!anchor) {
      const sidebars = document.querySelectorAll('.bg-sidebar, [data-sidebar="true"]');
      let span = null;
      for (const sb of sidebars) {
        const found = Array.from(sb.querySelectorAll('span')).find(s => s.textContent?.trim() === 'Projects');
        if (found) { span = found; break; }
      }
      if (span) {
        anchor = span.closest('.group\\/section-header') || span.closest('h2')?.parentElement || span.closest('div');
      }
    }
    if (!anchor || !anchor.parentNode) return;

    const pill = document.createElement('div');
    pill.id = 'agy-weather-hud-pill';
    pill.dataset.sig = sig;
    pill.title = 'Tùy chỉnh Thời tiết & Hiệu ứng';
    pill.style.cssText = `
      margin: 6px 10px 4px 10px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.032);
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      user-select: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transition: background-color 0.14s ease, border-color 0.14s ease;
    `;
    pill.innerHTML = buildWeatherHudHtml(w, mainTheme, st, audioSuspended);
    pill.addEventListener('click', (e) => {
      const soundBtn = e.target.closest?.('#agy-hud-sound-btn');
      if (soundBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cur = getState();
        const eng = window.__AGY_WEATHER_AUDIO__;
        if (cur.soundEnabled && eng && eng.ctx && eng.ctx.state === 'suspended') {
          eng.ctx.resume().then(() => injectWeatherHud(getState())).catch(() => {});
          return;
        }
        applyTheme({ soundEnabled: !cur.soundEnabled });
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.__AGY_MODAL_TAB__ = 'effects';
      if (typeof window.__ANTIGRAVITY_OPEN_THEME_MODAL__ === 'function') {
        window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
      }
    });

    anchor.parentNode.insertBefore(pill, anchor);
  }

  function buildWeatherHudHtml(w, mainTheme, st, audioSuspended) {
    const tempStr = w.temperature !== null ? `${w.temperature}°C` : '';
    const soundIcon = !st.soundEnabled ? UI_ICONS.soundOff : UI_ICONS.soundOn;
    const soundColor = !st.soundEnabled ? '#71717a' : (audioSuspended ? '#a1a1aa' : '#ffffff');
    const soundTitle = !st.soundEnabled ? 'Bật âm thanh' : (audioSuspended ? 'Kích hoạt âm thanh' : 'Tắt âm thanh');
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0; color: #e4e4e7;">
          <span style="display: inline-flex; color: #bcbdc6; flex-shrink: 0;">${UI_ICONS.weather}</span>
          <span style="font-size: 12.5px; font-weight: 450; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums;">${tempStr ? tempStr + ' · ' : ''}${w.label}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <span style="font-size: 11px; font-weight: 400; color: #87888f; white-space: nowrap;">${w.periodLabel}</span>
          <button id="agy-hud-sound-btn" type="button" title="${soundTitle}" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 9999px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: ${soundColor}; padding: 0;">${soundIcon}</button>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 350; color: #87888f; font-variant-numeric: tabular-nums;">
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${w.city}${w.isSimulated ? ' · Mô phỏng' : ''}</span>
        <span style="white-space: nowrap;">${Math.round(w.windSpeed)} km/h · ${Math.round(w.cloudCover)}%</span>
      </div>
    `;
  }

  function checkDynamicTheme() {
    const st = getState();
    const th = THEMES[st.themeName];
    if (!th || (!th.isDynamic && !th.isWeatherDynamic)) return;
    if (th.isWeatherDynamic) {
      const eff = getEffectiveWeather(st);
      const sub = getDynamicSubThemeName(st.themeName, st);
      const sig = `${sub}|${eff.condition}|${eff.period}`;
      if (window.__AGY_CURRENT_WEATHER_SIG__ && window.__AGY_CURRENT_WEATHER_SIG__ !== sig) {
        window.__AGY_CURRENT_WEATHER_SIG__ = sig;
        window.__AGY_CURRENT_DYNAMIC_SUBTHEME__ = sub;
        applyTheme(st);
      }
      return;
    }
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
    injectWeatherHud();
    hookSidebarScroll();
    hookShellMetrics();
    syncShellMetrics();
    hookTitleMenuBar();
    syncAutumnLeaves();
    syncWeatherAudio();
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

  function stopWeatherAudio() {
    const eng = window.__AGY_WEATHER_AUDIO__;
    if (!eng) return;
    window.__AGY_WEATHER_AUDIO__ = null;
    window.__AGY_TRIGGER_THUNDER__ = null;
    if (eng.modTimer) clearInterval(eng.modTimer);
    if (eng.patterTimer) clearInterval(eng.patterTimer);
    if (eng.natureTimer) clearTimeout(eng.natureTimer);
    if (eng.unlockAc) {
      try { eng.unlockAc.abort(); } catch (_) {}
    }
    try {
      if (eng.ctx && eng.ctx.state !== 'closed') {
        eng.ctx.close().catch(() => {});
      }
    } catch (_) {}
  }

  function createNoiseBuffers(ctx) {
    const sr = ctx.sampleRate || 44100;
    const len = sr * 4;
    const pink = ctx.createBuffer(2, len, sr);
    const brown = ctx.createBuffer(2, len, sr);
    const fade = Math.min(2048, Math.floor(len * 0.04));

    for (let ch = 0; ch < 2; ch++) {
      const pOut = pink.getChannelData(ch);
      const bOut = brown.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastBrown = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        pOut[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.085;
        b6 = w * 0.115926;

        lastBrown = (lastBrown + 0.028 * w) / 1.028;
        bOut[i] = Math.max(-1, Math.min(1, lastBrown * 3.1));
      }
      // Seamless circular crossfade at loop boundary
      for (let i = 0; i < fade; i++) {
        const t = i / fade;
        const j = len - fade + i;
        pOut[j] = pOut[j] * (1 - t) + pOut[i] * t;
        bOut[j] = bOut[j] * (1 - t) + bOut[i] * t;
      }
    }
    return { pink, brown };
  }

  function ensureWeatherAudioEngine() {
    if (window.__AGY_WEATHER_AUDIO__ && window.__AGY_WEATHER_AUDIO__.ctx && window.__AGY_WEATHER_AUDIO__.ctx.state !== 'closed') {
      return window.__AGY_WEATHER_AUDIO__;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    let ctx;
    try {
      ctx = new AudioCtx();
    } catch (_) {
      return null;
    }

    const buffers = createNoiseBuffers(ctx);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 18;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.006;
    limiter.release.value = 0.20;
    limiter.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(limiter);

    // 1) Rain Curtain Channel (Pink Noise -> HP + LP)
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = buffers.pink;
    rainSrc.loop = true;
    const rainHP = ctx.createBiquadFilter();
    rainHP.type = 'highpass';
    rainHP.frequency.value = 280;
    const rainLP = ctx.createBiquadFilter();
    rainLP.type = 'lowpass';
    rainLP.frequency.value = 1850;
    rainLP.Q.value = 0.65;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.0001;
    rainSrc.connect(rainHP);
    rainHP.connect(rainLP);
    rainLP.connect(rainGain);
    rainGain.connect(masterGain);
    rainSrc.start();

    // 2) Dual Resonant Swept Wind Channel (Pink Noise -> BP1 + BP2 -> LP)
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = buffers.pink;
    windSrc.loop = true;
    const windBP1 = ctx.createBiquadFilter();
    windBP1.type = 'bandpass';
    windBP1.frequency.value = 310;
    windBP1.Q.value = 3.8;
    const windBP2 = ctx.createBiquadFilter();
    windBP2.type = 'bandpass';
    windBP2.frequency.value = 580;
    windBP2.Q.value = 5.0;
    const windSmoothLP = ctx.createBiquadFilter();
    windSmoothLP.type = 'lowpass';
    windSmoothLP.frequency.value = 1150;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.0001;
    windSrc.connect(windBP1);
    windSrc.connect(windBP2);
    windBP1.connect(windSmoothLP);
    windBP2.connect(windSmoothLP);
    windSmoothLP.connect(windGain);
    windGain.connect(masterGain);
    windSrc.start();

    // 3) Deep Storm & Atmospheric Sub-Bed (Brown Noise -> LP 190Hz)
    const bedSrc = ctx.createBufferSource();
    bedSrc.buffer = buffers.brown;
    bedSrc.loop = true;
    const bedLP = ctx.createBiquadFilter();
    bedLP.type = 'lowpass';
    bedLP.frequency.value = 180;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.0001;
    bedSrc.connect(bedLP);
    bedLP.connect(bedGain);
    bedGain.connect(masterGain);
    bedSrc.start();

    const eng = {
      ctx,
      buffers,
      masterGain,
      rainLP,
      rainGain,
      windBP1,
      windBP2,
      windGain,
      bedLP,
      bedGain,
      targetWindGain: 0.0001,
      targetWindBaseFreq: 300,
      targetWindGustSpan: 120,
      condition: 'clear',
      isDay: true,
      enabled: false,
      volume: 0.42,
      modTimer: 0,
      patterTimer: 0,
      natureTimer: 0,
      unlockAc: null
    };

    function spawnRaindropPatter() {
      if (!eng.enabled || ctx.state !== 'running') return;
      const c = eng.condition;
      if (c !== 'drizzle' && c !== 'rain' && c !== 'heavy_rain' && c !== 'storm') return;
      const count = c === 'drizzle' ? 1 : c === 'rain' ? (1 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 3));
      const now = ctx.currentTime;
      for (let i = 0; i < count; i++) {
        const delay = Math.random() * 0.14;
        const src = ctx.createBufferSource();
        src.buffer = buffers.pink;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100 + Math.random() * 2600;
        bp.Q.value = 4.5 + Math.random() * 4.5;
        const g = ctx.createGain();
        const peak = (c === 'drizzle' ? 0.08 : c === 'rain' ? 0.15 : 0.21) * (0.5 + Math.random() * 0.7);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.exponentialRampToValueAtTime(peak, now + delay + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.022 + Math.random() * 0.018);
        const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
        if (pan) {
          pan.pan.value = (Math.random() * 2 - 1) * 0.85;
          src.connect(bp);
          bp.connect(g);
          g.connect(pan);
          pan.connect(masterGain);
        } else {
          src.connect(bp);
          bp.connect(g);
          g.connect(masterGain);
        }
        const offset = Math.random() * 3.5;
        src.start(now + delay, offset, 0.06);
      }
    }

    function triggerThunder(distanceDelaySec) {
      if (!eng.enabled || ctx.state !== 'running') return;
      const d = Number.isFinite(distanceDelaySec) ? distanceDelaySec : (0.28 + Math.random() * 0.85);
      const t0 = ctx.currentTime + d;
      const dur = 3.2 + Math.random() * 1.8;

      // Initial sharp distant thunder crack
      const crackSrc = ctx.createBufferSource();
      crackSrc.buffer = buffers.pink;
      const crackBP = ctx.createBiquadFilter();
      crackBP.type = 'bandpass';
      crackBP.frequency.setValueAtTime(620 + Math.random() * 240, t0);
      crackBP.frequency.exponentialRampToValueAtTime(140, t0 + 0.45);
      crackBP.Q.value = 1.4;
      const crackG = ctx.createGain();
      crackG.gain.setValueAtTime(0.0001, t0);
      crackG.gain.linearRampToValueAtTime(0.42, t0 + 0.025);
      crackG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);
      crackSrc.connect(crackBP);
      crackBP.connect(crackG);
      crackG.connect(masterGain);
      crackSrc.start(t0, Math.random() * 2.5, 0.65);

      // Deep rolling multi-peak sub-bass rumble
      const rumSrc = ctx.createBufferSource();
      rumSrc.buffer = buffers.brown;
      rumSrc.loop = true;
      const rumLP = ctx.createBiquadFilter();
      rumLP.type = 'lowpass';
      rumLP.frequency.setValueAtTime(145, t0);
      rumLP.frequency.exponentialRampToValueAtTime(68, t0 + dur);
      const rumG = ctx.createGain();
      rumG.gain.setValueAtTime(0.0001, t0);
      rumG.gain.linearRampToValueAtTime(0.75, t0 + 0.14);
      rumG.gain.exponentialRampToValueAtTime(0.28, t0 + 0.85);
      rumG.gain.linearRampToValueAtTime(0.46, t0 + 1.32);
      rumG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      rumSrc.connect(rumLP);
      rumLP.connect(rumG);
      rumG.connect(masterGain);
      rumSrc.start(t0, Math.random() * 2.0, dur + 0.1);
    }

    function scheduleNatureOneShot() {
      if (eng.natureTimer) clearTimeout(eng.natureTimer);
      const nextMs = 3600 + Math.random() * 6800;
      eng.natureTimer = setTimeout(() => {
        if (eng.enabled && ctx.state === 'running' && (eng.condition === 'clear' || eng.condition === 'partly_cloudy')) {
          const now = ctx.currentTime;
          if (eng.isDay) {
            // Soft distant daytime birdsong (2-3 gentle melodic chirps)
            const notes = 2 + Math.floor(Math.random() * 2);
            const baseF = 2400 + Math.random() * 1100;
            const panVal = (Math.random() * 2 - 1) * 0.78;
            for (let n = 0; n < notes; n++) {
              const t = now + n * (0.14 + Math.random() * 0.06);
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(baseF, t);
              osc.frequency.exponentialRampToValueAtTime(baseF * (1.18 + Math.random() * 0.14), t + 0.055);
              osc.frequency.exponentialRampToValueAtTime(baseF * 0.94, t + 0.11);
              const g = ctx.createGain();
              g.gain.setValueAtTime(0.0001, t);
              g.gain.linearRampToValueAtTime(0.022, t + 0.02);
              g.gain.exponentialRampToValueAtTime(0.0001, t + 0.115);
              if (typeof ctx.createStereoPanner === 'function') {
                const pan = ctx.createStereoPanner();
                pan.pan.value = panVal;
                osc.connect(g);
                g.connect(pan);
                pan.connect(masterGain);
              } else {
                osc.connect(g);
                g.connect(masterGain);
              }
              osc.start(t);
              osc.stop(t + 0.13);
            }
          } else {
            // Cozy distant medieval night cricket chirp cadence
            const pulses = 3 + Math.floor(Math.random() * 3);
            const freq = 3950 + Math.random() * 420;
            const panVal = (Math.random() * 2 - 1) * 0.8;
            for (let p = 0; p < pulses; p++) {
              const t = now + p * 0.065;
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.value = freq;
              const g = ctx.createGain();
              g.gain.setValueAtTime(0.0001, t);
              g.gain.linearRampToValueAtTime(0.013, t + 0.012);
              g.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);
              if (typeof ctx.createStereoPanner === 'function') {
                const pan = ctx.createStereoPanner();
                pan.pan.value = panVal;
                osc.connect(g);
                g.connect(pan);
                pan.connect(masterGain);
              } else {
                osc.connect(g);
                g.connect(masterGain);
              }
              osc.start(t);
              osc.stop(t + 0.055);
            }
          }
        }
        scheduleNatureOneShot();
      }, nextMs);
    }

    // Continuous 140ms wind gust & filter sweep synced with Canvas physics gustWave
    eng.modTimer = setInterval(() => {
      if (!eng.enabled || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const gust = Number.isFinite(window.__AGY_LIVE_WIND_GUST__)
        ? window.__AGY_LIVE_WIND_GUST__
        : Math.sin(now * 0.45);
      const normGust = (gust + 1) * 0.5; // 0..1
      const f1 = Math.max(110, eng.targetWindBaseFreq + normGust * eng.targetWindGustSpan);
      const f2 = f1 * 1.82;
      const dynWindGain = Math.max(0.0001, eng.targetWindGain * (0.62 + normGust * 0.68));
      windBP1.frequency.setTargetAtTime(f1, now, 0.28);
      windBP2.frequency.setTargetAtTime(f2, now, 0.28);
      windGain.gain.setTargetAtTime(dynWindGain, now, 0.26);
    }, 140);

    eng.patterTimer = setInterval(spawnRaindropPatter, 125);
    scheduleNatureOneShot();

    // Auto-unlock AudioContext on first user interaction if suspended by Chromium autoplay policy
    if (ctx.state === 'suspended') {
      const unlockAc = new AbortController();
      eng.unlockAc = unlockAc;
      const unlock = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            unlockAc.abort();
            injectWeatherHud(getState());
          }).catch(() => {});
        } else {
          unlockAc.abort();
        }
      };
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true, signal: unlockAc.signal });
      window.addEventListener('keydown', unlock, { capture: true, passive: true, signal: unlockAc.signal });
    }

    window.__AGY_WEATHER_AUDIO__ = eng;
    window.__AGY_TRIGGER_THUNDER__ = triggerThunder;
    return eng;
  }

  function syncWeatherAudio(stOverride) {
    const st = stOverride || getState();
    const rootDef = THEMES[st.themeName] || {};
    const pCfg = resolveThemeParticleConfig(st, st.themeName);
    const particleMode = pCfg.effectiveMode;
    const isStandaloneRain = particleMode === 'rain';
    const isStandaloneSnow = particleMode === 'snow';
    const shouldPlay = Boolean(
      st.soundEnabled &&
      st.soundVolume > 0 &&
      (rootDef.isWeatherDynamic || particleMode === 'weather' || isStandaloneRain || isStandaloneSnow)
    );

    if (!shouldPlay) {
      stopWeatherAudio();
      return;
    }

    const eng = ensureWeatherAudioEngine();
    if (!eng) return;

    const w = getEffectiveWeather(st);
    const cond = isStandaloneRain ? 'rain' : (isStandaloneSnow ? 'snow' : w.condition);
    const windKmH = isStandaloneRain ? 14 : (isStandaloneSnow ? 8 : Math.max(2, w.windSpeed || 10));
    const vol = Math.pow(Math.min(100, Math.max(0, Number(st.soundVolume) || 0)) / 100, 1.35);

    eng.enabled = true;
    eng.condition = cond;
    eng.isDay = w.isDay;
    eng.volume = vol;

    if (eng.ctx.state === 'suspended') {
      eng.ctx.resume().then(() => injectWeatherHud(getState())).catch(() => {});
    }

    const now = eng.ctx.currentTime;
    eng.masterGain.gain.setTargetAtTime(Math.max(0.0001, vol * 0.85), now, 0.25);

    let rainLevel = 0.0001;
    let rainCutoff = 1850;
    let windLevel = Math.min(0.22, 0.035 + (windKmH / 55) * 0.16);
    let windFreq = 260;
    let windSpan = 120;
    let bedLevel = 0.0001;

    switch (cond) {
      case 'drizzle':
        rainLevel = 0.18;
        rainCutoff = 2650;
        windLevel = Math.max(0.08, windLevel);
        windFreq = 290;
        windSpan = 130;
        bedLevel = 0.04;
        break;
      case 'rain':
        rainLevel = 0.40;
        rainCutoff = 1900;
        windLevel = Math.max(0.14, windLevel * 1.15);
        windFreq = 310;
        windSpan = 180;
        bedLevel = 0.09;
        break;
      case 'heavy_rain':
        rainLevel = 0.56;
        rainCutoff = 1580;
        windLevel = Math.max(0.24, windLevel * 1.35);
        windFreq = 340;
        windSpan = 240;
        bedLevel = 0.18;
        break;
      case 'storm':
        rainLevel = 0.66;
        rainCutoff = 1360;
        windLevel = 0.44;
        windFreq = 360;
        windSpan = 340;
        bedLevel = 0.28;
        break;
      case 'windy':
        rainLevel = 0.0001;
        windLevel = 0.48;
        windFreq = 340;
        windSpan = 360;
        bedLevel = 0.10;
        break;
      case 'snow':
        rainLevel = 0.0001;
        windLevel = 0.14;
        windFreq = 210;
        windSpan = 110;
        bedLevel = 0.03;
        break;
      case 'fog':
      case 'overcast':
        rainLevel = 0.0001;
        windLevel = Math.max(0.10, windLevel * 1.15);
        windFreq = 230;
        windSpan = 135;
        bedLevel = 0.045;
        break;
      case 'mostly_cloudy':
        rainLevel = 0.0001;
        windLevel = Math.max(0.09, windLevel);
        windFreq = 250;
        windSpan = 130;
        bedLevel = 0.025;
        break;
      case 'partly_cloudy':
      case 'clear':
      default:
        rainLevel = 0.0001;
        windLevel = Math.max(0.06, windLevel * 0.85);
        windFreq = 240;
        windSpan = 100;
        bedLevel = 0.015;
        break;
    }

    eng.targetWindGain = windLevel;
    eng.targetWindBaseFreq = windFreq;
    eng.targetWindGustSpan = windSpan;

    eng.rainGain.gain.setTargetAtTime(rainLevel, now, 0.45);
    eng.rainLP.frequency.setTargetAtTime(rainCutoff, now, 0.45);
    eng.bedGain.gain.setTargetAtTime(bedLevel, now, 0.55);
  }

  function removeAutumnLeaves() {
    if (window.__AGY_LEAVES_RAF__) {
      cancelAnimationFrame(window.__AGY_LEAVES_RAF__);
      window.__AGY_LEAVES_RAF__ = 0;
    }
    if (window.__AGY_WEATHER_AC__) {
      try { window.__AGY_WEATHER_AC__.abort(); } catch (e) {}
      window.__AGY_WEATHER_AC__ = null;
    }
    const canvas = document.getElementById('agy-autumn-leaves-canvas');
    if (canvas) canvas.remove();
  }

  function createSoftPuffSprite(size, rgbStr) {
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const octx = off.getContext('2d');
    if (!octx) return off;
    const half = size / 2;
    const puffs = [
      { x: half * 0.72, y: half * 1.06, r: half * 0.50, a: 0.34 },
      { x: half * 1.02, y: half * 0.88, r: half * 0.60, a: 0.42 },
      { x: half * 1.32, y: half * 1.08, r: half * 0.46, a: 0.30 },
      { x: half * 0.96, y: half * 1.12, r: half * 0.56, a: 0.28 }
    ];
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      const g = octx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(${rgbStr}, ${p.a})`);
      g.addColorStop(0.52, `rgba(${rgbStr}, ${p.a * 0.45})`);
      g.addColorStop(1, `rgba(${rgbStr}, 0)`);
      octx.fillStyle = g;
      octx.beginPath();
      octx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      octx.fill();
    }
    return off;
  }

  function createGlowOrbSprite(size, rgbStr) {
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const octx = off.getContext('2d');
    if (!octx) return off;
    const half = size / 2;
    const g = octx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
    g.addColorStop(0.28, `rgba(${rgbStr}, 0.72)`);
    g.addColorStop(0.65, `rgba(${rgbStr}, 0.18)`);
    g.addColorStop(1, `rgba(${rgbStr}, 0)`);
    octx.fillStyle = g;
    octx.fillRect(0, 0, size, size);
    return off;
  }

  function buildLightningSegments(x0, y0, x1, y1, displace, depth, out) {
    if (depth <= 0 || displace < 4) {
      out.push({ x0, y0, x1, y1, main: true });
      return;
    }
    const mx = (x0 + x1) * 0.5 + (Math.random() - 0.5) * displace;
    const my = (y0 + y1) * 0.5 + (Math.random() - 0.5) * displace * 0.28;
    buildLightningSegments(x0, y0, mx, my, displace * 0.54, depth - 1, out);
    buildLightningSegments(mx, my, x1, y1, displace * 0.54, depth - 1, out);
    if (depth >= 2 && Math.random() < 0.42) {
      const bx = mx + (Math.random() - 0.5) * displace * 1.9;
      const by = my + 35 + Math.random() * 85;
      const branch = [];
      buildLightningSegments(mx, my, bx, by, displace * 0.36, depth - 2, branch);
      for (let i = 0; i < branch.length; i++) {
        branch[i].main = false;
        out.push(branch[i]);
      }
    }
  }

  function syncAutumnLeaves(stOverride) {
    const st = stOverride || getState();
    const pCfg = resolveThemeParticleConfig(st, st.themeName);
    if (!pCfg.enabled || pCfg.effectiveMode === 'none') {
      removeAutumnLeaves();
      return;
    }

    const shell = document.querySelector('.agy-shell');
    if (!shell) return;

    let canvas = document.getElementById('agy-autumn-leaves-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'agy-autumn-leaves-canvas';
      canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5 !important; opacity: 0.92; contain: strict; will-change: transform; transform: translateZ(0);';
      shell.insertBefore(canvas, shell.firstChild);
    }

    const particleMode = pCfg.effectiveMode;
    const useWeatherEngine = (particleMode === 'weather' || particleMode === 'rain' || particleMode === 'snow');

    const effWeather = getEffectiveWeather(st);
    const modeSig = particleMode === 'weather'
      ? `weather|${effWeather.condition}|${effWeather.period}|${Math.round(effWeather.windSpeed)}|${Math.round(effWeather.cloudCover)}`
      : particleMode;

    window.__AGY_PARTICLE_SPEED__ = typeof st.particleSpeed === 'number' ? st.particleSpeed : 1.0;
    window.__AGY_PARTICLE_TARGET_COUNT__ = typeof st.particleCount === 'number' ? st.particleCount : (particleMode === 'sakura' ? 18 : 22);

    if (canvas.dataset.running === '1' && canvas.dataset.mode === modeSig) return;
    canvas.dataset.running = '1';
    canvas.dataset.mode = modeSig;

    if (window.__AGY_LEAVES_RAF__) {
      cancelAnimationFrame(window.__AGY_LEAVES_RAF__);
      window.__AGY_LEAVES_RAF__ = 0;
    }
    if (window.__AGY_WEATHER_AC__) {
      try { window.__AGY_WEATHER_AC__.abort(); } catch (e) {}
    }
    const ac = new AbortController();
    window.__AGY_WEATHER_AC__ = ac;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let width = shell.clientWidth || window.innerWidth;
    let height = shell.clientHeight || window.innerHeight;
    function resizeCanvas() {
      if (!canvas || !canvas.isConnected) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = shell.clientWidth || window.innerWidth;
      height = shell.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true, signal: ac.signal });

    // =========================================================================
    // ARTISTIC PARTICLE MODES: SAKURA / AUTUMN / ASH / FEATHERS / FIREFLIES
    // =========================================================================
    if (!useWeatherEngine) {
      const SAKURA_COLORS = [
        { fill: '#fbcfe8', stroke: '#f472b6', opacity: 0.78 },
        { fill: '#f472b6', stroke: '#db2777', opacity: 0.68 },
        { fill: '#fff1f2', stroke: '#fbcfe8', opacity: 0.84 },
        { fill: '#fda4af', stroke: '#f43f5e', opacity: 0.72 },
        { fill: '#fce7f3', stroke: '#ec4899', opacity: 0.74 }
      ];
      const AUTUMN_COLORS = [
        { fill: '#f59e0b', vein: '#92400e', opacity: 0.68 },
        { fill: '#eab308', vein: '#854d0e', opacity: 0.70 },
        { fill: '#f97316', vein: '#9a3412', opacity: 0.64 },
        { fill: '#dc2626', vein: '#7f1d1d', opacity: 0.60 },
        { fill: '#d97706', vein: '#78350f', opacity: 0.66 },
        { fill: '#fbbf24', vein: '#b45309', opacity: 0.68 }
      ];
      const ASH_COLORS = [
        { fill: '#9ca3af', stroke: '#4b5563', opacity: 0.56 },
        { fill: '#cbd5e1', stroke: '#64748b', opacity: 0.48 },
        { fill: '#6b7280', stroke: '#374151', opacity: 0.60 },
        { fill: '#d6d3d1', stroke: '#78716c', opacity: 0.45 }
      ];
      const FEATHER_COLORS = [
        { fill: '#e2e8f0', spine: '#94a3b8', opacity: 0.68 },
        { fill: '#cbd5e1', spine: '#64748b', opacity: 0.62 },
        { fill: '#475569', spine: '#1e293b', opacity: 0.72 },
        { fill: '#f8fafc', spine: '#cbd5e1', opacity: 0.70 },
        { fill: '#334155', spine: '#94a3b8', opacity: 0.68 }
      ];

      const emberSprite = particleMode === 'ash' ? createGlowOrbSprite(40, '251, 146, 60') : null;
      const fireflyGoldSprite = particleMode === 'fireflies' ? createGlowOrbSprite(44, '253, 224, 71') : null;
      const fireflyCyanSprite = particleMode === 'fireflies' ? createGlowOrbSprite(44, '56, 189, 248') : null;

      const particles = [];
      function resetArtistic(p, fromEdge = true) {
        if (particleMode === 'ash') {
          const isEmber = Math.random() < 0.36;
          p.kind = isEmber ? 'ember' : 'ash';
          p.x = Math.random() * width;
          if (isEmber) {
            p.y = fromEdge ? (height + 10 + Math.random() * 40) : Math.random() * height;
            p.size = 2.6 + Math.random() * 4.0;
            p.vy = -(0.35 + Math.random() * 0.72);
            p.wind = (Math.random() - 0.35) * 0.32;
            p.swing = Math.random() * Math.PI * 2;
            p.swingSpeed = 0.018 + Math.random() * 0.025;
            p.swingAmp = 0.35 + Math.random() * 0.55;
            p.pulse = Math.random() * Math.PI * 2;
            p.vPulse = 0.04 + Math.random() * 0.06;
            p.opacity = 0.68 + Math.random() * 0.30;
          } else {
            const pal = ASH_COLORS[Math.floor(Math.random() * ASH_COLORS.length)];
            p.y = fromEdge ? -(10 + Math.random() * 30) : Math.random() * height;
            p.size = 3.2 + Math.random() * 4.5;
            p.vy = 0.20 + Math.random() * 0.34;
            p.wind = 0.14 + Math.random() * 0.28;
            p.swing = Math.random() * Math.PI * 2;
            p.swingSpeed = 0.012 + Math.random() * 0.018;
            p.swingAmp = 0.50 + Math.random() * 0.75;
            p.angle = Math.random() * Math.PI * 2;
            p.vAngle = (Math.random() - 0.5) * 0.022;
            p.flip = Math.random() * Math.PI * 2;
            p.vFlip = 0.018 + Math.random() * 0.024;
            p.color = pal.fill;
            p.stroke = pal.stroke;
            p.opacity = pal.opacity * (0.7 + Math.random() * 0.3);
          }
          return p;
        }

        if (particleMode === 'feathers') {
          const pal = FEATHER_COLORS[Math.floor(Math.random() * FEATHER_COLORS.length)];
          p.x = Math.random() * width;
          p.y = fromEdge ? -(20 + Math.random() * 35) : Math.random() * height;
          p.size = 11 + Math.random() * 8;
          p.vy = 0.18 + Math.random() * 0.24;
          p.wind = 0.05 + Math.random() * 0.14;
          p.swing = Math.random() * Math.PI * 2;
          p.swingSpeed = 0.012 + Math.random() * 0.011;
          p.swingAmp = 0.85 + Math.random() * 1.15;
          p.baseAngle = (Math.random() - 0.5) * 0.35;
          p.flip = Math.random() * Math.PI * 2;
          p.vFlip = 0.008 + Math.random() * 0.012;
          p.color = pal.fill;
          p.stroke = pal.spine;
          p.opacity = pal.opacity * (0.74 + Math.random() * 0.26);
          return p;
        }

        if (particleMode === 'fireflies') {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.size = 2.6 + Math.random() * 4.2;
          p.vx = (Math.random() - 0.5) * 0.42;
          p.vy = -(0.08 + Math.random() * 0.24) + (Math.random() - 0.5) * 0.18;
          p.swing = Math.random() * Math.PI * 2;
          p.swingSpeed = 0.010 + Math.random() * 0.018;
          p.swingAmp = 0.32 + Math.random() * 0.58;
          p.pulse = Math.random() * Math.PI * 2;
          p.vPulse = 0.018 + Math.random() * 0.032;
          p.cyan = Math.random() < 0.46;
          p.sparkle = Math.random() < 0.35;
          p.opacity = 0.62 + Math.random() * 0.36;
          return p;
        }

        // Sakura & Autumn
        const isSak = particleMode === 'sakura';
        const pal = isSak
          ? SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)]
          : AUTUMN_COLORS[Math.floor(Math.random() * AUTUMN_COLORS.length)];
        p.x = Math.random() * width;
        p.y = fromEdge ? -(10 + Math.random() * 25) : Math.random() * height;
        p.size = (isSak ? 7 : 8) + Math.random() * (isSak ? 5 : 6);
        p.vy = (isSak ? 0.22 : 0.22) + Math.random() * 0.28;
        p.wind = (isSak ? 0.15 : 0.12) + Math.random() * 0.20;
        p.swing = Math.random() * Math.PI * 2;
        p.swingSpeed = 0.009 + Math.random() * 0.014;
        p.swingAmp = 0.65 + Math.random() * 0.85;
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = (Math.random() - 0.5) * 0.016;
        p.flip = Math.random() * Math.PI * 2;
        p.vFlip = 0.013 + Math.random() * 0.018;
        p.color = pal.fill;
        p.stroke = isSak ? pal.stroke : pal.vein;
        p.opacity = pal.opacity * (0.72 + Math.random() * 0.28);
        return p;
      }

      const initN = window.__AGY_PARTICLE_TARGET_COUNT__ || 22;
      for (let i = 0; i < initN; i++) particles.push(resetArtistic({}, false));

      let isVisible = !document.hidden;
      let lastTime = performance.now();
      function renderArtistic(now) {
        if (!canvas || !canvas.isConnected || !isVisible) {
          window.__AGY_LEAVES_RAF__ = 0;
          return;
        }
        const targetN = window.__AGY_PARTICLE_TARGET_COUNT__ || 22;
        while (particles.length < targetN) particles.push(resetArtistic({}, true));
        while (particles.length > targetN) particles.pop();

        const spd = (window.__AGY_PARTICLE_SPEED__ || 1.0) * Math.min(2.0, Math.max(0.4, (now - lastTime) / 16.67));
        lastTime = now;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const l = particles[i];

          if (particleMode === 'fireflies') {
            l.swing += l.swingSpeed * spd;
            l.pulse += l.vPulse * spd;
            l.x += (l.vx + Math.sin(l.swing) * l.swingAmp) * spd;
            l.y += (l.vy + Math.cos(l.swing * 0.72) * 0.22) * spd;
            if (l.x < -20) l.x = width + 18;
            if (l.x > width + 20) l.x = -18;
            if (l.y < -20) l.y = height + 18;
            if (l.y > height + 20) l.y = -18;

            const glow = 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(l.pulse));
            const spr = l.cyan ? fireflyCyanSprite : fireflyGoldSprite;
            const dSize = l.size * (3.0 + glow * 1.4);
            ctx.globalAlpha = l.opacity * glow;
            ctx.drawImage(spr, l.x - dSize * 0.5, l.y - dSize * 0.5, dSize, dSize);
            if (l.sparkle && glow > 0.75) {
              const arm = l.size * 1.35 * glow;
              ctx.strokeStyle = l.cyan ? 'rgba(224, 242, 254, 0.85)' : 'rgba(254, 249, 195, 0.88)';
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(l.x - arm, l.y);
              ctx.lineTo(l.x + arm, l.y);
              ctx.moveTo(l.x, l.y - arm);
              ctx.lineTo(l.x, l.y + arm);
              ctx.stroke();
            }
            continue;
          }

          if (particleMode === 'ash') {
            l.swing += l.swingSpeed * spd;
            l.y += l.vy * spd;
            l.x += (l.wind + Math.sin(l.swing) * l.swingAmp) * spd;
            if (l.kind === 'ember') {
              l.pulse += l.vPulse * spd;
              if (l.y < -20 || l.x < -30 || l.x > width + 30) resetArtistic(l, true);
              const flicker = 0.45 + 0.55 * Math.sin(l.pulse);
              const dSize = l.size * (3.2 + flicker * 1.1);
              ctx.globalAlpha = l.opacity * flicker;
              ctx.drawImage(emberSprite, l.x - dSize * 0.5, l.y - dSize * 0.5, dSize, dSize);
            } else {
              l.angle += l.vAngle * spd;
              l.flip += l.vFlip * spd;
              if (l.y > height + 20 || l.x > width + 30 || l.x < -30) resetArtistic(l, true);
              ctx.save();
              ctx.translate(l.x, l.y);
              ctx.rotate(l.angle);
              ctx.scale(0.55 + 0.45 * Math.cos(l.flip), 1);
              ctx.globalAlpha = l.opacity;
              ctx.fillStyle = l.color;
              ctx.beginPath();
              ctx.moveTo(0, -l.size);
              ctx.lineTo(l.size * 0.72, -l.size * 0.25);
              ctx.lineTo(l.size * 0.42, l.size * 0.82);
              ctx.lineTo(-l.size * 0.62, l.size * 0.45);
              ctx.lineTo(-l.size * 0.80, -l.size * 0.38);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            continue;
          }

          if (particleMode === 'feathers') {
            l.swing += l.swingSpeed * spd;
            l.flip += l.vFlip * spd;
            const swayVx = Math.sin(l.swing) * l.swingAmp;
            l.x += (l.wind + swayVx) * spd;
            l.y += (l.vy + Math.abs(Math.cos(l.swing)) * 0.08) * spd;
            if (l.y > height + 30 || l.x > width + 40 || l.x < -40) resetArtistic(l, true);

            const tilt = l.baseAngle - Math.cos(l.swing) * 0.48;
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(tilt);
            ctx.scale(0.76 + 0.24 * Math.cos(l.flip), 1);
            ctx.globalAlpha = l.opacity;
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.moveTo(0, -l.size);
            ctx.bezierCurveTo(l.size * 0.34, -l.size * 0.65, l.size * 0.40, -l.size * 0.05, l.size * 0.22, l.size * 0.45);
            ctx.lineTo(l.size * 0.08, l.size * 0.32);
            ctx.lineTo(l.size * 0.14, l.size * 0.64);
            ctx.quadraticCurveTo(0, l.size * 0.85, 0, l.size * 0.92);
            ctx.quadraticCurveTo(0, l.size * 0.85, -l.size * 0.14, l.size * 0.64);
            ctx.bezierCurveTo(-l.size * 0.38, l.size * 0.20, -l.size * 0.36, -l.size * 0.60, 0, -l.size);
            ctx.fill();
            ctx.strokeStyle = l.stroke;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(0, -l.size * 0.90);
            ctx.quadraticCurveTo(l.size * 0.05, 0, 0, l.size * 1.15);
            ctx.stroke();
            ctx.restore();
            continue;
          }

          // Sakura & Autumn
          l.swing += l.swingSpeed * spd;
          l.angle += l.vAngle * spd;
          l.flip += l.vFlip * spd;
          l.y += l.vy * spd;
          l.x += (l.wind + Math.sin(l.swing) * l.swingAmp) * spd;
          if (l.y > height + 25 || l.x > width + 25) resetArtistic(l, true);

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.angle);
          ctx.scale(0.65 + 0.35 * Math.cos(l.flip), 1);
          ctx.globalAlpha = l.opacity;
          ctx.fillStyle = l.color;
          ctx.beginPath();
          if (particleMode === 'sakura') {
            ctx.moveTo(0, l.size);
            ctx.bezierCurveTo(l.size * 0.75, l.size * 0.4, l.size * 0.85, -l.size * 0.5, l.size * 0.25, -l.size);
            ctx.quadraticCurveTo(0, -l.size * 0.75, -l.size * 0.25, -l.size);
            ctx.bezierCurveTo(-l.size * 0.85, -l.size * 0.5, -l.size * 0.75, l.size * 0.4, 0, l.size);
            ctx.fill();
            ctx.strokeStyle = l.stroke;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          } else {
            ctx.moveTo(0, -l.size);
            ctx.bezierCurveTo(l.size * 0.72, -l.size * 0.32, l.size * 0.70, l.size * 0.58, 0, l.size);
            ctx.bezierCurveTo(-l.size * 0.70, l.size * 0.58, -l.size * 0.72, -l.size * 0.32, 0, -l.size);
            ctx.fill();
            ctx.strokeStyle = l.stroke;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(0, -l.size * 0.86);
            ctx.lineTo(0, l.size * 1.12);
            ctx.moveTo(0, -l.size * 0.15);
            ctx.lineTo(l.size * 0.36, -l.size * 0.42);
            ctx.moveTo(0, l.size * 0.22);
            ctx.lineTo(-l.size * 0.34, -l.size * 0.04);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderArtistic);
      }
      document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        if (isVisible && !window.__AGY_LEAVES_RAF__) {
          lastTime = performance.now();
          window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderArtistic);
        }
      }, { signal: ac.signal });
      lastTime = performance.now();
      window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderArtistic);
      return;
    }

    // =========================================================================
    // LIVE PHYSICS WEATHER ENGINE (All 11 Weather States + Standalone Rain/Snow)
    // =========================================================================
    const isStandaloneWeather = particleMode !== 'weather';
    const cond = isStandaloneWeather ? particleMode : effWeather.condition;
    const period = effWeather.period;
    const isDay = effWeather.isDay;
    const windKmH = isStandaloneWeather ? (particleMode === 'rain' ? 14 : 7) : Math.max(2, effWeather.windSpeed || 10);
    const gustKmH = isStandaloneWeather ? (particleMode === 'rain' ? 20 : 11) : Math.max(windKmH, effWeather.windGusts || windKmH * 1.4);
    const dirRad = ((effWeather.windDirection || 65) * Math.PI) / 180;
    const rawSign = Math.sin(dirRad);
    const windSign = isStandaloneWeather ? 1 : (Math.abs(rawSign) < 0.25 ? 1 : (rawSign >= 0 ? 1 : -1));

    const isRainLike = (cond === 'drizzle' || cond === 'rain' || cond === 'heavy_rain' || cond === 'storm');
    const isStorm = cond === 'storm';
    const isSnow = cond === 'snow';
    const isWindy = cond === 'windy';
    const isFog = cond === 'fog';
    const hasClouds = !isStandaloneWeather && (cond === 'partly_cloudy' || cond === 'mostly_cloudy' || cond === 'overcast' || isRainLike || isSnow || isWindy);
    const hasSunbeams = !isStandaloneWeather && isDay && (cond === 'clear' || cond === 'partly_cloudy');
    const hasNightSky = !isStandaloneWeather && !isDay && (cond === 'clear' || cond === 'partly_cloudy');

    // Time-of-day harmonized atmospheric palettes
    const cloudRgb = isStorm ? '48, 58, 78'
      : isRainLike ? (isDay ? '106, 122, 146' : '44, 58, 82')
      : cond === 'overcast' ? (isDay ? '148, 158, 174' : '64, 76, 98')
      : period === 'morning' ? '255, 224, 198'
      : period === 'noon' ? '248, 252, 255'
      : period === 'afternoon' ? '255, 192, 140'
      : period === 'evening' ? '156, 148, 196'
      : '112, 134, 174';

    const rainHeadColor = isStorm ? '224, 240, 255'
      : period === 'afternoon' ? '255, 222, 188'
      : period === 'morning' ? '242, 238, 228'
      : isDay ? '218, 236, 252'
      : '188, 218, 248';

    const orbRgb = !isDay ? '251, 191, 36'
      : period === 'noon' ? '255, 250, 224'
      : period === 'afternoon' ? '253, 186, 116'
      : '254, 230, 168';

    const cloudSprite = hasClouds ? createSoftPuffSprite(160, cloudRgb) : null;
    const mistSprite = (isFog || cond === 'overcast' || isRainLike) ? createSoftPuffSprite(180, isDay ? '208, 220, 234' : '116, 134, 162') : null;
    const glowSprite = createGlowOrbSprite(48, isSnow ? '224, 242, 254' : orbRgb);

    // 1) Pre-seeded drifting clouds / mist banks
    const clouds = [];
    const cloudCount = !hasClouds ? 0 : (isStorm ? 14 : cond === 'overcast' ? 16 : cond === 'mostly_cloudy' ? 12 : isRainLike ? 12 : cond === 'partly_cloudy' ? 6 : isWindy ? 7 : isSnow ? 9 : 0);
    for (let i = 0; i < cloudCount; i++) {
      const z = 0.4 + Math.random() * 0.6;
      clouds.push({
        x: Math.random() * (width + 420) - 210,
        y: -45 + Math.random() * (height * (cond === 'overcast' ? 0.42 : 0.30)),
        w: (210 + Math.random() * 280) * z,
        h: (85 + Math.random() * 110) * z,
        vx: windSign * (0.14 + (windKmH / 45) * 0.72) * (0.5 + z * 0.7),
        alpha: (cond === 'overcast' ? 0.34 : isStorm ? 0.40 : cond === 'mostly_cloudy' ? 0.28 : isRainLike ? 0.28 : 0.18) * (0.7 + Math.random() * 0.45)
      });
    }

    const mistBands = [];
    const mistCount = isStandaloneWeather ? (isRainLike ? 2 : 0) : (isFog ? 16 : (cond === 'overcast' ? 5 : isRainLike ? 5 : 0));
    for (let i = 0; i < mistCount; i++) {
      mistBands.push({
        x: Math.random() * (width + 500) - 250,
        y: height * (isFog ? (0.18 + Math.random() * 0.80) : (0.58 + Math.random() * 0.40)),
        w: 320 + Math.random() * 420,
        h: 110 + Math.random() * 140,
        vx: windSign * (0.12 + Math.random() * 0.25 + (isRainLike ? 0.22 : 0)),
        phase: Math.random() * Math.PI * 2,
        alpha: (isFog ? 0.34 : 0.14) * (0.7 + Math.random() * 0.45)
      });
    }

    // 2) Rain / Snow / Wind Leaves / Atmospheric Motes
    const drops = [];
    const splashes = [];
    const ripples = [];

    function resetRainDrop(d, fromTop = true) {
      const z = 0.32 + Math.random() * 0.68;
      d.z = z;
      d.x = Math.random() * (width + 360) - 180;
      d.y = fromTop ? -(20 + Math.random() * height * 0.35) : Math.random() * height;
      const baseVy = cond === 'drizzle' ? 6.5 : cond === 'rain' ? 12.5 : cond === 'heavy_rain' ? 16.5 : 19.5;
      d.vy = (baseVy + Math.random() * (baseVy * 0.45)) * (0.52 + z * 0.65);
      d.len = (cond === 'drizzle' ? 9 : cond === 'rain' ? 16 : cond === 'heavy_rain' ? 23 : 28) * (0.55 + z * 0.72);
      d.thick = (cond === 'drizzle' ? 0.65 : isStorm ? 1.25 : 1.0) * (0.48 + z * 0.78);
      d.alpha = (cond === 'drizzle' ? 0.30 : cond === 'rain' ? 0.46 : 0.60) * (0.35 + z * 0.72);
      d.impactY = height - (2 + Math.random() * 16);
      return d;
    }

    const baseRainCount = cond === 'drizzle' ? 68 : cond === 'rain' ? 135 : cond === 'heavy_rain' ? 210 : isStorm ? 265 : 0;

    // Snowflakes
    const flakes = [];
    function resetFlake(f, fromTop = true) {
      const z = 0.30 + Math.random() * 0.70;
      f.z = z;
      f.x = Math.random() * (width + 180) - 90;
      f.y = fromTop ? -(12 + Math.random() * 45) : Math.random() * height;
      f.size = (1.6 + Math.random() * 3.8) * (0.5 + z * 0.85);
      f.vy = (0.55 + Math.random() * 1.15) * (0.45 + z * 0.75);
      f.swing = Math.random() * Math.PI * 2;
      f.swingSpd = 0.012 + Math.random() * 0.022;
      f.swingAmp = (0.35 + Math.random() * 0.9) * z;
      f.rot = Math.random() * Math.PI * 2;
      f.vRot = (Math.random() - 0.5) * 0.018;
      f.crystal = z > 0.72 && Math.random() < 0.55;
      f.alpha = 0.35 + z * 0.58;
      return f;
    }
    const baseSnowCount = isSnow ? 98 : 0;

    // Wind Ribbons & Tumbling Leaves (windy / storm debris / breezy overcast)
    const windRibbons = [];
    const ribbonCount = isWindy ? 9 : isStorm ? 5 : 0;
    function resetRibbon(r, randomX = false) {
      r.x = randomX ? Math.random() * width : (windSign > 0 ? -240 - Math.random() * 260 : width + 240 + Math.random() * 260);
      r.y = 40 + Math.random() * (height - 80);
      r.len = 110 + Math.random() * 190;
      r.amp = 6 + Math.random() * 16;
      r.freq = 0.018 + Math.random() * 0.016;
      r.vx = windSign * (5.5 + Math.random() * 6.5 + (windKmH / 12));
      r.phase = Math.random() * Math.PI * 2;
      r.alpha = (isWindy ? 0.22 : 0.16) * (0.65 + Math.random() * 0.5);
      r.life = 0;
      r.maxLife = 75 + Math.random() * 85;
      return r;
    }
    for (let i = 0; i < ribbonCount; i++) windRibbons.push(resetRibbon({}, true));

    const MEDIEVAL_LEAVES = [
      { fill: '#d97706', vein: '#78350f' },
      { fill: '#f59e0b', vein: '#92400e' },
      { fill: '#b45309', vein: '#451a03' },
      { fill: '#dc2626', vein: '#7f1d1d' },
      { fill: '#65a30d', vein: '#365314' },
      { fill: '#eab308', vein: '#854d0e' }
    ];
    const windLeaves = [];
    const baseLeafCount = isWindy ? 26 : isStorm ? 10 : ((cond === 'overcast' || cond === 'mostly_cloudy') && windKmH >= 12 ? 8 : 0);
    function resetWindLeaf(l, fromEdge = true) {
      const pal = MEDIEVAL_LEAVES[Math.floor(Math.random() * MEDIEVAL_LEAVES.length)];
      const z = 0.45 + Math.random() * 0.55;
      l.z = z;
      if (fromEdge) {
        if (Math.random() < 0.65) {
          l.x = windSign > 0 ? -24 : width + 24;
          l.y = Math.random() * height * 0.85;
        } else {
          l.x = Math.random() * width;
          l.y = -20;
        }
      } else {
        l.x = Math.random() * width;
        l.y = Math.random() * height;
      }
      l.size = (5.5 + Math.random() * 5.5) * z;
      l.vy = (0.35 + Math.random() * 0.85) * z;
      l.vxBase = windSign * (1.2 + (windKmH / 14) * (0.7 + Math.random() * 0.8)) * z;
      l.angle = Math.random() * Math.PI * 2;
      l.vAngle = (Math.random() - 0.5) * (isWindy || isStorm ? 0.14 : 0.045);
      l.flip = Math.random() * Math.PI * 2;
      l.vFlip = 0.04 + Math.random() * 0.07;
      l.flutter = Math.random() * Math.PI * 2;
      l.flutterSpd = 0.04 + Math.random() * 0.05;
      l.color = pal.fill;
      l.vein = pal.vein;
      l.alpha = (isStorm ? 0.55 : 0.72) * z;
      return l;
    }

    // Sun motes / Night embers / Fog dew motes
    const motes = [];
    const baseMoteCount = (cond === 'clear' || cond === 'partly_cloudy') ? 32
      : (isFog ? 26 : (cond === 'mostly_cloudy' || cond === 'overcast') ? 16 : 0);
    function resetMote(m, randomY = false) {
      const isNightEmber = !isDay && (cond === 'clear' || cond === 'partly_cloudy');
      m.x = Math.random() * width;
      m.y = randomY ? (isNightEmber ? height * (0.42 + Math.random() * 0.58) : Math.random() * height)
        : (isNightEmber ? height + 10 : Math.random() * height);
      m.r = (isNightEmber ? 2.6 : 2.2) + Math.random() * (isNightEmber ? 4.4 : 3.4);
      m.vy = isNightEmber ? -(0.18 + Math.random() * 0.36) : -(0.06 + Math.random() * 0.16);
      m.vx = windSign * (0.08 + Math.random() * 0.25);
      m.phase = Math.random() * Math.PI * 2;
      m.pulseSpd = 0.016 + Math.random() * 0.028;
      m.alpha = (isNightEmber ? 0.78 : isFog ? 0.32 : 0.56) * (0.65 + Math.random() * 0.35);
      return m;
    }

    // Night stars & shooting star
    const stars = [];
    const starCount = hasNightSky ? (cond === 'clear' ? 46 : 22) : 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.48),
        r: 0.7 + Math.random() * 1.6,
        sparkle: Math.random() < 0.28,
        phase: Math.random() * Math.PI * 2,
        spd: 0.015 + Math.random() * 0.032,
        alpha: 0.35 + Math.random() * 0.55
      });
    }
    let shootingStar = null;
    let nextShootAt = performance.now() + 5000 + Math.random() * 9000;

    // Storm fractal lightning state
    let activeBolt = null;
    let nextLightningAt = performance.now() + 2600 + Math.random() * 4800;

    let isVisible = !document.hidden;
    let lastTime = performance.now();

    function drawStarSparkle(x, y, r, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2.6);
      ctx.quadraticCurveTo(x, y, x + r * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 2.6);
      ctx.quadraticCurveTo(x, y, x - r * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y - r * 2.6);
      ctx.fill();
      ctx.restore();
    }

    function drawSnowCrystal(x, y, r, rot, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = Math.max(0.7, r * 0.18);
      ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);
        ctx.moveTo(0, -r * 0.56);
        ctx.lineTo(r * 0.26, -r * 0.78);
        ctx.moveTo(0, -r * 0.56);
        ctx.lineTo(-r * 0.26, -r * 0.78);
        ctx.stroke();
      }
      ctx.restore();
    }

    function renderWeather(now) {
      if (!canvas || !canvas.isConnected || !isVisible) {
        window.__AGY_LEAVES_RAF__ = 0;
        return;
      }

      const elapsed = now - lastTime;
      lastTime = now;
      const dt = Math.min(2.0, Math.max(0.4, elapsed / 16.67));
      const speedMult = window.__AGY_PARTICLE_SPEED__ || 1.0;
      const spd = speedMult * dt;
      const tSec = now * 0.001;
      const densityScale = Math.max(0.45, Math.min(2.1, (window.__AGY_PARTICLE_TARGET_COUNT__ || 22) / 22));

      // Live harmonically modulated wind gust field
      const gustWave = 0.55 * Math.sin(tSec * 0.45) + 0.30 * Math.sin(tSec * 1.17 + 1.4) + 0.15 * Math.sin(tSec * 2.31 + 0.7);
      window.__AGY_LIVE_WIND_GUST__ = gustWave;
      const baseWindPx = (windKmH / 10) * (isStorm ? 1.55 : isRainLike ? 1.1 : 1.0);
      const gustExtraPx = Math.max(0.35, (gustKmH - windKmH) / 14);
      const windNow = windSign * (baseWindPx + gustExtraPx * gustWave);

      ctx.clearRect(0, 0, width, height);

      // --- A) Night Twinkling Stars & Periodic Shooting Star ---
      if (hasNightSky && stars.length > 0) {
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.phase += s.spd * spd;
          const tw = 0.45 + 0.55 * Math.sin(s.phase);
          if (s.sparkle) {
            drawStarSparkle(s.x, s.y, s.r, s.alpha * tw);
          } else {
            ctx.fillStyle = `rgba(241, 245, 255, ${(s.alpha * tw).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (!shootingStar && now >= nextShootAt) {
          shootingStar = {
            x: width * (0.15 + Math.random() * 0.65),
            y: height * (0.04 + Math.random() * 0.20),
            vx: (Math.random() < 0.5 ? 1 : -1) * (9.5 + Math.random() * 4.5),
            vy: 3.2 + Math.random() * 2.6,
            life: 0,
            maxLife: 24 + Math.random() * 14
          };
          nextShootAt = now + 8000 + Math.random() * 13000;
        }
        if (shootingStar) {
          shootingStar.x += shootingStar.vx * spd;
          shootingStar.y += shootingStar.vy * spd;
          shootingStar.life += spd;
          const prog = shootingStar.life / shootingStar.maxLife;
          if (prog >= 1) {
            shootingStar = null;
          } else {
            const a = Math.sin(prog * Math.PI) * 0.82;
            const tailX = shootingStar.x - shootingStar.vx * 5.2;
            const tailY = shootingStar.y - shootingStar.vy * 5.2;
            const grad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
            grad.addColorStop(0.35, `rgba(186, 230, 253, ${(a * 0.55).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(shootingStar.x, shootingStar.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
          }
        }
      }

      // --- B) Daytime Volumetric Sunbeams / God Rays ---
      if (hasSunbeams) {
        const beamCount = cond === 'clear' ? 4 : 2;
        const beamRgb = period === 'afternoon' ? '255, 198, 128' : period === 'morning' ? '255, 232, 182' : '255, 250, 226';
        const originX = period === 'noon' ? width * 0.52 : width * 0.58;
        const slantX = period === 'noon' ? -width * 0.08 : -width * 0.24;
        ctx.save();
        for (let b = 0; b < beamCount; b++) {
          const breathe = 0.65 + 0.35 * Math.sin(tSec * (0.32 + b * 0.11) + b * 1.7);
          const alpha = (cond === 'clear' ? 0.055 : 0.032) * breathe;
          const xTop = originX + (b - 1.5) * (width * 0.12);
          const wTop = width * (0.045 + (b % 2) * 0.025);
          const xBot = xTop + slantX;
          const wBot = wTop * 2.5;
          const grad = ctx.createLinearGradient(xTop, 0, xBot, height * 0.82);
          grad.addColorStop(0, `rgba(${beamRgb}, ${alpha.toFixed(4)})`);
          grad.addColorStop(0.55, `rgba(${beamRgb}, ${(alpha * 0.45).toFixed(4)})`);
          grad.addColorStop(1, `rgba(${beamRgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(xTop, 0);
          ctx.lineTo(xTop + wTop, 0);
          ctx.lineTo(xBot + wBot, height * 0.85);
          ctx.lineTo(xBot, height * 0.85);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // --- C) Parallax Drifting Clouds (Pre-baked Sprite, Zero Live Blur) ---
      if (cloudSprite && clouds.length > 0) {
        for (let i = 0; i < clouds.length; i++) {
          const c = clouds[i];
          c.x += (c.vx + windNow * 0.04) * spd;
          if (c.vx >= 0 && c.x > width + 80) c.x = -c.w - 60;
          else if (c.vx < 0 && c.x + c.w < -80) c.x = width + 60;
          ctx.globalAlpha = c.alpha;
          ctx.drawImage(cloudSprite, c.x, c.y, c.w, c.h);
        }
        ctx.globalAlpha = 1;
      }

      // --- D) Low-Altitude Drifting Mist / Fog Sheets ---
      if (mistSprite && mistBands.length > 0) {
        for (let i = 0; i < mistBands.length; i++) {
          const m = mistBands[i];
          m.phase += 0.008 * spd;
          m.x += m.vx * spd;
          if (m.vx >= 0 && m.x > width + 100) m.x = -m.w - 80;
          else if (m.vx < 0 && m.x + m.w < -100) m.x = width + 80;
          const bob = Math.sin(m.phase) * 8;
          ctx.globalAlpha = m.alpha * (0.82 + 0.18 * Math.cos(m.phase));
          ctx.drawImage(mistSprite, m.x, m.y + bob, m.w, m.h);
        }
        ctx.globalAlpha = 1;
      }

      // --- E) Storm Procedural Fractal Lightning ---
      if (isStorm) {
        if (!activeBolt && now >= nextLightningAt) {
          const sx = width * (0.14 + Math.random() * 0.72);
          const ex = sx + (Math.random() - 0.5) * 200;
          const ey = height * (0.38 + Math.random() * 0.34);
          const segs = [];
          buildLightningSegments(sx, 0, ex, ey, 95, 4, segs);
          activeBolt = { segs, start: now, duration: 390 };
          nextLightningAt = now + 4500 + Math.random() * 7500;
          if (typeof window.__AGY_TRIGGER_THUNDER__ === 'function') {
            window.__AGY_TRIGGER_THUNDER__();
          }
        }
        if (activeBolt) {
          const age = now - activeBolt.start;
          if (age > activeBolt.duration) {
            activeBolt = null;
          } else {
            // Double-flicker realistic discharge envelope
            let env = 0;
            if (age < 65) env = 1.0 - (age / 65) * 0.55;
            else if (age < 115) env = 0.22;
            else if (age < 195) env = 0.88 * (1 - (age - 115) / 140);
            else env = Math.max(0, 0.38 * (1 - (age - 195) / (activeBolt.duration - 195)));

            // Gentle ambient sky illumination (capped comfortably at <= 0.13)
            ctx.fillStyle = `rgba(196, 224, 255, ${(env * 0.13).toFixed(4)})`;
            ctx.fillRect(0, 0, width, height);

            // Outer glow pass + sharp white core pass
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = `rgba(147, 197, 253, ${(env * 0.45).toFixed(3)})`;
            ctx.lineWidth = 5.5;
            ctx.beginPath();
            for (let i = 0; i < activeBolt.segs.length; i++) {
              const s = activeBolt.segs[i];
              if (!s.main) continue;
              ctx.moveTo(s.x0, s.y0);
              ctx.lineTo(s.x1, s.y1);
            }
            ctx.stroke();

            ctx.strokeStyle = `rgba(248, 250, 255, ${(env * 0.92).toFixed(3)})`;
            for (let i = 0; i < activeBolt.segs.length; i++) {
              const s = activeBolt.segs[i];
              ctx.lineWidth = s.main ? 1.85 : 0.9;
              ctx.beginPath();
              ctx.moveTo(s.x0, s.y0);
              ctx.lineTo(s.x1, s.y1);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      // --- F) Aerodynamic Wind Ribbons (Windy / Storm Gusts) ---
      if (windRibbons.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < windRibbons.length; i++) {
          const r = windRibbons[i];
          r.x += (r.vx + windNow * 0.45) * spd;
          r.life += spd;
          if (r.life >= r.maxLife || (windSign > 0 && r.x - r.len > width + 80) || (windSign < 0 && r.x + r.len < -80)) {
            resetRibbon(r, false);
          }
          const env = Math.sin((r.life / r.maxLife) * Math.PI);
          const a = r.alpha * env;
          if (a <= 0.01) continue;
          const tailX = r.x - windSign * r.len;
          const grad = ctx.createLinearGradient(tailX, r.y, r.x, r.y);
          grad.addColorStop(0, 'rgba(226, 240, 255, 0)');
          grad.addColorStop(0.55, `rgba(226, 240, 255, ${a.toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          const steps = 10;
          for (let s = 0; s <= steps; s++) {
            const frac = s / steps;
            const px = tailX + (r.x - tailX) * frac;
            const py = r.y + Math.sin(px * r.freq + r.phase + tSec * 2.2) * r.amp * Math.sin(frac * Math.PI);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- G) Multi-Depth Physical Rain + Ballistic Splashes & Water Ripples ---
      if (isRainLike) {
        const targetDrops = Math.round(baseRainCount * densityScale);
        while (drops.length < targetDrops) drops.push(resetRainDrop({}, drops.length >= baseRainCount));
        while (drops.length > targetDrops) drops.pop();

        ctx.lineCap = 'round';
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          const vx = windNow * (0.45 + d.z * 0.70);
          d.x += vx * spd;
          d.y += d.vy * spd;

          if (d.y >= d.impactY) {
            // Spawn realistic micro-splash & water ripple for mid/near raindrops
            if (d.z > 0.56 && splashes.length < 75 && Math.random() < (cond === 'drizzle' ? 0.16 : 0.42)) {
              const spN = isStorm || cond === 'heavy_rain' ? 3 : 2;
              for (let k = 0; k < spN; k++) {
                splashes.push({
                  x: d.x,
                  y: d.impactY,
                  vx: (Math.random() - 0.5) * 2.8 + vx * 0.14,
                  vy: -(1.2 + Math.random() * 2.2) * d.z,
                  life: 0,
                  maxLife: 10 + Math.random() * 8,
                  r: 0.75 + d.z * 0.55,
                  alpha: d.alpha * 0.85
                });
              }
              if (ripples.length < 28 && Math.random() < 0.45) {
                ripples.push({
                  x: d.x,
                  y: d.impactY,
                  rx: 1.5,
                  maxRx: 9 + d.z * 11,
                  alpha: d.alpha * 0.55
                });
              }
            }
            resetRainDrop(d, true);
            continue;
          }
          if (d.x > width + 220 || d.x < -220) {
            resetRainDrop(d, true);
            continue;
          }

          // Velocity-aligned rain streak (two-stage tapered tail + bright specular head)
          const invNorm = d.len / Math.hypot(vx, d.vy);
          const dx = vx * invNorm;
          const dy = d.vy * invNorm;
          const mx = d.x - dx * 0.35;
          const my = d.y - dy * 0.35;
          const tx = d.x - dx;
          const ty = d.y - dy;

          ctx.lineWidth = d.thick;
          ctx.strokeStyle = `rgba(${rainHeadColor}, ${(d.alpha * 0.40).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(mx, my);
          ctx.stroke();

          ctx.strokeStyle = `rgba(${rainHeadColor}, ${d.alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }

        // Update & draw bottom splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.vy += 0.21 * spd;
          sp.x += sp.vx * spd;
          sp.y += sp.vy * spd;
          sp.life += spd;
          if (sp.life >= sp.maxLife) {
            splashes.splice(i, 1);
            continue;
          }
          const a = sp.alpha * (1 - sp.life / sp.maxLife);
          ctx.fillStyle = `rgba(${rainHeadColor}, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Update & draw subtle bottom ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.rx += 0.55 * spd;
          if (rp.rx >= rp.maxRx) {
            ripples.splice(i, 1);
            continue;
          }
          const a = rp.alpha * (1 - rp.rx / rp.maxRx);
          ctx.strokeStyle = `rgba(${rainHeadColor}, ${a.toFixed(3)})`;
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.rx, rp.rx * 0.26, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- H) Multi-Depth Crystalline Snowfall ---
      if (isSnow) {
        const targetFlakes = Math.round(baseSnowCount * densityScale);
        while (flakes.length < targetFlakes) flakes.push(resetFlake({}, flakes.length >= baseSnowCount));
        while (flakes.length > targetFlakes) flakes.pop();

        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          f.swing += f.swingSpd * spd;
          f.rot += f.vRot * spd;
          f.y += f.vy * spd;
          f.x += (windNow * (0.22 + f.z * 0.30) + Math.sin(f.swing) * f.swingAmp) * spd;
          if (f.y > height + 16 || f.x > width + 100 || f.x < -100) {
            resetFlake(f, true);
          }
          if (f.crystal) {
            drawSnowCrystal(f.x, f.y, f.size * 1.35, f.rot, f.alpha);
          } else {
            ctx.globalAlpha = f.alpha;
            ctx.drawImage(glowSprite, f.x - f.size * 1.6, f.y - f.size * 1.6, f.size * 3.2, f.size * 3.2);
          }
        }
        ctx.globalAlpha = 1;
      }

      // --- I) Wind-Swept Tumbling Leaves (Windy / Storm / Breezy Overcast) ---
      if (baseLeafCount > 0) {
        const targetLeaves = Math.round(baseLeafCount * densityScale);
        while (windLeaves.length < targetLeaves) windLeaves.push(resetWindLeaf({}, windLeaves.length >= baseLeafCount));
        while (windLeaves.length > targetLeaves) windLeaves.pop();

        for (let i = 0; i < windLeaves.length; i++) {
          const l = windLeaves[i];
          l.flutter += l.flutterSpd * spd;
          l.angle += (l.vAngle + windNow * 0.012) * spd;
          l.flip += l.vFlip * spd;
          // Aerodynamic upward lift eddies during strong wind surges
          const eddyLift = (isWindy || isStorm) ? Math.sin(l.flutter) * (0.95 + Math.abs(gustWave) * 1.2) : Math.sin(l.flutter) * 0.35;
          l.y += (l.vy + eddyLift) * spd;
          l.x += (l.vxBase + windNow * 0.42) * spd;

          if (l.y > height + 30 || l.y < -60 || l.x > width + 45 || l.x < -45) {
            resetWindLeaf(l, true);
          }

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.angle);
          ctx.scale(0.38 + 0.62 * Math.cos(l.flip), 1);
          ctx.globalAlpha = l.alpha;
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.moveTo(0, -l.size);
          ctx.bezierCurveTo(l.size * 0.68, -l.size * 0.30, l.size * 0.68, l.size * 0.60, 0, l.size);
          ctx.bezierCurveTo(-l.size * 0.68, l.size * 0.60, -l.size * 0.68, -l.size * 0.30, 0, -l.size);
          ctx.fill();
          ctx.strokeStyle = l.vein;
          ctx.lineWidth = 0.55;
          ctx.beginPath();
          ctx.moveTo(0, -l.size * 0.8);
          ctx.lineTo(0, l.size * 0.8);
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- J) Luminous WLOP Sun Motes / Night Golden Town Embers / Mist Dew ---
      if (baseMoteCount > 0) {
        const targetMotes = Math.round(baseMoteCount * densityScale);
        while (motes.length < targetMotes) motes.push(resetMote({}, true));
        while (motes.length > targetMotes) motes.pop();

        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          m.phase += m.pulseSpd * spd;
          m.y += m.vy * spd;
          m.x += (m.vx + Math.sin(m.phase) * 0.22 + windNow * 0.04) * spd;
          if (m.y < -15 || m.x > width + 20 || m.x < -20) {
            resetMote(m, false);
          }
          const pulse = 0.45 + 0.55 * Math.sin(m.phase);
          ctx.globalAlpha = m.alpha * pulse;
          const dSize = m.r * 3.2;
          ctx.drawImage(glowSprite, m.x - dSize * 0.5, m.y - dSize * 0.5, dSize, dSize);
        }
        ctx.globalAlpha = 1;
      }

      window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderWeather);
    }

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible && !window.__AGY_LEAVES_RAF__) {
        lastTime = performance.now();
        window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderWeather);
      }
    }, { signal: ac.signal });

    lastTime = performance.now();
    window.__AGY_LEAVES_RAF__ = requestAnimationFrame(renderWeather);
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
  const staleWeatherHud = document.getElementById('agy-weather-hud-pill');
  if (staleWeatherHud) staleWeatherHud.remove();

  window.__AGY_HOLE_EL__ = null;
  if (window.__AGY_MODAL_OBSERVER__) {
    window.__AGY_MODAL_OBSERVER__.disconnect();
  }
  window.__AGY_MODAL_OBSERVER__ = new MutationObserver((mutations) => {
    let relevant = false;
    let holeChanged = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'attributes') {
        if (m.attributeName === 'data-has-browser-hole' || m.attributeName === 'data-browser-hole') {
          relevant = true;
          holeChanged = true;
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
          target.closest?.('#agy-weather-hud-pill') ||
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
    if (holeChanged) {
      requestAnimationFrame(() => syncShellMetrics());
      setTimeout(() => syncShellMetrics(), 140);
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
