/**
 * fonts.js - ระบบโหลดและจัดการ Google Fonts ภาษาไทยแบบ Dynamic
 */

const POPULAR_THAI_FONTS = [
  { name: 'Kanit', category: 'สตรีมเมอร์ / โมเดิร์นยอดนิยม' },
  { name: 'Prompt', category: 'เรียบหรู / สบายตา' },
  { name: 'Chakra Petch', category: 'เกมมิ่ง / อวกาศ / ล้ำยุค' },
  { name: 'Sarabun', category: 'ทางการ / อ่านง่ายชัดเจน' },
  { name: 'Mitr', category: 'ร่วมสมัย / มินิมอล' },
  { name: 'Itim', category: 'ลายมือสดใส / น่ารัก' },
  { name: 'Mali', category: 'ฟอนต์การ์ตูน / ขี้เล่น' },
  { name: 'Kodchasan', category: 'วัยรุ่น / กวนๆ มีสไตล์' },
  { name: 'Bai Jamjuree', category: 'กึ่งเรขาคณิต / เท่' },
  { name: 'Chonburi', category: 'หัวโต / พาดหัวสะดุดตา' },
  { name: 'Pattaya', category: 'ย้อนยุค / ป้ายโบราณ' },
  { name: 'Sriracha', category: 'หวัดเป็นธรรมชาติ / เป็นกันเอง' },
  { name: 'Pridi', category: 'มีหัวคลาสสิก / วรรณกรรม' },
  { name: 'Taviraj', category: 'หรูหรา / สง่างาม' },
  { name: 'Charm', category: 'ตัวเขียนอ่อนช้อย / วินเทจ' },
  { name: 'Fahkwang', category: 'แมกกาซีน / แฟชั่น' },
  { name: 'Krub', category: 'นีโอกรอเทสก์ / นานาชาติ' },
  { name: 'Niramit', category: 'ร่วมสมัย / มั่นคง' }
];

class FontManager {
  constructor() {
    this.loadedFonts = new Set();
  }

  /**
   * โหลด Google Font แบบ Dynamic เข้ามาใน DOM
   */
  loadGoogleFont(fontName) {
    if (!fontName) return Promise.resolve();
    const cleanName = fontName.trim();
    if (this.loadedFonts.has(cleanName)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const linkId = `google-font-${cleanName.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(linkId)) {
        this.loadedFonts.add(cleanName);
        return resolve();
      }

      const formattedName = cleanName.replace(/\s+/g, '+');
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700&display=swap`;

      link.onload = () => {
        this.loadedFonts.add(cleanName);
        resolve();
      };
      link.onerror = () => {
        console.warn(`Failed to load Google Font: ${cleanName}`);
        resolve(); // Resolve anyway so it won't block UI
      };

      document.head.appendChild(link);
    });
  }

  /**
   * สร้าง Options สำหรับ Dropdown เลือกฟอนต์
   */
  populateFontSelect(selectElement, currentFont) {
    if (!selectElement) return;
    selectElement.innerHTML = '';

    // เพิ่มตัวเลือก Custom Input
    const customGroup = document.createElement('optgroup');
    customGroup.label = '— กำหนดเอง —';
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = '✏️ พิมพ์ชื่อ Google Font เอง...';
    customGroup.appendChild(customOpt);
    selectElement.appendChild(customGroup);

    // เพิ่มกลุ่มฟอนต์ไทยยอดนิยม
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = '— ฟอนต์ไทยยอดนิยม (Google Fonts) —';

    POPULAR_THAI_FONTS.forEach(font => {
      const opt = document.createElement('option');
      opt.value = font.name;
      opt.textContent = `${font.name} (${font.category})`;
      if (font.name === currentFont) {
        opt.selected = true;
      }
      popularGroup.appendChild(opt);
    });

    selectElement.appendChild(popularGroup);

    // ถ้าฟอนต์ปัจจุบันไม่ได้อยู่ในลิสต์ ให้ใส่เพิ่มเข้าไป
    const isStandard = POPULAR_THAI_FONTS.some(f => f.name === currentFont);
    if (!isStandard && currentFont && currentFont !== 'custom') {
      const customSelectedOpt = document.createElement('option');
      customSelectedOpt.value = currentFont;
      customSelectedOpt.textContent = `★ ${currentFont} (ที่เลือกไว้)`;
      customSelectedOpt.selected = true;
      popularGroup.insertBefore(customSelectedOpt, popularGroup.firstChild);
    }
  }
}

window.fontManager = new FontManager();
