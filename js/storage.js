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

class StorageManager {
  constructor() {
    this.settings = this.load();
  }

  load() {
    try {
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
