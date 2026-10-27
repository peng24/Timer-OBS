/**
 * app.js - Main Controller เชื่อมโยง UI, ระบบเสียง, การตั้งค่า และ OBS Overlay
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const clockCard = document.getElementById('clock-card');
  const clockTime = document.getElementById('clock-time');
  const clockPeriod = document.getElementById('clock-period');
  const clockDate = document.getElementById('clock-date');

  // Live Preview Elements
  const previewClockCard = document.getElementById('preview-clock-card');
  const previewClockTime = document.getElementById('preview-clock-time');
  const previewClockPeriod = document.getElementById('preview-clock-period');
  const previewClockDate = document.getElementById('preview-clock-date');
  const livePreviewStage = document.getElementById('live-preview-stage');
  const btnBgPreviews = document.querySelectorAll('.btn-bg-preview');

  // Quick Controls
  const btnQuickMute = document.getElementById('btn-quick-mute');
  const muteIcon = document.getElementById('mute-icon');
  const muteText = document.getElementById('mute-text');
  const btnQuickTest = document.getElementById('btn-quick-test');
  const btnCopyObs = document.getElementById('btn-copy-obs');
  const btnOpenSettings = document.getElementById('btn-open-settings');

  // Drawer
  const settingsDrawer = document.getElementById('settings-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // Rule Modal Elements
  const ruleModal = document.getElementById('rule-modal');
  const ruleModalBackdrop = document.getElementById('rule-modal-backdrop');
  const btnCloseRuleModal = document.getElementById('btn-close-rule-modal');
  const btnAddRule = document.getElementById('btn-add-rule');
  const rulesListContainer = document.getElementById('rules-list-container');
  const btnModalSave = document.getElementById('btn-modal-save');
  const btnModalTest = document.getElementById('btn-modal-test');

  // 1. ตรวจสอบโหมด OBS Overlay จาก URL Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isOverlayMode = urlParams.get('mode') === 'overlay' || urlParams.get('overlay') === '1';

  if (isOverlayMode) {
    document.body.classList.add('is-overlay');
  }

  // ปลดล็อก Web Audio API & TTS เมื่อผู้ใช้คลิกหน้าจอครั้งแรก
  const unlockAudio = () => {
    if (window.soundEngine) window.soundEngine.initContext();
    if (window.thaiTTS) window.thaiTTS.initVoices();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // 2. ระบบแจ้งเตือนแบบ Toast
  function showToast(message, duration = 3000) {
    if (isOverlayMode) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // 3. ปรับใช้สไตล์ภาพกับตัวนาฬิกา (Live Styler - ทั้งบนหน้าจอหลักและ Live Preview)
  function applyStyles() {
    const s = window.storageManager.settings.style;
    const c = window.storageManager.settings.clock;

    // Helper: HEX to RGBA
    const hexToRgba = (hex, alpha) => {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // โหลดฟอนต์ Google Font
    if (s.fontFamily) {
      window.fontManager.loadGoogleFont(s.fontFamily).then(() => {
        clockCard.style.fontFamily = `"${s.fontFamily}", system-ui, sans-serif`;
        if (previewClockCard) {
          previewClockCard.style.fontFamily = `"${s.fontFamily}", system-ui, sans-serif`;
        }
      });
    }

    // --- นาฬิกาหลักบนหน้าจอ (Main Display) ---
    clockTime.style.fontSize = `${s.fontSize}px`;
    clockTime.style.fontWeight = s.fontWeight;
    clockTime.style.letterSpacing = `${s.letterSpacing}px`;
    clockTime.style.color = s.textColor;

    if (s.textStroke) {
      clockTime.style.webkitTextStroke = `${s.strokeWidth}px ${s.strokeColor}`;
      clockTime.style.paintOrder = 'stroke fill';
    } else {
      clockTime.style.webkitTextStroke = 'none';
    }

    if (s.textShadow) {
      clockTime.style.textShadow = `0 4px ${s.shadowBlur}px ${s.shadowColor}`;
      clockDate.style.textShadow = `0 2px 6px ${s.shadowColor}`;
    } else {
      clockTime.style.textShadow = 'none';
      clockDate.style.textShadow = 'none';
    }

    clockDate.style.color = s.textColor;
    clockDate.style.fontSize = `${Math.max(14, Math.round(s.fontSize * 0.32))}px`;
    if (s.textStroke) {
      clockDate.style.webkitTextStroke = `${Math.max(0.5, s.strokeWidth * 0.4)}px ${s.strokeColor}`;
    } else {
      clockDate.style.webkitTextStroke = 'none';
    }

    if (s.bgTransparent) {
      clockCard.style.background = 'transparent';
      clockCard.style.border = 'none';
      clockCard.style.boxShadow = 'none';
    } else {
      clockCard.style.backgroundColor = hexToRgba(s.bgColor, s.bgOpacity);
      clockCard.style.borderRadius = `${s.borderRadius}px`;
      clockCard.style.padding = `${s.paddingY}px ${s.paddingX}px`;
      clockCard.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
      clockCard.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
    }

    // --- กล่องพรีวิวสดในแถบตั้งค่า (Live Preview Card) ---
    if (previewClockCard && previewClockTime && previewClockDate) {
      const pScale = 0.52;
      const previewFontSize = Math.min(38, Math.max(20, Math.round(s.fontSize * pScale)));
      
      previewClockTime.style.fontSize = `${previewFontSize}px`;
      previewClockTime.style.fontWeight = s.fontWeight;
      previewClockTime.style.letterSpacing = `${Math.round(s.letterSpacing * pScale)}px`;
      previewClockTime.style.color = s.textColor;

      if (s.textStroke) {
        previewClockTime.style.webkitTextStroke = `${Math.max(0.6, s.strokeWidth * pScale)}px ${s.strokeColor}`;
        previewClockTime.style.paintOrder = 'stroke fill';
      } else {
        previewClockTime.style.webkitTextStroke = 'none';
      }

      if (s.textShadow) {
        previewClockTime.style.textShadow = `0 2px ${Math.round(s.shadowBlur * pScale)}px ${s.shadowColor}`;
        previewClockDate.style.textShadow = `0 1px 4px ${s.shadowColor}`;
      } else {
        previewClockTime.style.textShadow = 'none';
        previewClockDate.style.textShadow = 'none';
      }

      previewClockDate.style.color = s.textColor;
      previewClockDate.style.fontSize = `${Math.max(11, Math.round(previewFontSize * 0.35))}px`;
      if (s.textStroke) {
        previewClockDate.style.webkitTextStroke = `${Math.max(0.4, s.strokeWidth * 0.25)}px ${s.strokeColor}`;
      } else {
        previewClockDate.style.webkitTextStroke = 'none';
      }

      if (s.bgTransparent) {
        previewClockCard.style.background = 'transparent';
        previewClockCard.style.border = 'none';
        previewClockCard.style.boxShadow = 'none';
      } else {
        previewClockCard.style.backgroundColor = hexToRgba(s.bgColor, s.bgOpacity);
        previewClockCard.style.borderRadius = `${Math.round(s.borderRadius * pScale)}px`;
        previewClockCard.style.padding = `${Math.round(s.paddingY * pScale)}px ${Math.round(s.paddingX * pScale)}px`;
        previewClockCard.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
        previewClockCard.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
      }
    }

    // อัปเดตลิงก์ OBS Input (พร้อมแนบค่าตั้งค่าทั้งหมดลงใน URL)
    updateObsUrlField();
  }

  function updateObsUrlField() {
    const obsUrlInput = document.getElementById('obs-url-input');
    if (obsUrlInput && window.storageManager) {
      obsUrlInput.value = window.storageManager.getObsOverlayUrl();
    }
  }

  // 4. ซิงค์ค่าการตั้งค่าไปยังฟอร์มในหน้า Drawer
  function syncSettingsToUI() {
    const s = window.storageManager.settings;

    // Clock
    document.getElementById('setting-format12').checked = !!s.clock.format12;
    document.getElementById('setting-show-seconds').checked = !!s.clock.showSeconds;
    document.getElementById('setting-show-date').checked = !!s.clock.showDate;
    document.getElementById('setting-date-format').value = s.clock.dateFormat || 'long';

    // Style
    window.fontManager.populateFontSelect(document.getElementById('setting-font-family'), s.style.fontFamily);
    document.getElementById('setting-font-size').value = s.style.fontSize;
    document.getElementById('val-font-size').textContent = `${s.style.fontSize}px`;
    document.getElementById('setting-font-weight').value = s.style.fontWeight;

    document.getElementById('setting-text-color').value = s.style.textColor;
    document.getElementById('setting-text-color-hex').value = s.style.textColor;

    document.getElementById('setting-text-stroke').checked = !!s.style.textStroke;
    document.getElementById('group-stroke-options').style.display = s.style.textStroke ? 'block' : 'none';
    document.getElementById('setting-stroke-color').value = s.style.strokeColor;
    document.getElementById('setting-stroke-color-hex').value = s.style.strokeColor;
    document.getElementById('setting-stroke-width').value = s.style.strokeWidth;
    document.getElementById('val-stroke-width').textContent = `${s.style.strokeWidth}px`;

    document.getElementById('setting-text-shadow').checked = !!s.style.textShadow;
    const pulseCheckbox = document.getElementById('setting-speaking-pulse');
    if (pulseCheckbox) pulseCheckbox.checked = s.style.speakingPulse !== false;

    document.getElementById('setting-bg-transparent').checked = !!s.style.bgTransparent;
    document.getElementById('group-bg-options').style.display = s.style.bgTransparent ? 'none' : 'block';
    document.getElementById('setting-bg-color').value = s.style.bgColor;
    document.getElementById('setting-bg-color-hex').value = s.style.bgColor;
    document.getElementById('setting-bg-opacity').value = s.style.bgOpacity;
    document.getElementById('val-bg-opacity').textContent = `${Math.round(s.style.bgOpacity * 100)}%`;
    document.getElementById('setting-border-radius').value = s.style.borderRadius;
    document.getElementById('val-border-radius').textContent = `${s.style.borderRadius}px`;
    document.getElementById('setting-padding-x').value = s.style.paddingX;
    document.getElementById('val-padding-x').textContent = `${s.style.paddingX}px`;

    // Audio
    const isMuted = !!s.audio.masterMute;
    document.getElementById('setting-master-mute').checked = isMuted;
    updateMuteUI(isMuted);

    const ttsEngine = s.audio.ttsEngine || 'google';
    const ttsEngineSelect = document.getElementById('setting-tts-engine');
    if (ttsEngineSelect) ttsEngineSelect.value = ttsEngine;
    updateTtsEngineUI(ttsEngine);

    document.getElementById('setting-alarm-volume').value = s.audio.alarmVolume ?? 0.8;
    document.getElementById('val-alarm-volume').textContent = `${Math.round((s.audio.alarmVolume ?? 0.8) * 100)}%`;

    document.getElementById('setting-tts-volume').value = s.audio.ttsVolume ?? 1.0;
    document.getElementById('val-tts-volume').textContent = `${Math.round((s.audio.ttsVolume ?? 1.0) * 100)}%`;

    document.getElementById('setting-tts-rate').value = s.audio.ttsRate ?? 1.0;
    document.getElementById('val-tts-rate').textContent = `${s.audio.ttsRate ?? 1.0}x`;

    document.getElementById('setting-tts-pitch').value = s.audio.ttsPitch ?? 1.0;
    document.getElementById('val-tts-pitch').textContent = `${s.audio.ttsPitch ?? 1.0}`;

    // Populate TTS Voices
    populateVoiceSelect();

    // Render Rules List
    renderRulesList();
  }

  function updateMuteUI(isMuted) {
    if (isMuted) {
      muteIcon.textContent = '🔇';
      muteText.textContent = 'ปิดเสียงทั้งหมดอยู่';
      btnQuickMute.classList.add('is-muted');
    } else {
      muteIcon.textContent = '🔊';
      muteText.textContent = 'เปิดเสียงอยู่';
      btnQuickMute.classList.remove('is-muted');
    }
  }

  function updateTtsEngineUI(engine) {
    const isGoogle = engine === 'google';
    const googleBadge = document.getElementById('google-tts-badge');
    const groupBrowserVoice = document.getElementById('group-browser-voice');
    if (googleBadge) googleBadge.style.display = isGoogle ? 'flex' : 'none';
    if (groupBrowserVoice) groupBrowserVoice.style.display = isGoogle ? 'none' : 'flex';
  }

  function toggleMasterMute() {
    const current = !!window.storageManager.settings.audio.masterMute;
    const next = !current;
    window.storageManager.settings.audio.masterMute = next;
    window.storageManager.save();
    document.getElementById('setting-master-mute').checked = next;
    updateMuteUI(next);
    showToast(next ? '🔇 ปิดเสียงทั้งหมดแล้ว (Muted)' : '🔊 เปิดเสียงแล้ว (Unmuted)');
  }

  function populateVoiceSelect() {
    const voiceSelect = document.getElementById('setting-tts-voice');
    if (!voiceSelect || !window.speechSynthesis) return;

    const voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '<option value="">— เสียงมาตรฐานของระบบ (Auto Thai) —</option>';

    voices.forEach((v) => {
      const isThai = v.lang.startsWith('th') || v.lang.includes('TH') || v.name.includes('Thai');
      const opt = document.createElement('option');
      opt.value = v.voiceURI || v.name;
      opt.textContent = `${isThai ? '★ [ไทย] ' : ''}${v.name} (${v.lang})`;
      if (window.storageManager.settings.audio.ttsVoice === opt.value) {
        opt.selected = true;
      }
      voiceSelect.appendChild(opt);
    });
  }

  // 5. Render Rules List ใน Tab 3
  function renderRulesList() {
    const rules = window.storageManager.settings.rules || [];
    rulesListContainer.innerHTML = '';

    if (rules.length === 0) {
      rulesListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          ยังไม่มีกฎการเตือนเวลา กดปุ่ม <strong>"+ เพิ่มกฎใหม่"</strong> เพื่อเริ่มต้น
        </div>
      `;
      return;
    }

    rules.forEach((rule) => {
      const item = document.createElement('div');
      item.className = 'rule-item';

      let timeBadge = '';
      if (rule.type === 'interval') {
        timeBadge = `ทุก ${rule.intervalMinutes} นาที`;
      } else {
        timeBadge = `เวลา ${rule.time} น.`;
      }

      let modeBadge = '';
      if (rule.mode === 'alarm') modeBadge = '🔔 เสียงปลุก';
      else if (rule.mode === 'tts') modeBadge = '🗣️ อ่านเวลา';
      else modeBadge = '🔔+🗣️ ปลุกแล้วอ่าน';

      item.innerHTML = `
        <div class="rule-header">
          <div>
            <div class="rule-name">${escapeHtml(rule.name)}</div>
            <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">
              ⏱️ ${timeBadge} &bull; ${modeBadge} &bull; ${getSoundLabel(rule.soundEffect)}
            </div>
          </div>
          <div class="rule-actions">
            <label class="switch" title="เปิด/ปิดการทำงาน">
              <input type="checkbox" class="rule-enable-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <button class="btn-icon rule-test-btn" data-id="${rule.id}" title="ทดสอบกฎนี้">▶</button>
            <button class="btn-icon rule-edit-btn" data-id="${rule.id}" title="แก้ไขกฎนี้">✏️</button>
            <button class="btn-icon delete rule-delete-btn" data-id="${rule.id}" title="ลบกฎนี้">🗑️</button>
          </div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px;">
          💬 "${escapeHtml(rule.messageTemplate || '')}"
        </div>
      `;

      rulesListContainer.appendChild(item);
    });

    // ผูก Event ให้ปุ่มของแต่ละ Rule
    rulesListContainer.querySelectorAll('.rule-enable-toggle').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const targetRule = window.storageManager.settings.rules.find(r => r.id === id);
        if (targetRule) {
          targetRule.enabled = e.target.checked;
          window.storageManager.save();
          updateObsUrlField();
          showToast(`${targetRule.enabled ? 'เปิด' : 'ปิด'}การทำงาน: "${targetRule.name}"`);
        }
      });
    });

    rulesListContainer.querySelectorAll('.rule-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const targetRule = window.storageManager.settings.rules.find(r => r.id === id);
        if (targetRule) {
          showToast(`กำลังทดสอบ: ${targetRule.name}`);
          window.thaiTTS.triggerRule(targetRule, new Date());
        }
      });
    });

    rulesListContainer.querySelectorAll('.rule-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openRuleModal(id);
      });
    });

    rulesListContainer.querySelectorAll('.rule-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const targetRule = window.storageManager.settings.rules.find(r => r.id === id);
        if (confirm(`คุณต้องการลบกฎ "${targetRule?.name}" หรือไม่?`)) {
          window.storageManager.settings.rules = window.storageManager.settings.rules.filter(r => r.id !== id);
          window.storageManager.save();
          updateObsUrlField();
          renderRulesList();
          showToast('ลบกฎเรียบร้อยแล้ว');
        }
      });
    });
  }

  function getSoundLabel(sound) {
    switch (sound) {
      case 'bell': return '🕰️ Clock Bell';
      case 'chime': return '🔔 Chime';
      case 'digital': return '⏰ Digital Alarm';
      case 'dingdong': return '🎵 Ding-Dong';
      case 'marimba': return '🎶 Marimba';
      case 'custom': return '📁 Custom File';
      default: return '🔔 Chime';
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // สร้างตัวเลือกเวลาแบบ 24 ชั่วโมง (00:00 - 23:59)
  function initTimeDropdowns() {
    const hourSelect = document.getElementById('modal-rule-hour');
    const minuteSelect = document.getElementById('modal-rule-minute');
    if (!hourSelect || !minuteSelect) return;

    hourSelect.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const val = h.toString().padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = `${val} นาฬิกา (${val}:00)`;
      hourSelect.appendChild(opt);
    }

    minuteSelect.innerHTML = '';
    for (let m = 0; m < 60; m++) {
      const val = m.toString().padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = `${val} นาที`;
      minuteSelect.appendChild(opt);
    }
  }

  const STANDARD_INTERVALS = ['5', '10', '15', '20', '30', '45', '60', '90', '120'];

  // 6. จัดการ Modal เพิ่ม / แก้ไขกฎ
  function openRuleModal(ruleId = null) {
    const isEdit = !!ruleId;
    document.getElementById('rule-modal-title').textContent = isEdit ? '✏️ แก้ไขกฎการเตือนเวลา' : '⏰ เพิ่มกฎการเตือนเวลาใหม่';
    document.getElementById('modal-rule-id').value = ruleId || '';

    const intervalSelect = document.getElementById('modal-rule-interval');
    const customIntervalInput = document.getElementById('modal-rule-custom-interval');

    if (isEdit) {
      const rule = window.storageManager.settings.rules.find(r => r.id === ruleId);
      if (!rule) return;
      document.getElementById('modal-rule-name').value = rule.name || '';
      document.getElementById('modal-rule-type').value = rule.type || 'interval';
      
      const intervalStr = String(rule.intervalMinutes || 60);
      if (STANDARD_INTERVALS.includes(intervalStr)) {
        intervalSelect.value = intervalStr;
      } else {
        intervalSelect.value = 'custom';
        if (customIntervalInput) customIntervalInput.value = intervalStr;
      }
      
      const timeParts = (rule.time || '12:00').split(':');
      const hourVal = (timeParts[0] || '12').padStart(2, '0');
      const minVal = (timeParts[1] || '00').padStart(2, '0');
      if (document.getElementById('modal-rule-hour')) document.getElementById('modal-rule-hour').value = hourVal;
      if (document.getElementById('modal-rule-minute')) document.getElementById('modal-rule-minute').value = minVal;

      document.getElementById('modal-rule-mode').value = rule.mode || 'both';
      document.getElementById('modal-rule-sound').value = rule.soundEffect || 'chime';
      document.getElementById('modal-rule-custom-url').value = rule.customAudioUrl || '';
      document.getElementById('modal-rule-message').value = rule.messageTemplate || '';
    } else {
      document.getElementById('modal-rule-name').value = 'เตือนเวลาใหม่';
      document.getElementById('modal-rule-type').value = 'interval';
      intervalSelect.value = '60';
      if (customIntervalInput) customIntervalInput.value = '25';
      
      if (document.getElementById('modal-rule-hour')) document.getElementById('modal-rule-hour').value = '12';
      if (document.getElementById('modal-rule-minute')) document.getElementById('modal-rule-minute').value = '00';

      document.getElementById('modal-rule-mode').value = 'both';
      document.getElementById('modal-rule-sound').value = 'chime';
      document.getElementById('modal-rule-custom-url').value = '';
      document.getElementById('modal-rule-message').value = 'ขณะนี้เวลา {time} ค่ะ';
    }

    updateRuleModalFields();
    ruleModal.classList.add('open');
    ruleModalBackdrop.classList.add('active');
  }

  function closeRuleModal() {
    ruleModal.classList.remove('open');
    ruleModalBackdrop.classList.remove('active');
  }

  function updateRuleModalFields() {
    const type = document.getElementById('modal-rule-type').value;
    const intervalVal = document.getElementById('modal-rule-interval').value;
    const mode = document.getElementById('modal-rule-mode').value;
    const sound = document.getElementById('modal-rule-sound').value;

    document.getElementById('modal-group-interval').style.display = type === 'interval' ? 'block' : 'none';
    const customIntervalGroup = document.getElementById('modal-group-custom-interval');
    if (customIntervalGroup) {
      customIntervalGroup.style.display = (type === 'interval' && intervalVal === 'custom') ? 'block' : 'none';
    }
    document.getElementById('modal-group-specific').style.display = type === 'specific' ? 'block' : 'none';

    document.getElementById('modal-group-sound').style.display = mode !== 'tts' ? 'block' : 'none';
    document.getElementById('modal-group-custom-sound').style.display = (mode !== 'tts' && sound === 'custom') ? 'block' : 'none';
    document.getElementById('modal-group-message').style.display = mode !== 'alarm' ? 'block' : 'none';
  }

  document.getElementById('modal-rule-type').addEventListener('change', updateRuleModalFields);
  document.getElementById('modal-rule-interval').addEventListener('change', updateRuleModalFields);
  document.getElementById('modal-rule-mode').addEventListener('change', updateRuleModalFields);
  document.getElementById('modal-rule-sound').addEventListener('change', updateRuleModalFields);

  btnModalSave.addEventListener('click', () => {
    const id = document.getElementById('modal-rule-id').value;
    const name = document.getElementById('modal-rule-name').value.trim() || 'การเตือนเวลา';
    const type = document.getElementById('modal-rule-type').value;
    
    const intervalSelectVal = document.getElementById('modal-rule-interval').value;
    let intervalMinutes = 60;
    if (intervalSelectVal === 'custom') {
      intervalMinutes = Math.max(1, parseInt(document.getElementById('modal-rule-custom-interval')?.value, 10) || 25);
    } else {
      intervalMinutes = parseInt(intervalSelectVal, 10) || 60;
    }
    
    // เวลาแบบ 24 ชั่วโมง (HH:MM)
    const hour = (document.getElementById('modal-rule-hour')?.value || '12').padStart(2, '0');
    const minute = (document.getElementById('modal-rule-minute')?.value || '00').padStart(2, '0');
    const time = `${hour}:${minute}`;

    const mode = document.getElementById('modal-rule-mode').value;
    const soundEffect = document.getElementById('modal-rule-sound').value;
    const customAudioUrl = document.getElementById('modal-rule-custom-url').value.trim();
    const messageTemplate = document.getElementById('modal-rule-message').value.trim();

    if (id) {
      // อัปเดตอันเดิม
      const target = window.storageManager.settings.rules.find(r => r.id === id);
      if (target) {
        Object.assign(target, { name, type, intervalMinutes, time, mode, soundEffect, customAudioUrl, messageTemplate });
      }
    } else {
      // เพิ่มอันใหม่
      const newRule = {
        id: 'rule_' + Date.now(),
        name,
        enabled: true,
        type,
        intervalMinutes,
        time,
        mode,
        soundEffect,
        customAudioUrl,
        messageTemplate
      };
      window.storageManager.settings.rules.push(newRule);
    }

    window.storageManager.save();
    updateObsUrlField();
    renderRulesList();
    closeRuleModal();
    showToast('บันทึกกฎเรียบร้อยแล้ว');
  });

  btnModalTest.addEventListener('click', () => {
    const mode = document.getElementById('modal-rule-mode').value;
    const soundEffect = document.getElementById('modal-rule-sound').value;
    const customAudioUrl = document.getElementById('modal-rule-custom-url').value.trim();
    const messageTemplate = document.getElementById('modal-rule-message').value.trim() || 'ขณะนี้เวลา {time}';

    const tempRule = {
      enabled: true,
      mode,
      soundEffect,
      customAudioUrl,
      messageTemplate
    };
    window.thaiTTS.triggerRule(tempRule, new Date());
  });

  btnAddRule.addEventListener('click', () => openRuleModal());
  btnCloseRuleModal.addEventListener('click', closeRuleModal);
  ruleModalBackdrop.addEventListener('click', closeRuleModal);

  // 7. Event Listeners สำหรับการตั้งค่าต่าง ๆ (Live Reactive Controls)

  // 1-Click Theme Presets
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const preset = window.THEME_PRESETS?.[presetKey];
      if (!preset) return;

      Object.assign(window.storageManager.settings.style, preset.style);
      window.storageManager.save();
      syncSettingsToUI();
      applyStyles();
      showToast(`🎨 เปลี่ยนธีมเป็น "${preset.name}" เรียบร้อย!`);
    });
  });

  // Clock Toggles
  document.getElementById('setting-format12').addEventListener('change', (e) => {
    window.storageManager.settings.clock.format12 = e.target.checked;
    window.storageManager.save();
    updateObsUrlField();
  });
  document.getElementById('setting-show-seconds').addEventListener('change', (e) => {
    window.storageManager.settings.clock.showSeconds = e.target.checked;
    window.storageManager.save();
    updateObsUrlField();
  });
  document.getElementById('setting-show-date').addEventListener('change', (e) => {
    window.storageManager.settings.clock.showDate = e.target.checked;
    window.storageManager.save();
    updateObsUrlField();
  });
  document.getElementById('setting-date-format').addEventListener('change', (e) => {
    window.storageManager.settings.clock.dateFormat = e.target.value;
    window.storageManager.save();
    updateObsUrlField();
  });

  // Fonts
  const fontSelect = document.getElementById('setting-font-family');
  const customFontInput = document.getElementById('setting-custom-font');
  const customFontGroup = document.getElementById('group-custom-font');

  fontSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customFontGroup.style.display = 'block';
      customFontInput.focus();
    } else {
      customFontGroup.style.display = 'none';
      window.storageManager.settings.style.fontFamily = e.target.value;
      window.storageManager.save();
      applyStyles();
    }
  });

  customFontInput.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (val) {
      window.storageManager.settings.style.fontFamily = val;
      window.storageManager.save();
      applyStyles();
      window.fontManager.populateFontSelect(fontSelect, val);
    }
  });

  // Font Size
  const fontSizeSlider = document.getElementById('setting-font-size');
  fontSizeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('val-font-size').textContent = `${val}px`;
    window.storageManager.settings.style.fontSize = val;
    window.storageManager.save();
    applyStyles();
  });

  // Font Weight
  document.getElementById('setting-font-weight').addEventListener('change', (e) => {
    window.storageManager.settings.style.fontWeight = e.target.value;
    window.storageManager.save();
    applyStyles();
  });

  // Text Color
  const textColorInput = document.getElementById('setting-text-color');
  const textColorHex = document.getElementById('setting-text-color-hex');
  textColorInput.addEventListener('input', (e) => {
    textColorHex.value = e.target.value;
    window.storageManager.settings.style.textColor = e.target.value;
    window.storageManager.save();
    applyStyles();
  });
  textColorHex.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      textColorInput.value = e.target.value;
      window.storageManager.settings.style.textColor = e.target.value;
      window.storageManager.save();
      applyStyles();
    }
  });

  // Text Stroke
  document.getElementById('setting-text-stroke').addEventListener('change', (e) => {
    window.storageManager.settings.style.textStroke = e.target.checked;
    document.getElementById('group-stroke-options').style.display = e.target.checked ? 'block' : 'none';
    window.storageManager.save();
    applyStyles();
  });

  const strokeColorInput = document.getElementById('setting-stroke-color');
  const strokeColorHex = document.getElementById('setting-stroke-color-hex');
  strokeColorInput.addEventListener('input', (e) => {
    strokeColorHex.value = e.target.value;
    window.storageManager.settings.style.strokeColor = e.target.value;
    window.storageManager.save();
    applyStyles();
  });
  strokeColorHex.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      strokeColorInput.value = e.target.value;
      window.storageManager.settings.style.strokeColor = e.target.value;
      window.storageManager.save();
      applyStyles();
    }
  });

  document.getElementById('setting-stroke-width').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-stroke-width').textContent = `${val}px`;
    window.storageManager.settings.style.strokeWidth = val;
    window.storageManager.save();
    applyStyles();
  });

  // Text Shadow & Speaking Pulse
  document.getElementById('setting-text-shadow').addEventListener('change', (e) => {
    window.storageManager.settings.style.textShadow = e.target.checked;
    window.storageManager.save();
    applyStyles();
  });

  const pulseCheckboxEl = document.getElementById('setting-speaking-pulse');
  if (pulseCheckboxEl) {
    pulseCheckboxEl.addEventListener('change', (e) => {
      window.storageManager.settings.style.speakingPulse = e.target.checked;
      window.storageManager.save();
      updateObsUrlField();
    });
  }

  // Background
  document.getElementById('setting-bg-transparent').addEventListener('change', (e) => {
    window.storageManager.settings.style.bgTransparent = e.target.checked;
    document.getElementById('group-bg-options').style.display = e.target.checked ? 'none' : 'block';
    window.storageManager.save();
    applyStyles();
  });

  const bgColorInput = document.getElementById('setting-bg-color');
  const bgColorHex = document.getElementById('setting-bg-color-hex');
  bgColorInput.addEventListener('input', (e) => {
    bgColorHex.value = e.target.value;
    window.storageManager.settings.style.bgColor = e.target.value;
    window.storageManager.save();
    applyStyles();
  });
  bgColorHex.addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      bgColorInput.value = e.target.value;
      window.storageManager.settings.style.bgColor = e.target.value;
      window.storageManager.save();
      applyStyles();
    }
  });

  document.getElementById('setting-bg-opacity').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-bg-opacity').textContent = `${Math.round(val * 100)}%`;
    window.storageManager.settings.style.bgOpacity = val;
    window.storageManager.save();
    applyStyles();
  });

  document.getElementById('setting-border-radius').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('val-border-radius').textContent = `${val}px`;
    window.storageManager.settings.style.borderRadius = val;
    window.storageManager.save();
    applyStyles();
  });

  document.getElementById('setting-padding-x').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('val-padding-x').textContent = `${val}px`;
    window.storageManager.settings.style.paddingX = val;
    window.storageManager.save();
    applyStyles();
  });

  // Master Mute
  document.getElementById('setting-master-mute').addEventListener('change', (e) => {
    window.storageManager.settings.audio.masterMute = e.target.checked;
    window.storageManager.save();
    updateObsUrlField();
    updateMuteUI(e.target.checked);
    showToast(e.target.checked ? '🔇 ปิดเสียงทั้งหมดแล้ว' : '🔊 เปิดเสียงแล้ว');
  });

  // Alarm Volume
  document.getElementById('setting-alarm-volume').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-alarm-volume').textContent = `${Math.round(val * 100)}%`;
    window.storageManager.settings.audio.alarmVolume = val;
    window.storageManager.save();
    updateObsUrlField();
  });

  // Quick sound preview button
  document.getElementById('btn-play-preview-sound').addEventListener('click', () => {
    const sound = document.getElementById('quick-sound-preview').value;
    window.soundEngine.play(sound);
  });

  // TTS Controls
  const ttsEngineSelect = document.getElementById('setting-tts-engine');
  if (ttsEngineSelect) {
    ttsEngineSelect.addEventListener('change', (e) => {
      window.storageManager.settings.audio.ttsEngine = e.target.value;
      window.storageManager.save();
      updateObsUrlField();
      updateTtsEngineUI(e.target.value);
      showToast(e.target.value === 'google' 
        ? '🌐 สลับใช้เสียง Google TTS (เป็นธรรมชาติที่สุด)' 
        : '💻 สลับใช้เสียง Browser Web Speech');
    });
  }

  document.getElementById('setting-tts-volume').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-tts-volume').textContent = `${Math.round(val * 100)}%`;
    window.storageManager.settings.audio.ttsVolume = val;
    window.storageManager.save();
    updateObsUrlField();
  });

  document.getElementById('setting-tts-rate').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-tts-rate').textContent = `${val}x`;
    window.storageManager.settings.audio.ttsRate = val;
    window.storageManager.save();
    updateObsUrlField();
  });

  document.getElementById('setting-tts-pitch').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-tts-pitch').textContent = `${val}`;
    window.storageManager.settings.audio.ttsPitch = val;
    window.storageManager.save();
    updateObsUrlField();
  });

  document.getElementById('setting-tts-voice').addEventListener('change', (e) => {
    window.storageManager.settings.audio.ttsVoice = e.target.value;
    window.storageManager.save();
    updateObsUrlField();
  });

  document.getElementById('btn-test-tts-speech').addEventListener('click', () => {
    const now = new Date();
    const message = `ขณะนี้เวลา ${window.thaiTTS.timeToThaiWords(now)} ค่ะ`;
    showToast(`กำลังอ่าน: "${message}"`);
    window.thaiTTS.speakText(message);
  });

  // 8. System Tab: Copy, Export, Import, Reset
  const copyObsUrl = () => {
    const overlayUrl = window.storageManager.getObsOverlayUrl();
    updateObsUrlField();
    navigator.clipboard.writeText(overlayUrl).then(() => {
      showToast('📋 คัดลอกลิงก์ OBS (พร้อมค่าตั้งค่าและกฎทั้งหมด) แล้ว!');
    }).catch(() => {
      prompt('คัดลอกลิงก์นี้ไปวางใน Browser Source ของ OBS:', overlayUrl);
    });
  };

  btnCopyObs.addEventListener('click', copyObsUrl);
  document.getElementById('btn-copy-obs-tab').addEventListener('click', copyObsUrl);

  document.getElementById('btn-export-settings').addEventListener('click', () => {
    const jsonStr = window.storageManager.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timerOBS-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์การตั้งค่า JSON สำเร็จ');
  });

  const fileInput = document.getElementById('file-import-input');
  document.getElementById('btn-import-trigger').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = window.storageManager.importJSON(event.target.result);
      if (ok) {
        syncSettingsToUI();
        applyStyles();
        showToast('นำเข้าการตั้งค่าสำเร็จแล้ว!');
      } else {
        alert('ไฟล์ JSON ไม่ถูกต้องหรือไม่สามารถอ่านได้');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตการตั้งค่าและกฎทั้งหมดกลับเป็นค่าเริ่มต้น?')) {
      window.storageManager.reset();
      syncSettingsToUI();
      applyStyles();
      showToast('รีเซ็ตการตั้งค่ากลับเป็นค่าเริ่มต้นแล้ว');
    }
  });

  // 9. Quick Actions & Hotkeys
  btnQuickMute.addEventListener('click', toggleMasterMute);

  btnQuickTest.addEventListener('click', () => {
    const now = new Date();
    showToast('🔔 กำลังเล่นเสียงทดสอบ...');
    window.thaiTTS.triggerRule({
      enabled: true,
      mode: 'both',
      soundEffect: 'chime',
      messageTemplate: 'ขณะนี้เวลา {time} ค่ะ'
    }, now);
  });

  // Live Preview Background Switcher
  btnBgPreviews.forEach(btn => {
    btn.addEventListener('click', () => {
      btnBgPreviews.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const bg = btn.dataset.bg;
      if (livePreviewStage) {
        livePreviewStage.className = `live-preview-stage preview-bg-${bg}`;
      }
    });
  });

  btnOpenSettings.addEventListener('click', () => {
    document.body.classList.add('has-settings-open');
    settingsDrawer.classList.add('open');
    drawerBackdrop.classList.add('active');
  });

  const closeSettings = () => {
    document.body.classList.remove('has-settings-open');
    settingsDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
  };
  btnCloseSettings.addEventListener('click', closeSettings);
  drawerBackdrop.addEventListener('click', closeSettings);

  // Tabs Switcher
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Keyboard Shortcuts (Hotkeys)
  window.addEventListener('keydown', (e) => {
    // ปิดเสียงเมื่อกด 'M' หรือ 'm' (ยกเว้นกำลังพิมพ์อยู่ใน input/textarea)
    if ((e.key === 'm' || e.key === 'M') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      e.preventDefault();
      toggleMasterMute();
    }
    // ปิด Drawer เมื่อกด 'Escape'
    if (e.key === 'Escape') {
      closeRuleModal();
      closeSettings();
    }
  });

  // 10. Start Clock & Initial Render
  initTimeDropdowns();
  syncSettingsToUI();
  applyStyles();
  window.clockEngine.init(clockTime, clockPeriod, clockDate, clockCard);
});
