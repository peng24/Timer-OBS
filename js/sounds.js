/**
 * sounds.js - ระบบสังเคราะห์เสียงเอฟเฟกต์นาฬิกาปลุกและแจ้งเตือนด้วย Web Audio API
 * ไม่ต้องใช้ไฟล์เสียงภายนอก โหลดไว 100% ไม่มีปัญหาเน็ตหลุดหรือลิงก์เสีย
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isUnlocked = false;
    this.customAudio = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  /**
   * ตรวจสอบว่าเปิดโหมด Mute อยู่หรือไม่
   */
  isMuted() {
    return !!window.storageManager?.settings?.audio?.masterMute;
  }

  getVolume() {
    const vol = window.storageManager?.settings?.audio?.alarmVolume;
    return typeof vol === 'number' ? Math.max(0, Math.min(1, vol)) : 0.8;
  }

  /**
   * เล่นเสียงตามชื่อ พร้อมคืนค่า Promise เมื่อเสียงจบ
   */
  async play(soundName, customUrl = '') {
    if (this.isMuted()) return;
    this.initContext();

    if (soundName === 'custom' && customUrl) {
      return this.playCustom(customUrl);
    }

    switch (soundName) {
      case 'bell':
        return this.playClockBell();
      case 'chime':
        return this.playChime();
      case 'digital':
        return this.playDigitalAlarm();
      case 'dingdong':
        return this.playDingDong();
      case 'marimba':
        return this.playMarimba();
      default:
        return this.playChime();
    }
  }

  /**
   * 1. Chime - เสียงกระดิ่งกังวาน นุ่มนวล
   */
  playChime() {
    return new Promise((resolve) => {
      if (!this.ctx) return resolve();
      const now = this.ctx.currentTime;
      const volume = this.getVolume();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25 * volume, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.25);
      });

      setTimeout(resolve, 1200);
    });
  }

  /**
   * 2. Digital Alarm - เสียงบี๊บนาฬิกาดิจิทัลคู่ 2 ชุด (Beep-Beep, Beep-Beep)
   */
  playDigitalAlarm() {
    return new Promise((resolve) => {
      if (!this.ctx) return resolve();
      const now = this.ctx.currentTime;
      const volume = this.getVolume();
      const beeps = [0, 0.1, 0.3, 0.4]; // 4 จังหวะ

      beeps.forEach((startOffset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(2048, now + startOffset); // คลื่น Square 2kHz สไตล์ดิจิทัล

        gain.gain.setValueAtTime(0.18 * volume, now + startOffset);
        gain.gain.setValueAtTime(0.18 * volume, now + startOffset + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.09);
      });

      setTimeout(resolve, 600);
    });
  }

  /**
   * 3. Ding-Dong - เสียงติ๊งต่องแจ้งเตือนสองโทน
   */
  playDingDong() {
    return new Promise((resolve) => {
      if (!this.ctx) return resolve();
      const now = this.ctx.currentTime;
      const volume = this.getVolume();

      // Ding (High tone - G5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.35 * volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.75);

      // Dong (Low tone - E5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.35);
      gain2.gain.setValueAtTime(0.35 * volume, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.45);

      setTimeout(resolve, 1400);
    });
  }

  /**
   * 4. Marimba - เสียงเคาะไม้เพลินๆ สไตล์โมเดิร์น
   */
  playMarimba() {
    return new Promise((resolve) => {
      if (!this.ctx) return resolve();
      const now = this.ctx.currentTime;
      const volume = this.getVolume();
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.4 * volume, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });

      setTimeout(resolve, 900);
    });
  }

  /**
   * 5. Clock Bell - เสียงระฆังนาฬิกาโบราณ ก้องกังวานพร้อมฮาร์มอนิก
   */
  playClockBell() {
    return new Promise((resolve) => {
      if (!this.ctx) return resolve();
      const now = this.ctx.currentTime;
      const volume = this.getVolume();
      const baseFreq = 440; // A4
      const harmonics = [1, 2.76, 5.4, 8.9]; // Bell-like inharmonic ratios
      const gains = [0.4, 0.2, 0.1, 0.05];

      harmonics.forEach((ratio, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const decay = 2.0 / (i + 1);
        gain.gain.setValueAtTime(gains[i] * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });

      setTimeout(resolve, 1800);
    });
  }

  /**
   * เล่นไฟล์เสียงที่ผู้ใช้อัปโหลดหรือใส่ URL เอง
   */
  playCustom(url) {
    return new Promise((resolve) => {
      try {
        if (this.customAudio) {
          this.customAudio.pause();
          this.customAudio = null;
        }
        const audio = new Audio(url);
        this.customAudio = audio;
        audio.volume = this.getVolume();
        audio.onended = () => resolve();
        audio.onerror = () => {
          console.warn('Could not play custom audio, fallback to chime');
          this.playChime().then(resolve);
        };
        audio.play().catch((err) => {
          console.warn('Custom audio playback error:', err);
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }
}

window.soundEngine = new SoundEngine();
