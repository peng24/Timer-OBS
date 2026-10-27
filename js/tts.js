/**
 * tts.js - ระบบอ่านเวลาภาษาไทยฟรี (Free Thai TTS) และตัวตรวจจับตารางเวลา (Schedule Watcher)
 */

class ThaiTTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.lastTriggeredMinute = {}; // เก็บ timestamp ล่าสุดที่ trigger แต่ละ rule เพื่อป้องกัน trigger ซ้ำในนาทีเดียวกัน

    this.initVoices();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.initVoices();
    }
  }

  initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    // ค้นหาเสียงภาษาไทย
    const thaiVoice = this.voices.find(v => v.lang.startsWith('th') || v.lang.includes('TH') || v.name.includes('Thai'));
    if (thaiVoice) {
      this.selectedVoice = thaiVoice;
    }
  }

  getThaiVoices() {
    return this.voices.filter(v => v.lang.startsWith('th') || v.lang.includes('TH') || v.name.includes('Thai'));
  }

  isMuted() {
    return !!window.storageManager?.settings?.audio?.masterMute;
  }

  /**
   * แปลงตัวเลข 0 - 9999 เป็นคำอ่านภาษาไทย
   */
  numberToThai(num) {
    if (isNaN(num)) return '';
    num = Math.floor(Math.abs(num));
    if (num === 0) return 'ศูนย์';

    const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    let strNum = num.toString();
    let len = strNum.length;
    let thaiStr = '';

    for (let i = 0; i < len; i++) {
      let digit = parseInt(strNum[i], 10);
      let pos = len - i - 1;

      if (digit !== 0) {
        if (pos % 6 === 1 && digit === 1) {
          // หลักสิบที่เป็น 1 -> อ่าน "สิบ" ไม่ใช่ "หนึ่งสิบ"
          thaiStr += 'สิบ';
        } else if (pos % 6 === 1 && digit === 2) {
          // หลักสิบที่เป็น 2 -> อ่าน "ยี่สิบ"
          thaiStr += 'ยี่สิบ';
        } else if (pos % 6 === 0 && digit === 1 && len > 1 && strNum[i - 1] !== '0') {
          // หลักหน่วยที่เป็น 1 และมีหลักอื่นนำหน้า -> อ่าน "เอ็ด"
          thaiStr += 'เอ็ด';
        } else {
          thaiStr += digits[digit] + units[pos % 6];
        }
      }
    }
    return thaiStr;
  }

  /**
   * แปลงเวลาปัจจุบันเป็นคำอ่านภาษาไทย เช่น "สิบนาฬิกา ห้านาที" หรือ "สิบสี่นาฬิกา ยี่สิบเอ็ดนาที"
   * ปรับแต่งจังหวะวรรคตอนให้ออกเสียงเป็นธรรมชาติที่สุด
   */
  timeToThaiWords(date = new Date()) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    let hourStr = '';
    if (hours === 0) {
      hourStr = 'เที่ยงคืน';
    } else if (hours === 12) {
      hourStr = 'สิบสองนาฬิกา';
    } else {
      hourStr = this.numberToThai(hours) + 'นาฬิกา';
    }

    let minStr = '';
    if (minutes === 0) {
      minStr = 'ตรง';
    } else {
      minStr = this.numberToThai(minutes) + 'นาที';
    }

    return `${hourStr} ${minStr}`.trim();
  }

  /**
   * แปลงวันที่ปัจจุบันเป็นคำอ่านภาษาไทย
   */
  dateToThaiWords(date = new Date()) {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const dayName = 'วัน' + days[date.getDay()];
    const dateNum = this.numberToThai(date.getDate());
    const monthName = months[date.getMonth()];
    const yearBE = this.numberToThai(date.getFullYear() + 543);

    return `${dayName} ที่ ${dateNum} ${monthName} พุทธศักราช ${yearBE}`;
  }

  /**
   * แทนที่ตัวแปรใน Template
   */
  formatMessage(template, date = new Date()) {
    const timeWords = this.timeToThaiWords(date);
    const dateWords = this.dateToThaiWords(date);
    const hours = this.numberToThai(date.getHours());
    const minutes = this.numberToThai(date.getMinutes());

    return template
      .replace(/\{time\}/g, timeWords)
      .replace(/\{date\}/g, dateWords)
      .replace(/\{hour\}/g, hours)
      .replace(/\{minute\}/g, minutes);
  }

  /**
   * สั่งอ่านข้อความผ่าน Google TTS ฟรี (ให้เสียงธรรมชาติและชัดเจนที่สุด)
   * รองรับ Cloudflare Edge Proxy เพื่อแก้ปัญหา CORS 100% พร้อมระบบ Fallback
   */
  speakGoogleTTS(text) {
    return new Promise((resolve) => {
      if (this.isMuted() || !text) return resolve();

      // หยุดเสียงก่อนหน้าที่กำลังเล่นอยู่
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const audioSettings = window.storageManager?.settings?.audio || {};
      const cleanText = text.trim();

      // เลือก URL: ถ้าอยู่บนเว็บ (Cloudflare / Localhost) ให้ใช้ Edge Proxy /api/tts เพื่อหลีกเลี่ยงปัญหา CORS
      // ถ้าเปิดจากไฟล์ตรงๆ (file://) ให้ใช้ URL ของ Google Translate TTS โดยตรง
      let url = '';
      if (window.location.protocol.startsWith('http')) {
        url = `${window.location.origin}/api/tts?text=${encodeURIComponent(cleanText)}`;
      } else {
        url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      }

      const audio = new Audio();
      this.currentAudio = audio;
      // ห้ามใส่ audio.crossOrigin = 'anonymous' เพราะจะบังคับ CORS preflight ซึ่ง Google บล็อก

      // ปรับระดับเสียงและความเร็ว
      audio.volume = audioSettings.ttsVolume ?? 1.0;
      audio.playbackRate = audioSettings.ttsRate ?? 1.0;

      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (err) => {
        console.warn('Google TTS audio playback failed, falling back to Web Speech API', err);
        this.currentAudio = null;
        this.speakBrowserSpeech(text).then(resolve);
      };

      this.isSpeaking = true;
      audio.src = url;
      audio.play().catch((err) => {
        console.warn('Google TTS play() rejected, falling back to Web Speech API', err);
        this.currentAudio = null;
        this.speakBrowserSpeech(text).then(resolve);
      });
    });
  }

  /**
   * สั่งอ่านข้อความผ่าน Web Speech API (ของระบบ/เบราว์เซอร์)
   */
  speakBrowserSpeech(text) {
    return new Promise((resolve) => {
      if (this.isMuted() || !text) {
        return resolve();
      }

      if (!this.synth) {
        console.warn('Web Speech API is not supported in this browser.');
        return resolve();
      }

      // ปลดล็อกกรณี SpeechSynthesis ถูกเบราว์เซอร์ pause ไว้อัตโนมัติ
      if (this.synth.paused) {
        this.synth.resume();
      }

      // ยกเลิกข้อความก่อนหน้าที่ค้างอยู่
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';

      const audioSettings = window.storageManager?.settings?.audio || {};
      utterance.rate = audioSettings.ttsRate ?? 1.0;
      utterance.pitch = audioSettings.ttsPitch ?? 1.0;
      utterance.volume = audioSettings.ttsVolume ?? 1.0;

      // ค้นหาเสียงที่ผู้ใช้เลือก หรือเสียงภาษาไทยที่ดีที่สุด
      if (audioSettings.ttsVoice) {
        const found = this.voices.find(v => v.voiceURI === audioSettings.ttsVoice || v.name === audioSettings.ttsVoice);
        if (found) utterance.voice = found;
      } else if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e);
        }
        this.isSpeaking = false;
        resolve();
      };

      this.isSpeaking = true;
      this.synth.speak(utterance);
    });
  }

  /**
   * สั่งอ่านข้อความตาม Engine ที่ผู้ใช้เลือก
   */
  speakText(text) {
    const audioSettings = window.storageManager?.settings?.audio || {};
    const engine = audioSettings.ttsEngine || 'google';

    if (engine === 'browser') {
      return this.speakBrowserSpeech(text);
    } else {
      // Default: Google TTS ฟรี เป็นธรรมชาติที่สุด
      return this.speakGoogleTTS(text);
    }
  }

  /**
   * ประมวลผล Rule: เล่นเสียงเตือน และ/หรือ อ่านข้อความ
   */
  async triggerRule(rule, date = new Date()) {
    if (this.isMuted() || !rule.enabled) return;

    const mode = rule.mode || 'both'; // 'alarm', 'tts', 'both'
    const soundEffect = rule.soundEffect || 'chime';
    const message = this.formatMessage(rule.messageTemplate || 'ขณะนี้เวลา {time}', date);

    if (mode === 'alarm') {
      // เสียงปลุกอย่างเดียว
      await window.soundEngine.play(soundEffect, rule.customAudioUrl);
    } else if (mode === 'tts') {
      // อ่านเวลาอย่างเดียว
      await this.speakText(message);
    } else {
      // ทั้งสองอย่าง: เล่นเสียงเตือนนำก่อน จากนั้นจึงอ่านเวลา
      await window.soundEngine.play(soundEffect, rule.customAudioUrl);
      // รอเล็กน้อยให้เสียงระฆัง/กระดิ่งจางลงอย่างเป็นธรรมชาติ
      await new Promise(r => setTimeout(r, 200));
      await this.speakText(message);
    }
  }

  /**
   * ตรวจสอบ Rules ทุกนาที (เรียกจาก Clock Ticker)
   */
  checkSchedules(date = new Date()) {
    const rules = window.storageManager?.settings?.rules || [];
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    const currentSecond = date.getSeconds();

    // เช็คเฉพาะวินาทีที่ 0 (หรือวินาทีที่ 1 หากเกิดจังหวะเหลื่อม) เพื่อหลีกเลี่ยงการเช็คซ้ำ
    if (currentSecond > 2) return;

    const minuteKey = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const totalMinutes = currentHour * 60 + currentMinute;

    rules.forEach((rule) => {
      if (!rule.enabled) return;

      // ตรวจสอบว่าในนาทีนี้ rule นี้ถูก trigger ไปแล้วหรือยัง
      if (this.lastTriggeredMinute[rule.id] === minuteKey) {
        return;
      }

      let shouldTrigger = false;

      if (rule.type === 'interval') {
        const interval = parseInt(rule.intervalMinutes, 10) || 60;
        // เช็คการหารลงตัวของจำนวนนาทีในรอบชั่วโมง (เช่น ทุก 15, 30, 60 นาที)
        if (currentMinute % interval === 0) {
          shouldTrigger = true;
        }
      } else if (rule.type === 'specific') {
        if (rule.time === minuteKey) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        this.lastTriggeredMinute[rule.id] = minuteKey;
        this.triggerRule(rule, date);
      }
    });
  }
}

window.thaiTTS = new ThaiTTSEngine();
