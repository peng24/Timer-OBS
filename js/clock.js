/**
 * clock.js - ระบบคำนวณและแสดงผลเวลา/วันที่แบบ Real-time ความแม่นยำสูง
 */

class ClockEngine {
  constructor() {
    this.timeEl = null;
    this.periodEl = null;
    this.dateEl = null;
    this.containerEl = null;
    this.timerId = null;
    this.lastSec = -1;
  }

  init(timeEl, periodEl, dateEl, containerEl) {
    this.timeEl = timeEl;
    this.periodEl = periodEl;
    this.dateEl = dateEl;
    this.containerEl = containerEl;

    this.tick();
    // ใช้ requestAnimationFrame ร่วมกับ interval เพื่อความลื่นไหลและตรงจังหวะวินาทีเป๊ะ
    this.start();
  }

  start() {
    const loop = () => {
      this.tick();
      this.timerId = requestAnimationFrame(loop);
    };
    this.timerId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.timerId) {
      cancelAnimationFrame(this.timerId);
    }
  }

  tick() {
    const now = new Date();
    const sec = now.getSeconds();

    // รัน checkSchedules เมื่อเข้าสู่วินาทีใหม่
    if (sec !== this.lastSec) {
      this.lastSec = sec;
      if (window.thaiTTS) {
        window.thaiTTS.checkSchedules(now);
      }
    }

    this.render(now);
  }

  render(now) {
    const settings = window.storageManager?.settings?.clock || {};

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    let period = '';
    if (settings.format12) {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 -> 12
    }
    const hoursStr = hours.toString().padStart(2, '0');

    // สร้าง Time String (HH:MM) และ Seconds String (:SS) แยกกันเพื่อให้ปรับสี/ขนาดแยกได้
    const hmString = `${hoursStr}:${minutes}`;
    const secString = `:${seconds}`;

    // อัปเดตทั้งนาฬิกาหลักบนหน้าจอ และตัวอย่างพรีวิวในแผงตั้งค่า
    document.querySelectorAll('.clock-time').forEach(el => {
      el.textContent = hmString;
    });

    document.querySelectorAll('.clock-seconds').forEach(el => {
      if (settings.showSeconds) {
        el.textContent = secString;
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    });

    document.querySelectorAll('.clock-period').forEach(el => {
      if (settings.format12) {
        el.textContent = ` ${period}`;
        el.style.display = 'inline';
      } else {
        el.style.display = 'none';
      }
    });

    // แสดงวันที่
    const dateEls = document.querySelectorAll('.clock-date');
    if (dateEls.length > 0) {
      const formattedDate = settings.showDate ? this.formatDate(now, settings) : '';
      dateEls.forEach(el => {
        if (settings.showDate) {
          el.textContent = formattedDate;
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
    }
  }

  formatDate(date, settings) {
    const format = settings.dateFormat || 'long';
    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const thaiMonthsFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const dayName = thaiDays[date.getDay()];
    const dayNum = date.getDate();
    const monthFull = thaiMonthsFull[date.getMonth()];
    const monthShort = thaiMonthsShort[date.getMonth()];
    const yearBE = date.getFullYear() + 543;
    const yearAD = date.getFullYear();

    if (format === 'long') {
      return `${dayName}ที่ ${dayNum} ${monthFull} ${yearBE}`;
    } else if (format === 'short') {
      return `${dayNum} ${monthShort} ${yearBE.toString().slice(-2)}`;
    } else if (format === 'en') {
      const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${enDays[date.getDay()]}, ${dayNum} ${enMonths[date.getMonth()]} ${yearAD}`;
    }
    return `${dayNum} ${monthFull} ${yearBE}`;
  }
}

window.clockEngine = new ClockEngine();
