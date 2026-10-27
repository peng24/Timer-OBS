/**
 * storage.js - จัดการการบันทึกและโหลดการตั้งค่าผ่าน LocalStorage
 */

const STORAGE_KEY = 'timerOBS_settings_v1';

const DEFAULT_SETTINGS = {
  clock: {
    format12: false,
    showSeconds: true,
    showDate: true,
    dateFormat: 'long', // 'long' (วันอังคารที่ 27 ตุลาคม 2569), 'short' (27 ต.ค. 69), 'en' (Tue 27 Oct 2026)
    dateLocale: 'th',
  },
  style: {
    fontFamily: 'Kanit',
    fontSize: 72,
    fontWeight: '600',
    letterSpacing: 2,
    textColor: '#ffffff',
    textStroke: true,
    strokeColor: '#000000',
    strokeWidth: 3,
    textShadow: true,
    shadowColor: 'rgba(0, 0, 0, 0.85)',
    shadowBlur: 12,
    bgTransparent: false,
    bgColor: '#111827',
    bgOpacity: 0.75,
    borderRadius: 20,
    paddingX: 36,
    paddingY: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    textAlign: 'center',
    speakingPulse: true,
    secondsCustomStyle: true,
    secondsColor: '#94a3b8',
    secondsOpacity: 0.85,
    secondsScale: 0.72,
  },
  audio: {
    masterMute: false,
    ttsEngine: 'google', // 'google' (Google TTS ออนไลน์ ฟรี เป็นธรรมชาติที่สุด) | 'browser' (Web Speech API)
    ttsVolume: 1.0,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVoice: '',
    alarmVolume: 0.8,
  },
  rules: [
    {
      id: 'rule_hourly',
      name: 'บอกเวลาทุกต้นชั่วโมง',
      enabled: true,
      type: 'interval', // 'interval' | 'specific'
      intervalMinutes: 60,
      time: '00:00',
      mode: 'both', // 'alarm' | 'tts' | 'both'
      soundEffect: 'bell', // 'bell' | 'chime' | 'digital' | 'dingdong' | 'marimba' | 'custom'
      customAudioUrl: '',
      messageTemplate: 'ขณะนี้เวลา {time} ค่ะ',
    },
    {
      id: 'rule_hydrate',
      name: 'เตือนดื่มน้ำทุก 30 นาที',
      enabled: false,
      type: 'interval',
      intervalMinutes: 30,
      time: '00:00',
      mode: 'both',
      soundEffect: 'dingdong',
      customAudioUrl: '',
      messageTemplate: 'ผ่านไป 30 นาทีแล้ว พักสายตาและดื่มน้ำกันด้วยนะคะ',
    },
    {
      id: 'rule_noon',
      name: 'เตือนพักเที่ยง (12:00)',
      enabled: false,
      type: 'specific',
      intervalMinutes: 60,
      time: '12:00',
      mode: 'both',
      soundEffect: 'marimba',
      customAudioUrl: '',
      messageTemplate: 'เวลาเที่ยงวันแล้ว อย่าลืมพักรับประทานอาหารกลางวันนะคะ',
    }
  ]
};

const THEME_PRESETS = {
  modern_dark: {
    name: '✨ Modern Dark',
    style: {
      fontFamily: 'Kanit',
      fontSize: 72,
      fontWeight: '600',
      letterSpacing: 2,
      textColor: '#ffffff',
      textStroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      textShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.85)',
      shadowBlur: 12,
      bgTransparent: false,
      bgColor: '#111827',
      bgOpacity: 0.75,
      borderRadius: 20,
      paddingX: 36,
      paddingY: 20,
      secondsCustomStyle: true,
      secondsColor: '#94a3b8',
      secondsOpacity: 0.85,
      secondsScale: 0.72,
    }
  },
  cyberpunk: {
    name: '⚡ Cyberpunk Neon',
    style: {
      fontFamily: 'Chakra Petch',
      fontSize: 74,
      fontWeight: '700',
      letterSpacing: 3,
      textColor: '#00f3ff',
      textStroke: true,
      strokeColor: '#1e1b4b',
      strokeWidth: 3.5,
      textShadow: true,
      shadowColor: 'rgba(0, 243, 255, 0.65)',
      shadowBlur: 16,
      bgTransparent: false,
      bgColor: '#090d16',
      bgOpacity: 0.85,
      borderRadius: 12,
      paddingX: 40,
      paddingY: 20,
      secondsCustomStyle: true,
      secondsColor: '#f43f5e',
      secondsOpacity: 0.9,
      secondsScale: 0.7,
    }
  },
  pastel_cute: {
    name: '🌸 Pastel Cute',
    style: {
      fontFamily: 'Mali',
      fontSize: 68,
      fontWeight: '600',
      letterSpacing: 1,
      textColor: '#fdf2f8',
      textStroke: true,
      strokeColor: '#831843',
      strokeWidth: 3,
      textShadow: true,
      shadowColor: 'rgba(131, 24, 67, 0.5)',
      shadowBlur: 10,
      bgTransparent: false,
      bgColor: '#ec4899',
      bgOpacity: 0.35,
      borderRadius: 32,
      paddingX: 40,
      paddingY: 20,
      secondsCustomStyle: true,
      secondsColor: '#fbcfe8',
      secondsOpacity: 0.85,
      secondsScale: 0.72,
    }
  },
  minimal_clean: {
    name: '🌿 Minimal Clean',
    style: {
      fontFamily: 'Prompt',
      fontSize: 68,
      fontWeight: '500',
      letterSpacing: 2,
      textColor: '#f8fafc',
      textStroke: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      textShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 8,
      bgTransparent: false,
      bgColor: '#0f172a',
      bgOpacity: 0.5,
      borderRadius: 16,
      paddingX: 32,
      paddingY: 16,
      secondsCustomStyle: true,
      secondsColor: '#94a3b8',
      secondsOpacity: 0.75,
      secondsScale: 0.72,
    }
  },
  gold_luxury: {
    name: '🔥 Gold Luxury',
    style: {
      fontFamily: 'Chonburi',
      fontSize: 70,
      fontWeight: '400',
      letterSpacing: 2,
      textColor: '#fde047',
      textStroke: true,
      strokeColor: '#1c1917',
      strokeWidth: 3.5,
      textShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.9)',
      shadowBlur: 14,
      bgTransparent: false,
      bgColor: '#1c1917',
      bgOpacity: 0.8,
      borderRadius: 24,
      paddingX: 40,
      paddingY: 20,
      secondsCustomStyle: true,
      secondsColor: '#fbbf24',
      secondsOpacity: 0.75,
      secondsScale: 0.7,
    }
  },
  pure_overlay: {
    name: '👻 Pure Overlay (ไร้กรอบ)',
    style: {
      fontFamily: 'Mitr',
      fontSize: 76,
      fontWeight: '600',
      letterSpacing: 2,
      textColor: '#ffffff',
      textStroke: true,
      strokeColor: '#000000',
      strokeWidth: 4,
      textShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      bgTransparent: true,
      bgColor: '#111827',
      bgOpacity: 0.75,
      borderRadius: 20,
      paddingX: 24,
      paddingY: 16,
      secondsCustomStyle: true,
      secondsColor: '#cbd5e1',
      secondsOpacity: 0.85,
      secondsScale: 0.72,
    }
  }
};

window.THEME_PRESETS = THEME_PRESETS;

class StorageManager {
  constructor() {
    this.settings = this.load();
  }

  /**
   * แปลง JSON เป็น Base64 URL-safe สำหรับแนบไปกับลิงก์ OBS
   */
  encodeToUrlParam() {
    try {
      const jsonStr = JSON.stringify(this.settings);
      const bytes = new TextEncoder().encode(jsonStr);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (e) {
      console.error('Failed to encode settings to URL param', e);
      return '';
    }
  }

  /**
   * ถอดรหัส Base64 URL-safe กลับมาเป็น Object การตั้งค่า
   */
  decodeFromUrlParam(cfgStr) {
    try {
      let base64 = cfgStr.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Invalid cfg URL parameter:', e);
      return null;
    }
  }

  /**
   * สร้างลิงก์ OBS Overlay พร้อมแนบค่าการตั้งค่าปัจจุบันทั้งหมด
   */
  getObsOverlayUrl() {
    const cfg = this.encodeToUrlParam();
    const base = `${window.location.origin}${window.location.pathname}?mode=overlay`;
    return cfg ? `${base}&cfg=${cfg}` : base;
  }

  load() {
    try {
      // 1. ตรวจสอบก่อนว่ามีค่าตั้งค่าแนบมากับ URL (?cfg=...) หรือไม่ (สำหรับ OBS Browser Source)
      const urlParams = new URLSearchParams(window.location.search);
      const cfgParam = urlParams.get('cfg');
      if (cfgParam) {
        const decoded = this.decodeFromUrlParam(cfgParam);
        if (decoded && typeof decoded === 'object') {
          const merged = {
            clock: { ...DEFAULT_SETTINGS.clock, ...(decoded.clock || {}) },
            style: { ...DEFAULT_SETTINGS.style, ...(decoded.style || {}) },
            audio: { ...DEFAULT_SETTINGS.audio, ...(decoded.audio || {}) },
            rules: Array.isArray(decoded.rules) && decoded.rules.length > 0
              ? decoded.rules
              : DEFAULT_SETTINGS.rules
          };
          // บันทึกลง localStorage ของ OBS ด้วยเพื่อให้จำค่าไว้ใช้ต่อได้
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        }
      }

      // 2. โหลดจาก localStorage ตามปกติ
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      
      const parsed = JSON.parse(data);
      // Deep merge with defaults to ensure all keys exist
      return {
        clock: { ...DEFAULT_SETTINGS.clock, ...(parsed.clock || {}) },
        style: { ...DEFAULT_SETTINGS.style, ...(parsed.style || {}) },
        audio: { ...DEFAULT_SETTINGS.audio, ...(parsed.audio || {}) },
        rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 
          ? parsed.rules 
          : DEFAULT_SETTINGS.rules
      };
    } catch (e) {
      console.warn('Failed to load settings from localStorage, using defaults.', e);
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  reset() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.save();
    return this.settings;
  }

  exportJSON() {
    return JSON.stringify(this.settings, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
      
      this.settings = {
        clock: { ...DEFAULT_SETTINGS.clock, ...(parsed.clock || {}) },
        style: { ...DEFAULT_SETTINGS.style, ...(parsed.style || {}) },
        audio: { ...DEFAULT_SETTINGS.audio, ...(parsed.audio || {}) },
        rules: Array.isArray(parsed.rules) ? parsed.rules : DEFAULT_SETTINGS.rules
      };
      this.save();
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}

window.storageManager = new StorageManager();
