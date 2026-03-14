// ================== Nurse Dashboard — Main Application ==================
// Modular ES build. Firebase is imported from ./firebase.js.

import './styles/main.css';
import { database } from './firebase.js';

// Make database globally accessible for inline HTML event handlers
window.database = database;

// ── PWA Install Prompt ────────────────────────────────────────────────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  const existing = document.getElementById('pwaInstallBanner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:#134e4a; color:white; border-radius:16px;
    padding:12px 20px; display:flex; align-items:center; gap:12px;
    box-shadow:0 8px 32px rgba(0,0,0,.25); z-index:9998;
    font-family:'Tajawal',sans-serif; font-size:.88rem; font-weight:700;
    animation: slideUp .4s cubic-bezier(.34,1.56,.64,1);
    max-width:90vw;
  `;
  banner.innerHTML = `
    <i class="fas fa-download" style="font-size:1.1rem;color:#2dd4bf;"></i>
    <span>ثبّت التطبيق على جهازك</span>
    <button id="pwaInstallBtn" style="background:#0d9488;color:white;border:none;border-radius:10px;
      padding:7px 16px;font-family:inherit;font-weight:800;font-size:.82rem;cursor:pointer;
      margin-right:4px;">تثبيت</button>
    <button id="pwaDismissBtn" style="background:none;color:rgba(255,255,255,.6);border:none;
      cursor:pointer;font-size:1.1rem;padding:0 4px;">×</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.remove();
  });
  document.getElementById('pwaDismissBtn').addEventListener('click', () => banner.remove());
}

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.remove();
  console.log('✅ PWA installed');
});

// ── Service Worker Registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// ── Capacitor: hide splash screen when ready ─────────────────────────────────
async function hideSplash() {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (_) {
    // Not running in Capacitor context — ignore
  }
}

// ============================================================
// FAB SPEED DIAL (extracted from original HTML)
// ============================================================

  (function(){
    const dial     = document.getElementById('desktopSpeedDial');
    const mainBtn  = document.getElementById('desktopFabMain');
    const pillAppt = document.getElementById('deskPillAppt');
    const pillNotes= document.getElementById('deskPillNotes');
    let dialOpen = false, isDragging = false, dragMoved = false;
    let startX, startY, origLeft, origBottom;

    function showDial() {
      dial.style.display = window.innerWidth >= 768 ? 'flex' : 'none';
    }
    showDial();
    window.addEventListener('resize', showDial);

    // Pills تحسب موقعها من موقع الزر الفعلي على الشاشة
    function positionDesktopPills() {
      const btnRect  = mainBtn.getBoundingClientRect();
      const pills    = document.getElementById('desktopPills');
      const onRight  = (btnRect.left + btnRect.width/2) > window.innerWidth / 2;

      // فوق الزر
      const pillsBottom = window.innerHeight - btnRect.top + 12;

      if (onRight) {
        // الزر على اليمين — Pills تمتد لليسار، محاذاة من اليمين
        pills.style.right = (window.innerWidth - btnRect.right) + 'px';
        pills.style.left  = 'auto';
        pills.style.alignItems = 'flex-end';
      } else {
        // الزر على اليسار — Pills تمتد لليمين، محاذاة من اليسار
        pills.style.left  = btnRect.left + 'px';
        pills.style.right = 'auto';
        pills.style.alignItems = 'flex-start';
      }
      pills.style.bottom = pillsBottom + 'px';
      pills.style.top    = 'auto';
    }

    // Drag
    mainBtn.addEventListener('mousedown', function(e) {
      isDragging = true; dragMoved = false;
      const rect = dial.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      origLeft   = rect.left;
      origBottom = window.innerHeight - rect.bottom;
      dial.style.transition = 'none';
      mainBtn.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
      let newLeft   = Math.max(8, Math.min(window.innerWidth  - 68, origLeft   + dx));
      let newBottom = Math.max(8, Math.min(window.innerHeight - 68, origBottom - dy));
      dial.style.left   = newLeft + 'px';
      dial.style.bottom = newBottom + 'px';
      dial.style.right  = 'auto'; dial.style.top = 'auto';
    });
    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      mainBtn.style.cursor = 'grab';
      if (dialOpen) positionDesktopPills();
    });

    window.toggleFabDial = function() {
      if (dragMoved) { dragMoved = false; return; }
      dialOpen = !dialOpen;
      if (dialOpen) positionDesktopPills();
      mainBtn.classList.toggle('open', dialOpen);
      pillAppt.classList.toggle('visible', dialOpen);
      pillNotes.classList.toggle('visible', dialOpen);
      document.getElementById('fabBackdrop').classList.toggle('active', dialOpen);
    };
    window.closeFabDial = function() {
      dialOpen = false;
      mainBtn.classList.remove('open');
      pillAppt.classList.remove('visible');
      pillNotes.classList.remove('visible');
      document.getElementById('fabBackdrop').classList.remove('active');
    };

    // Mobile
    let mobOpen = false;
    function positionMobPills() {
      const trigger = document.getElementById('mobFabTrigger');
      const pills   = document.getElementById('mobPills');
      const rect    = trigger.getBoundingClientRect();
      // ضع الـ pills فوق الزر وعلى نفس الجهة
      pills.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      pills.style.right  = (window.innerWidth - rect.right) + 'px';
      pills.style.left   = 'auto';
    }
    window.toggleMobFab = function() {
      mobOpen = !mobOpen;
      const trigger = document.getElementById('mobFabTrigger');
      const pills   = document.getElementById('mobPills');
      if (mobOpen) positionMobPills();
      trigger.classList.toggle('open', mobOpen);
      pills.classList.toggle('active', mobOpen);
    };
    window.closeMobFab = function() {
      mobOpen = false;
      document.getElementById('mobFabTrigger').classList.remove('open');
      document.getElementById('mobPills').classList.remove('active');
    };
    document.addEventListener('click', function(e) {
      if (mobOpen && !e.target.closest('.mob-fab-container') && !e.target.closest('#mobPills')) closeMobFab();
      // أغلق sub-nav المواعيد
      if (apptSubOpen && !e.target.closest('#mobileAppointments') && !e.target.closest('#mobApptSubNav')
          && !e.target.closest('#sidebarAppointments') && !e.target.closest('#sidebarApptSub')) {
        apptSubOpen = false;
        document.getElementById('sidebarApptSub')?.classList.remove('open');
        document.getElementById('sidebarAppointments')?.classList.remove('sub-open');
        document.getElementById('mobApptSubNav')?.classList.remove('open');
      }
    });
  })();
  

// ============================================================
// MAIN APPLICATION CODE (extracted from original HTML)
// ============================================================

    // Firebase database imported from firebase.js

    // ================== Constants ==================
    const STORAGE_KEY = 'doctorAppointments';
    const PATIENTS_STORAGE_KEY = 'doctorPatients';
    const CLOSED_DAYS_KEY = 'closedDays';
    const SETTINGS_KEY = 'appSettings';
    const daysAr = ["الأحد","الإثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
    const monthsAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = toLocalISODate(today);
    const maxFutureDate = new Date(); maxFutureDate.setMonth(maxFutureDate.getMonth()+3); maxFutureDate.setHours(23,59,59,999);
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30); thirtyDaysAgo.setHours(0,0,0,0);
    const thirtyDaysAgoStr = toLocalISODate(thirtyDaysAgo);

    let allRecords = [], allPatients = {}, closedDays = [];
    let currentDate = new Date(), selectedDayStr = todayStr, currentSection = 'appointments', appointmentsTab = 'pending';
    let searchQuery = '', patientSearchQuery = '', lastPendingCount = 0, lastAcceptedCount = 0;
    let dayDensity = {};
    let manualAppointmentData = { patientName:'', phone:'', birthDate:'', address:'', visitType:'', selectedDate:'', selectedSlot:'Morning', currentStep:1 };
    let visitManagementState = { patientId:null, patientName:'', patientPhone:'', patientBirthDate:'', patientAddress:'', currentStep:1, appointmentRecord:null, isAddedToPatients:false };
    let addVisitState = { patientId:null, patientName:'', patientPhone:'', patientBirthDate:'', patientAddress:'' };
    let deleteAppointmentId = null, currentChartPeriod = 'monthly';
    let settings = { title: 'لوحة الممرضة', logo: null };
    let currentArchiveTab = 'daily';

    // ================== Helpers ==================
    function toLocalISODate(date) { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
    function parseLocalISODate(s) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
    // تحويل أي صيغة تاريخ ("YYYY-M-D" أو "YYYY-MM-DD") إلى "YYYY-MM-DD" موحّدة
    function normalizeDate(s) { if(!s) return ''; const [y,m,d]=(s+'').trim().substring(0,10).split('-').map(Number); if(!y||!m||!d) return (s+'').trim().substring(0,10); return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
    function formatDateAr(s) { if(!s) return '-'; const d=parseLocalISODate(normalizeDate(s)); return d.toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'}); }
    function calculateAge(b) { if(!b) return null; const birth=new Date(b); let age=today.getFullYear()-birth.getFullYear(); const m=today.getMonth()-birth.getMonth(); if(m<0||(m===0&&today.getDate()<birth.getDate())) age--; return age; }
    function normalizePhone(p) { return (p||'').replace(/[^\d+]/g,''); }
    function escapeHtml(text) { const div=document.createElement('div'); div.textContent=text; return div.innerHTML; }

    function showToast(msg, type='info') {
      const toast=document.getElementById('toast');
      const content=document.getElementById('toastContent');
      const colors = { success: '#16a34a', error: '#dc2626', info: '#0d9488' };
      const icons  = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
      content.style.background = colors[type] || colors.info;
      content.style.color = 'white';
      content.className = '';
      content.innerHTML = `<i class="fas fa-${icons[type]||icons.info}"></i> ${msg}`;
      toast.classList.remove('hidden');
      setTimeout(()=>toast.classList.add('hidden'), 3000);
    }

    // ================== Firebase CRUD ==================
    // ================== Firebase Cache ==================
    const _cache = {};
    function cacheSet(key, val) { try { localStorage.setItem('fc_'+key, JSON.stringify({v:val,t:Date.now()})); } catch(e){} _cache[key]=val; }
    function cacheGet(key, maxAgeMs=30000) {
      if (_cache[key] !== undefined) return _cache[key];
      try {
        const raw = localStorage.getItem('fc_'+key);
        if (!raw) return null;
        const {v,t} = JSON.parse(raw);
        if (Date.now()-t < maxAgeMs) { _cache[key]=v; return v; }
      } catch(e) {}
      return null;
    }

    function initializeFirebaseData() {
      // Load from cache immediately for instant render
      const cachedAppts = cacheGet('appointments', 60000);
      if (cachedAppts) {
        allRecords = cachedAppts;
        updateCounts(); calculateDensity(); renderCalendar();
        if (selectedDayStr) renderAgendaForDay(selectedDayStr);
        if (currentSection === 'appointments') renderBothAppointmentColumns();
      }
      const cachedPatients = cacheGet('patients', 60000);
      if (cachedPatients) {
        allPatients = cachedPatients;
        document.getElementById('totalPatientsCount').textContent = Object.keys(allPatients).length;
      }
      const cachedClosed = cacheGet('closedDays', 300000);
      if (cachedClosed) { closedDays = cachedClosed; }

      // Live Firebase listeners
      database.ref('appointments').on('value', (snapshot) => {
        const data = snapshot.val();
        allRecords = data ? Object.values(data) : [];

        // تحويل تلقائي: أي موعد Accepted وتاريخه انتهى → NoShow
        allRecords.forEach(r => {
          if (r.Status === 'Accepted' && r.id) {
            const d = parseLocalISODate(normalizeDate(r.Date));
            if (d < today) {
              database.ref(`appointments/${r.id}`).update({ Status: 'NoShow' });
            }
          }
        });

        cacheSet('appointments', allRecords);
        updateCounts(); calculateDensity(); renderCalendar();
        if (selectedDayStr) renderAgendaForDay(selectedDayStr);
        if (currentSection === 'appointments') renderBothAppointmentColumns();
        if (currentSection === 'stats') { updateStats(false); renderChart(); }
      });

      database.ref('patients').on('value', (snapshot) => {
        const data = snapshot.val();
        allPatients = data || {};
        cacheSet('patients', allPatients);
        document.getElementById('totalPatientsCount').textContent = Object.keys(allPatients).length;
        if (currentSection === 'patients') renderPatientBook();
      });

      database.ref('closedDays').on('value', (snapshot) => {
        closedDays = snapshot.val() || [];
        cacheSet('closedDays', closedDays);
        renderCalendar();
        if (selectedDayStr) updateDayStatusBadge(selectedDayStr);
      });

      database.ref('settings').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) { settings = data; applySettings(); }
      });
    }

    function saveAppointment(appointment) {
      const newRef = database.ref('appointments').push();
      appointment.id = newRef.key;
      newRef.set(appointment).then(()=>showToast('تم الحفظ بنجاح','success')).catch(e=>showToast('خطأ: '+e.message,'error'));
    }
    function updateAppointmentStatus(id, status) {
      database.ref(`appointments/${id}`).update({ Status: status }).then(()=>{
        showToast('تم تحديث الحالة','success');
        const record = allRecords.find(r=>r.id===id);
        if (record) {
          if (status==='Accepted') sendWhatsAppConfirmation(record.Phone,record.PatientName,record.Date,record.Slot,record.VisitType);
          else if (status==='Rejected') sendWhatsAppRejection(record.Phone,record.PatientName,record.Date);
          else if (status==='Cancelled') sendWhatsAppCancellation(record.Phone,record.PatientName,record.Date);
        }
      });
    }
    function deleteAppointment(id) {
      database.ref(`appointments/${id}`).update({ Status: 'Cancelled' }).then(()=>{ showToast('تم إلغاء الموعد','success'); if(selectedDayStr) renderAgendaForDay(selectedDayStr); });
    }
    function savePatient(patient) {
      const patientId = 'p_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
      patient.id = patientId;
      database.ref(`patients/${patientId}`).set(patient).then(()=>{
        showToast('تمت إضافة المريض','success');
        document.getElementById('patientBookModal').classList.add('hidden');
      });
    }
    function updatePatient(patientId, updatedData) {
      database.ref(`patients/${patientId}`).update(updatedData).then(()=>showToast('تم التحديث','success'));
    }
    function deletePatient(id) {
      if(confirm('حذف المريض؟')) {
        database.ref(`patients/${id}`).remove().then(()=>showToast('تم الحذف','success'));
      }
    }
    function toggleDayClosed(dateStr, close) {
      database.ref('closedDays').transaction((current)=>{
        const list = current||[];
        if(close) { if(!list.includes(dateStr)) list.push(dateStr); }
        else { const i=list.indexOf(dateStr); if(i>-1) list.splice(i,1); }
        return list;
      });
    }
    function saveSettingsToFirebase(newSettings) {
      database.ref('settings').set(newSettings).then(()=>showToast('تم حفظ الإعدادات','success'));
    }

    // ================== WhatsApp ==================
    function sendWhatsAppConfirmation(phone,name,date,slot,type) { window.open(`https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(`تم قبول موعدك ${formatDateAr(date)} ${slot==='Morning'?'صباحاً':'مساءً'}`)}`,'_blank'); }
    function sendWhatsAppRejection(phone,name,date) { window.open(`https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(`نأسف، تم رفض موعدك ${formatDateAr(date)}`)}`,'_blank'); }
    function sendWhatsAppCancellation(phone,name,date) { window.open(`https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(`تم إلغاء موعدك ${formatDateAr(date)}`)}`,'_blank'); }

    // ================== Settings ==================
    function applySettings() {
      document.getElementById('dashboardTitle').textContent = settings.title || 'لوحة الممرضة';
      const headerIcon = document.getElementById('headerLogoIcon');
      const headerImg  = document.getElementById('headerLogoImg');
      if (settings.logo) {
        headerIcon.classList.add('hidden');
        headerImg.src = settings.logo;
        headerImg.classList.remove('hidden');
      } else {
        headerIcon.classList.remove('hidden');
        headerImg.classList.add('hidden');
      }
    }
    function closeSettingsModal() { document.getElementById('settingsModal').classList.add('hidden'); }
    window.openSettingsModal = function() {
      document.getElementById('settingsTitleInput').value = settings.title || 'لوحة الممرضة';
      const previewImg  = document.getElementById('logoPreviewImg');
      const previewIcon = document.getElementById('logoPreviewIcon');
      const removeBtn   = document.getElementById('removeLogoBtn');
      if (settings.logo) {
        previewImg.src = settings.logo; previewImg.classList.remove('hidden');
        previewIcon.classList.add('hidden'); removeBtn.classList.remove('hidden');
      } else {
        previewImg.classList.add('hidden'); previewIcon.classList.remove('hidden'); removeBtn.classList.add('hidden');
      }
      document.getElementById('settingsModal').classList.remove('hidden');
    };
    function saveSettings() {
      const newTitle = document.getElementById('settingsTitleInput').value.trim();
      if (newTitle) settings.title = newTitle;
      saveSettingsToFirebase(settings);
      applySettings();
      closeSettingsModal();
    }
    window.removeLogo = function() {
      settings.logo = null;
      document.getElementById('logoPreviewImg').classList.add('hidden');
      document.getElementById('logoPreviewIcon').classList.remove('hidden');
      document.getElementById('removeLogoBtn').classList.add('hidden');
      document.getElementById('logoFileInput').value = '';
    };

    // ================== Day State ==================
    function isDayClosed(dateStr) { return closedDays.includes(dateStr); }
    function closeDay(dateStr) { toggleDayClosed(dateStr, true); }
    function openDay(dateStr) { toggleDayClosed(dateStr, false); }
    function updateDayStatusBadge(dateStr) {
      const badge=document.getElementById('dayStatusBadge');
      const closeIcon=document.getElementById('closeDayIcon');
      const openIcon=document.getElementById('openDayIcon');
      // Reset any custom inline styles from past-day display
      badge.style.background = '';
      badge.style.color = '';
      badge.style.border = '';
      if (isDayClosed(dateStr)) {
        badge.innerHTML='مغلق'; badge.className='day-status-badge closed';
        closeIcon.classList.add('hidden'); openIcon.classList.remove('hidden');
      } else {
        badge.innerHTML='مفتوح'; badge.className='day-status-badge open';
        closeIcon.classList.remove('hidden'); openIcon.classList.add('hidden');
      }
    }
    function updateCounts() {
      const pending  = allRecords.filter(r=>r.Status==='Pending').length;
      const accepted = allRecords.filter(r=>r.Status==='Accepted').length;
      document.getElementById('pendingTabCount').textContent  = pending;
      document.getElementById('acceptedTabCount').textContent = accepted;
      lastPendingCount = pending; lastAcceptedCount = accepted;
    }
    function calculateDensity() {
      dayDensity = {};
      allRecords.filter(r=>r.Status==='Accepted'||r.Status==='Visited'||r.Status==='NoShow').forEach(r=>{ const nd=normalizeDate(r.Date); dayDensity[nd]=(dayDensity[nd]||0)+1; });
    }

    // ================== Navigation ==================
    function setActiveSection(section, skipApptContent) {
      currentSection = section;
      document.querySelectorAll('.sidebar-item, .bottom-nav-item').forEach(el=>el.classList.remove('active'));
      const sectionMap = {
        appointments: ['sidebarAppointments','mobileAppointments','appointmentsSection'],
        patients:     ['sidebarPatients','mobilePatients','patientBookSection'],
        calendar:     ['sidebarCalendar','mobileCalendar','calendarSection'],
        stats:        ['sidebarStats','mobileStats','statsSection'],
      };
      const allSections = ['appointmentsSection','patientBookSection','calendarSection','statsSection'];
      allSections.forEach(s=>document.getElementById(s)?.classList.add('hidden'));
      const [side, mob, sec] = sectionMap[section] || [];
      document.getElementById(side)?.classList.add('active');
      document.getElementById(mob)?.classList.add('active');
      document.getElementById(sec)?.classList.remove('hidden');
      if (section==='appointments' && !skipApptContent) renderBothAppointmentColumns();
      if (section==='patients')     renderPatientBook();
      if (section==='calendar') { renderCalendar(); renderAgendaForDay(selectedDayStr); updateDayStatusBadge(selectedDayStr); }
      if (section==='stats') { updateStats(true); }
    }
    window.goToManualForm = function() {
      if (window.innerWidth >= 768) {
        // Desktop: open floating overlay, don't switch sections
        openManualFormOverlay();
      } else {
        // Mobile: original behavior
        setActiveSection('appointments');
        setAppointmentsTab('manual');
      }
    };
    window.goToToday = function() {
      currentDate = new Date(today); selectedDayStr = todayStr;
      setActiveSection('calendar');
      renderCalendar(); renderAgendaForDay(todayStr); updateDayStatusBadge(todayStr);
    };
    function setAppointmentsTab(tab) {
      appointmentsTab = tab;
      // Dual view is always shown — tab logic only for mobile manual form
      if (tab === 'manual') {
        setActiveSection('appointments');
        openManualFormOverlay();
      } else {
        renderBothAppointmentColumns();
      }
    }

    // ================== Appointments ==================
    // ====== Appointments Sub-Nav ======
    let apptSubOpen = false;
    let activeApptTab = null; // null = لا شيء مختار

    window.toggleApptSubNav = function() {
      // Sidebar
      const sidebarSub  = document.getElementById('sidebarApptSub');
      const sidebarItem = document.getElementById('sidebarAppointments');
      if (sidebarSub)  sidebarSub.classList.toggle('open');
      if (sidebarItem) sidebarItem.classList.toggle('sub-open');
      // إظهار appointmentsSection مع pending فوراً
      if (!activeApptTab) activeApptTab = 'pending';
      setActiveSection('appointments', true);
      renderBothAppointmentColumns();
      switchApptTab(activeApptTab);
    };

    window.selectApptSub = function(tab) {
      activeApptTab = tab;
      apptSubOpen = false;
      // أغلق sub-nav
      const sidebarSub  = document.getElementById('sidebarApptSub');
      const sidebarItem = document.getElementById('sidebarAppointments');
      const mobSub      = document.getElementById('mobApptSubNav');
      if (sidebarSub)  sidebarSub.classList.remove('open');
      if (sidebarItem) sidebarItem.classList.remove('sub-open');
      if (mobSub)      mobSub.classList.remove('open');
      // Active states
      ['subPending','subAccepted','mobSubPending','mobSubAccepted'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
      });
      if (tab === 'pending') {
        document.getElementById('subPending')?.classList.add('active');
        document.getElementById('mobSubPending')?.classList.add('active');
      } else {
        document.getElementById('subAccepted')?.classList.add('active');
        document.getElementById('mobSubAccepted')?.classList.add('active');
      }
      // Sidebar item active
      if (sidebarItem) sidebarItem.classList.add('active');
      document.getElementById('mobileAppointments')?.classList.add('active');
      // أظهر القسم + render + الكارت الصح
      setActiveSection('appointments', true);
      renderBothAppointmentColumns();
      switchApptTab(tab);
    };

    // setActiveSection بدون إظهار محتوى (للـ sub-nav)
    function setActiveSectionNoContent() {
      setActiveSection('appointments', true); // skipApptContent=true
    }

    window.switchApptTab = function(tab) {
      const pendingCol  = document.querySelector('#appointmentsDualView .glass-card:nth-child(1)');
      const acceptedCol = document.querySelector('#appointmentsDualView .glass-card:nth-child(2)');
      if (tab === 'pending') {
        if (pendingCol)  pendingCol.classList.add('active');
        if (acceptedCol) acceptedCol.classList.remove('active');
      } else {
        if (pendingCol)  pendingCol.classList.remove('active');
        if (acceptedCol) acceptedCol.classList.add('active');
      }
      // Update inline tab bar
      const btnP = document.getElementById('apptTabBtnPending');
      const btnA = document.getElementById('apptTabBtnAccepted');
      const bdgP = document.getElementById('apptBadgePending');
      const bdgA = document.getElementById('apptBadgeAccepted');
      const BASE = 'flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px 14px;border-radius:50px;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:.82rem;transition:all .22s;';
      if (btnP && btnA) {
        if (tab === 'pending') {
          btnP.style.cssText = BASE + 'background:var(--primary);color:white;box-shadow:0 2px 12px rgba(13,148,136,.3);';
          btnA.style.cssText = BASE + 'background:transparent;color:var(--text-muted);';
          if (bdgP) { bdgP.style.background='rgba(255,255,255,.25)'; bdgP.style.color='white'; }
          if (bdgA) { bdgA.style.background='var(--border)'; bdgA.style.color='var(--text-muted)'; }
        } else {
          btnA.style.cssText = BASE + 'background:var(--primary);color:white;box-shadow:0 2px 12px rgba(13,148,136,.3);';
          btnP.style.cssText = BASE + 'background:transparent;color:var(--text-muted);';
          if (bdgA) { bdgA.style.background='rgba(255,255,255,.25)'; bdgA.style.color='white'; }
          if (bdgP) { bdgP.style.background='var(--border)'; bdgP.style.color='var(--text-muted)'; }
        }
      }
    };

    function applyActiveTab() {
      const pendingCol  = document.querySelector('#appointmentsDualView .glass-card:nth-child(1)');
      const acceptedCol = document.querySelector('#appointmentsDualView .glass-card:nth-child(2)');
      if (activeApptTab) {
        switchApptTab(activeApptTab);
      } else {
        // لا اختيار → أخفِ الكارتين
        if (pendingCol)  pendingCol.classList.remove('active');
        if (acceptedCol) acceptedCol.classList.remove('active');
      }
    }

    function renderAppointmentsView() {
      renderBothAppointmentColumns();
      applyActiveTab();
    }

    function renderBothAppointmentColumns() {
      const pendingContainer  = document.getElementById('pendingCardsContainer');
      const acceptedContainer = document.getElementById('acceptedCardsContainer');
      if (!pendingContainer || !acceptedContainer) return;

      // --- Pending ---
      let pending = allRecords.filter(r=>r.Status==='Pending').sort((a,b)=>(b.Date||'').localeCompare(a.Date||''));
      document.getElementById('pendingTabCount').textContent = pending.length;
      const bdgP = document.getElementById('apptBadgePending');
      if (bdgP) bdgP.textContent = pending.length;
      ['subBadgePending','mobSubBadgePending'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=pending.length; });
      pendingContainer.innerHTML = pending.length
        ? pending.map(r=>appointmentCardHTML(r,'Pending')).join('')
        : `<div style="text-align:center; padding:28px; color:var(--text-muted);">
            <i class="fas fa-check-circle" style="font-size:2rem; display:block; margin-bottom:8px; opacity:.4; color:var(--green);"></i>
            لا توجد طلبات جديدة</div>`;

      // --- Accepted --- (اليوم والمستقبل فقط)
      let accepted = allRecords.filter(r=>r.Status==='Accepted' && parseLocalISODate(normalizeDate(r.Date)) >= today).sort((a,b)=>(a.Date||'').localeCompare(b.Date||''));
      document.getElementById('acceptedTabCount').textContent = accepted.length;
      const bdgA = document.getElementById('apptBadgeAccepted');
      if (bdgA) bdgA.textContent = accepted.length;
      ['subBadgeAccepted','mobSubBadgeAccepted'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=accepted.length; });
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        accepted = accepted.filter(r=>(r.PatientName||'').toLowerCase().includes(q)||(r.Phone||'').includes(q)||(r.Date||'').includes(q));
      }
      acceptedContainer.innerHTML = accepted.length
        ? accepted.map(r=>appointmentCardHTML(r,'Accepted')).join('')
        : `<div style="text-align:center; padding:28px; color:var(--text-muted);">
            <i class="fas fa-calendar-xmark" style="font-size:2rem; display:block; margin-bottom:8px; opacity:.4;"></i>
            لا توجد مواعيد مؤكدة</div>`;
    }

    // Lucide-style inline SVG helpers for appointment cards
    const ICON = {
      phone: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.87a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
      whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
      check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      x: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      eye: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
      stethoscope: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
      calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      clock: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      tag: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    };

    function appointmentCardHTML(record, status) {
      const phone = normalizePhone(record.Phone);
      const visitType = record.VisitType||'غير محدد';
      const date = formatDateAr(record.Date);
      const slot = record.Slot==='Morning'?'صباحاً':(record.Slot==='Evening'?'مساءً':'غير معلوم');
      if (status==='Pending') {
        return `<div class="appt-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <p style="font-weight:700; font-size:1rem;">${escapeHtml(record.PatientName)}</p>
              <p style="font-size:.78rem; color:var(--primary); margin-top:3px;">${escapeHtml(record.Phone)}</p>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="tel:${phone}" class="action-btn-small call-btn" title="اتصال">${ICON.phone}</a>
              <a href="https://wa.me/${phone}" target="_blank" class="action-btn-small whatsapp-btn" title="واتساب">${ICON.whatsapp}</a>
            </div>
          </div>
          <div style="font-size:.82rem; display:flex; flex-direction:column; gap:6px;">
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.tag}</span><span style="color:var(--text-muted);">نوع الزيارة:</span> <strong>${visitType}</strong></p>
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.calendar}</span><span style="color:var(--text-muted);">التاريخ:</span> <strong>${date}</strong></p>
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.clock}</span><span style="color:var(--text-muted);">الفترة:</span> <strong>${slot}</strong></p>
          </div>
          <div style="display:flex; gap:8px; margin-top:14px;">
            <button class="appt-card-btn appt-card-btn--accept" onclick="acceptAppointment('${record.id}')">${ICON.check} قبول</button>
            <button class="appt-card-btn appt-card-btn--reject" onclick="rejectAppointment('${record.id}')">${ICON.x} رفض</button>
            <button class="appt-card-btn appt-card-btn--details" onclick="openModalById('${record.id}')">${ICON.eye} تفاصيل</button>
          </div>
        </div>`;
      } else {
        return `<div class="appt-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <p style="font-weight:700; font-size:1rem;">${escapeHtml(record.PatientName)}</p>
              <p style="font-size:.78rem; color:var(--primary); margin-top:3px;">${escapeHtml(record.Phone)}</p>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="tel:${phone}" class="action-btn-small call-btn" title="اتصال">${ICON.phone}</a>
              <a href="https://wa.me/${phone}" target="_blank" class="action-btn-small whatsapp-btn" title="واتساب">${ICON.whatsapp}</a>
            </div>
          </div>
          <div style="font-size:.82rem; display:flex; flex-direction:column; gap:6px;">
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.tag}</span><span style="color:var(--text-muted);">نوع الزيارة:</span> <strong>${visitType}</strong></p>
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.calendar}</span><span style="color:var(--text-muted);">التاريخ:</span> <strong>${date}</strong></p>
            <p style="display:flex;align-items:center;gap:6px;"><span style="color:var(--primary);opacity:.7;">${ICON.clock}</span><span style="color:var(--text-muted);">الفترة:</span> <strong>${slot}</strong></p>
          </div>
          <div style="display:flex; gap:8px; margin-top:14px;">
            <button class="appt-card-btn appt-card-btn--details" onclick="openModalById('${record.id}')">${ICON.eye} تفاصيل</button>
            <button class="appt-card-btn appt-card-btn--cancel" onclick="cancelAppointment('${record.id}')">${ICON.trash} إلغاء</button>
          </div>
        </div>`;
      }
    }

    function acceptAppointment(id) { if(confirm('قبول الموعد؟')) updateAppointmentStatus(id,'Accepted'); }
    function rejectAppointment(id)  { if(confirm('رفض الطلب؟'))  updateAppointmentStatus(id,'Rejected'); }
    function cancelAppointment(id)  { if(confirm('إلغاء الموعد؟')) updateAppointmentStatus(id,'Cancelled'); }

    // ================== Patients ==================
    function renderPatientBook() {
      const grid = document.getElementById('patientsGrid');
      let patients = Object.values(allPatients);
      if (patientSearchQuery.trim()) {
        const q = patientSearchQuery.toLowerCase();
        patients = patients.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.phone||'').includes(q));
      }
      if (!patients.length) {
        grid.innerHTML = '<div style="grid-column:span 2;text-align:center;padding:32px;color:var(--text-muted);"><i class="fas fa-user-slash" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.4;"></i>لا يوجد مرضى</div>';
        return;
      }
      grid.innerHTML = patients.map(p=>{
        const phone = normalizePhone(p.phone);
        return `<div class="patient-card">
          <div class="patient-name">${escapeHtml(p.name)}</div>
          <div class="patient-phone"><i class="fas fa-phone"></i>${escapeHtml(p.phone)}</div>
          <div style="font-size:.75rem; color:var(--primary); margin-top:4px; font-weight:600;">${p.totalVisits||0} زيارة</div>
          <div class="patient-actions">
            <button class="patient-action-btn primary" onclick="openAddVisitModal('${p.id}','${escapeHtml(p.name)}','${escapeHtml(p.phone)}','${p.birthDate||''}','${escapeHtml(p.address||'')}')"><i class="fas fa-plus"></i> زيارة</button>
            <button class="patient-action-btn secondary" onclick="openPatientDetailsModal('${p.id}')"><i class="fas fa-eye"></i> تفاصيل</button>
            <button class="patient-action-btn danger" onclick="deletePatient('${p.id}')"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>`;
      }).join('');
    }

    function openPatientDetailsModal(patientId) {
      const p = allPatients[patientId]; if(!p) return;
      document.getElementById('modalPatientName').textContent       = p.name;
      document.getElementById('modalPatientPhone').textContent      = p.phone;
      document.getElementById('modalPatientBirthDate').textContent  = p.birthDate ? formatDateAr(p.birthDate) : '-';
      const age = p.birthDate ? calculateAge(p.birthDate) : '-';
      document.getElementById('modalPatientAge').textContent        = age!=='-' ? age+' سنة' : '-';
      document.getElementById('modalPatientTotalVisits').textContent= p.totalVisits||0;
      document.getElementById('modalPatientAddress').textContent    = p.address||'-';
      document.getElementById('modalWhatsappBtn').href = `https://wa.me/${normalizePhone(p.phone)}`;
      document.getElementById('modalCallBtn').href     = `tel:${normalizePhone(p.phone)}`;
      const visits = (p.appointments||[]).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      let html = visits.map((v,i)=>`<tr>
        <td style="padding:7px 8px; border-bottom:1px solid var(--bg);">${i+1}</td>
        <td style="padding:7px 8px; border-bottom:1px solid var(--bg);">${formatDateAr(v.date)}</td>
        <td style="padding:7px 8px; border-bottom:1px solid var(--bg);">${v.visitType||'-'}</td>
        <td style="padding:7px 8px; border-bottom:1px solid var(--bg);">${v.slot==='Morning'?'صباحاً':(v.slot==='Evening'?'مساءً':'غير معلوم')}</td>
      </tr>`).join('');
      if(!visits.length) html='<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--text-muted);">لا توجد زيارات</td></tr>';
      document.getElementById('modalVisitsTableBody').innerHTML = html;
      document.getElementById('patientDetailsModal').dataset.patientId = patientId;
      document.getElementById('patientDetailsModal').classList.remove('hidden');
    }
    window.closePatientDetailsModal = function() { document.getElementById('patientDetailsModal').classList.add('hidden'); };

    function openAddVisitModal(patientId,name,phone,birthDate,address) {
      addVisitState = { patientId, patientName:name, patientPhone:phone, patientBirthDate:birthDate, patientAddress:address };
      document.getElementById('addVisitPatientName').textContent = name;
      document.getElementById('addVisitDate').value  = todayStr;
      document.getElementById('addVisitSlot').value  = 'Morning';
      document.getElementById('addVisitModal').classList.remove('hidden');
    }
    window.openAddVisitModalFromModal = function() {
      const patientId = document.getElementById('patientDetailsModal').dataset.patientId;
      const p = allPatients[patientId];
      if(p) { openAddVisitModal(patientId,p.name,p.phone,p.birthDate,p.address); closePatientDetailsModal(); }
    };
    function submitAddVisit() {
      const p = allPatients[addVisitState.patientId]; if(!p) return;
      const type      = document.getElementById('addVisitType').value;
      const visitDate = document.getElementById('addVisitDate').value;
      const slot      = document.getElementById('addVisitSlot').value;
      if(!type)      { showToast('اختر نوع الزيارة','error'); return; }
      if(!visitDate) { showToast('اختر تاريخ الزيارة','error'); return; }
      if(!p.appointments) p.appointments=[];
      p.appointments.push({ date:visitDate, slot, visitType:type, dayName:daysAr[parseLocalISODate(visitDate).getDay()] });
      p.totalVisits = p.appointments.length;
      p.lastVisit   = visitDate;
      updatePatient(p.id, p);
      document.getElementById('addVisitModal').classList.add('hidden');
      showToast('تمت إضافة الزيارة','success');
    }

    function showVisitStep(step) {
      document.getElementById('visitStep1').style.display = step===1 ? 'flex' : 'none';
      document.getElementById('visitStep2').style.display = step===2 ? 'flex' : 'none';
      document.getElementById('visitStep3').style.display = step===3 ? 'flex' : 'none';
    }

    window.openVisitManagement = function(record) {
      visitManagementState = { patientId:null, patientName:record.PatientName, patientPhone:record.Phone, patientBirthDate:record.BirthDate, patientAddress:record.Address||'', currentStep:1, appointmentRecord:record, isAddedToPatients:false };
      document.getElementById('visitManagementPatientName').textContent = record.PatientName;
      document.getElementById('visitNewPatientName').value = record.PatientName;
      document.getElementById('visitNewPatientPhone').value = record.Phone;
      document.getElementById('visitNewPatientBirthDate').value = record.BirthDate||'';
      document.getElementById('visitNewPatientAddress').value = record.Address||'';
      document.getElementById('visitNewPatientDate').value = record.Date || todayStr;
      document.getElementById('visitNewPatientSlot').value = record.Slot || 'Morning';
      document.getElementById('existingPatientDate').value = record.Date || todayStr;
      document.getElementById('existingPatientSlot').value = record.Slot || 'Morning';
      document.getElementById('visitManagementModal').classList.remove('hidden');
      showVisitStep(1);
    };

    document.getElementById('firstVisitYes').addEventListener('click', ()=>{ showVisitStep(2); });

    document.getElementById('firstVisitNo').addEventListener('click', ()=>{
      document.getElementById('patientSearchInput').value = '';
      document.getElementById('patientSearchResults').innerHTML = '';
      showSearchView();
      showVisitStep(3);
    });

    document.getElementById('backToVisitStep1FromNew').addEventListener('click', ()=>{ showVisitStep(1); });

    document.getElementById('backToVisitStep1FromSearch').addEventListener('click', ()=>{ showVisitStep(1); });

    function showSearchView() {
      document.getElementById('patientSearchView').style.display = 'flex';
      document.getElementById('patientSearchView').style.flexDirection = 'column';
      document.getElementById('selectedPatientView').style.display = 'none';
      selectedVisitPatientId = null;
    }

    function showPatientDetailsView() {
      document.getElementById('patientSearchView').style.display = 'none';
      document.getElementById('selectedPatientView').style.display = 'flex';
      document.getElementById('selectedPatientView').style.flexDirection = 'column';
    }

    let selectedVisitPatientId = null;

    document.getElementById('patientSearchInput').addEventListener('input', (e)=>{
      const term = e.target.value.toLowerCase().trim();
      selectedVisitPatientId = null;
      if(!term) { document.getElementById('patientSearchResults').innerHTML=''; return; }
      const matches = Object.values(allPatients).filter(p=> p.name.toLowerCase().includes(term) || p.phone.includes(term));
      document.getElementById('patientSearchResults').innerHTML = matches.map(p=>`
        <div onclick="previewPatientForVisit('${p.id}')" style="padding:10px; background:var(--bg); border:1.5px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; transition:all .15s;" onmouseover="this.style.background='var(--primary-light)';this.style.borderColor='var(--primary)'" onmouseout="this.style.background='var(--bg)';this.style.borderColor='var(--border)'">
          <p style="font-weight:700; color:var(--text);">${escapeHtml(p.name)}</p>
          <p style="font-size:.75rem; color:var(--text-muted);">${escapeHtml(p.phone)}</p>
        </div>
      `).join('');
    });

    window.previewPatientForVisit = function(patientId) {
      const p = allPatients[patientId]; if(!p) return;
      selectedVisitPatientId = patientId;
      // Calculate age
      let ageStr = '-';
      if(p.birthDate) {
        const bd = parseLocalISODate(p.birthDate);
        const now = new Date();
        let age = now.getFullYear() - bd.getFullYear();
        if(now.getMonth() < bd.getMonth() || (now.getMonth()===bd.getMonth() && now.getDate()<bd.getDate())) age--;
        ageStr = age + ' سنة';
      }
      // Get first visit from appointments array
      let firstVisitStr = '-';
      if(p.firstVisit) {
        firstVisitStr = formatDateAr(p.firstVisit);
      } else if(p.appointments && p.appointments.length) {
        const sorted = [...p.appointments].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
        firstVisitStr = formatDateAr(sorted[0].date);
      }
      document.getElementById('selPatientName').textContent = p.name;
      document.getElementById('selPatientPhone').textContent = p.phone || '-';
      document.getElementById('selPatientAge').textContent = ageStr;
      document.getElementById('selPatientAddress').textContent = p.address || '-';
      document.getElementById('selPatientFirstVisit').textContent = firstVisitStr;
      document.getElementById('selPatientLastVisit').textContent = p.lastVisit ? formatDateAr(p.lastVisit) : 'لا توجد';
      document.getElementById('selPatientTotalVisits').textContent = (p.totalVisits || (p.appointments||[]).length || 0) + ' زيارة';
      showPatientDetailsView();
    };

    document.getElementById('submitExistingPatientVisit').addEventListener('click', ()=>{
      if(!selectedVisitPatientId) { showToast('اختر مريضاً من نتائج البحث أعلاه', 'info'); return; }
      selectPatientForVisit(selectedVisitPatientId);
    });

    function submitNewPatientVisit() {
      const name = document.getElementById('visitNewPatientName').value.trim();
      const phone = document.getElementById('visitNewPatientPhone').value.trim();
      const birth = document.getElementById('visitNewPatientBirthDate').value;
      const addr = document.getElementById('visitNewPatientAddress').value.trim();
      const type = document.getElementById('visitNewPatientVisitType').value;
      const slot = document.getElementById('visitNewPatientSlot').value;
      if(!name || !phone || !birth || !type) { showToast('املأ البيانات الأساسية','error'); return; }
      const visitDate = document.getElementById('visitNewPatientDate').value || todayStr;
      const patientId = 'p_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
      const newPatient = {
        id:patientId, name, phone, birthDate:birth, address:addr,
        appointments:[{ date:visitDate, slot:slot, visitType:type, dayName:daysAr[parseLocalISODate(visitDate).getDay()] }],
        firstVisit:visitDate, lastVisit:visitDate, totalVisits:1
      };
      // حفظ المريض الجديد في Firebase
      database.ref(`patients/${patientId}`).set(newPatient);
      // تغيير حالة الموعد إلى "Visited" بدلاً من الحذف
      if(visitManagementState.appointmentRecord && visitManagementState.appointmentRecord.id) {
        database.ref(`appointments/${visitManagementState.appointmentRecord.id}`).update({ Status: 'Visited' });
      }
      document.getElementById('visitManagementModal').classList.add('hidden');
      showToast('تم نقل المريض إلى دفتر المرضى','success');
      setActiveSection('patients');
    }

    document.getElementById('submitNewPatientVisit').addEventListener('click', submitNewPatientVisit);

    window.selectPatientForVisit = function(patientId) {
      const p = allPatients[patientId]; if(!p) return;
      const visitDate = document.getElementById('existingPatientDate').value || todayStr;
      const slot = document.getElementById('existingPatientSlot').value || 'Morning';
      const type = visitManagementState.appointmentRecord?.VisitType || document.getElementById('visitNewPatientVisitType').value || 'مراجعة';
      p.appointments = p.appointments || [];
      p.appointments.push({ date:visitDate, slot:slot, visitType:type, dayName:daysAr[parseLocalISODate(visitDate).getDay()] });
      p.totalVisits = p.appointments.length;
      p.lastVisit = visitDate;
      // تحديث المريض في Firebase
      updatePatient(p.id, p);
      // تغيير حالة الموعد إلى "Visited" بدلاً من الحذف
      if(visitManagementState.appointmentRecord && visitManagementState.appointmentRecord.id) {
        database.ref(`appointments/${visitManagementState.appointmentRecord.id}`).update({ Status: 'Visited' });
      }
      document.getElementById('visitManagementModal').classList.add('hidden');
      showToast('تمت إضافة الزيارة للمريض','success');
      setActiveSection('patients');
    };

    // ================== Calendar ==================
    function renderCalendar() {
      const grid = document.getElementById('calendarGrid'); if(!grid) return;
      grid.innerHTML = '';
      const year=currentDate.getFullYear(), month=currentDate.getMonth();
      document.getElementById('currentMonth').textContent = `${monthsAr[month]} ${year}`;
      const firstDay = new Date(year,month,1).getDay();
      const daysInMonth = new Date(year,month+1,0).getDate();
      let startOffset = (firstDay+2)%7;
      for(let i=startOffset-1;i>=0;i--) {
        const d=document.createElement('div'); d.className='compact-calendar-day other-month'; d.textContent=''; grid.appendChild(d);
      }
      for(let d=1;d<=daysInMonth;d++) {
        const dateObj=new Date(year,month,d); dateObj.setHours(0,0,0,0);
        const dateStr=toLocalISODate(dateObj);
        const dayDiv=document.createElement('div'); dayDiv.className='compact-calendar-day'; dayDiv.textContent=d;
        if(dateObj < today) {
          dayDiv.classList.add('past-day');
          if(selectedDayStr===dateStr) dayDiv.classList.add('selected');
          dayDiv.style.cursor = 'pointer';
          dayDiv.addEventListener('click', ()=> {
            selectedDayStr = dateStr;
            renderCalendar();
            renderAgendaForDay(dateStr);
            updateDayStatusBadge(dateStr);
            document.getElementById('dayAgenda').classList.remove('hidden');
          });
        }
        else {
          if(dateObj.getTime()===today.getTime()) dayDiv.classList.add('today');
          if(selectedDayStr===dateStr) dayDiv.classList.add('selected');
          dayDiv.addEventListener('click',()=>selectDay(dateStr));
          const count=dayDensity[dateStr]||0;
          if(count>0) {
            const dot=document.createElement('div'); dot.className='compact-appointment-dot';
            if(count<=2) dot.classList.add('compact-dot-low');
            else if(count<=4) dot.classList.add('compact-dot-medium');
            else dot.classList.add('compact-dot-high');
            dayDiv.appendChild(dot);
          }
          if(isDayClosed(dateStr)) dayDiv.classList.add('closed-day');
        }
        grid.appendChild(dayDiv);
      }
    }
    function selectDay(dateStr) {
      selectedDayStr=dateStr; renderCalendar(); renderAgendaForDay(dateStr); updateDayStatusBadge(dateStr);
      document.getElementById('dayAgenda').classList.remove('hidden');
    }
    function getPastDayVisits(dateStr) {
      let visits = [];
      Object.values(allPatients).forEach(p => {
        (p.appointments || []).forEach(v => {
          const vDate = (v.date || v.Date || '').toString().trim().substring(0, 10);
          if (vDate === dateStr) {
            visits.push({
              patientName: p.name || p.PatientName || '',
              phone: p.phone || p.Phone || '',
              slot: v.slot || v.Slot || 'Morning',
              visitType: v.visitType || v.VisitType || '-'
            });
          }
        });
      });
      return visits;
    }
    function renderAgendaForDay(dateStr) {
      const isPast = parseLocalISODate(dateStr) < today;
      document.getElementById('agendaTitle').textContent = `${daysAr[parseLocalISODate(dateStr).getDay()]} — ${formatDateAr(dateStr)}`;

      if (isPast) {
        const visits      = getPastDayVisits(dateStr);
        const noShow      = allRecords.filter(r => r.Status === 'NoShow'    && normalizeDate(r.Date) === dateStr);
        const cancelledRec= allRecords.filter(r => (r.Status === 'Cancelled' || r.Status === 'Rejected') && normalizeDate(r.Date) === dateStr);
        const morning     = visits.filter(v => (v.slot || '').toLowerCase() !== 'evening');
        const evening     = visits.filter(v => (v.slot || '').toLowerCase() === 'evening');
        const noShowMorn  = noShow.filter(r => (r.Slot || 'Morning') === 'Morning');
        const noShowEve   = noShow.filter(r =>  r.Slot === 'Evening');
        const cancelMorn  = cancelledRec.filter(r => (r.Slot || 'Morning') === 'Morning');
        const cancelEve   = cancelledRec.filter(r =>  r.Slot === 'Evening');

        document.getElementById('agendaCount').textContent =
          `زيارات: ${visits.length}${noShow.length ? ' · لم يحضر: ' + noShow.length : ''}${cancelledRec.length ? ' · ملغاة: ' + cancelledRec.length : ''}`;
        document.getElementById('agendaMorningCount').textContent = morning.length + noShowMorn.length + cancelMorn.length;
        document.getElementById('agendaEveningCount').textContent = evening.length + noShowEve.length + cancelEve.length;
        document.getElementById('closeDayIcon').classList.add('hidden');
        document.getElementById('openDayIcon').classList.add('hidden');

        const badge = document.getElementById('dayStatusBadge');
        badge.style.cssText = 'background:var(--bg);color:var(--text-muted);border:1px solid var(--border);';
        badge.className = 'day-status-badge';
        badge.innerHTML = `<i class="fas fa-history" style="margin-left:4px;font-size:.75rem;"></i> سابق`;

        const pastCard = (v) => `
          <div class="agenda-card" style="border-color:#86efac; background:#f0fdf4; opacity:.85;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p class="agenda-patient-name">${escapeHtml(v.patientName)}</p>
                <p class="agenda-patient-phone">${escapeHtml(v.phone)}</p>
              </div>
              <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;
                background:#dcfce7;color:#16a34a;border:1px solid #86efac;">
                <i class="fas fa-check-circle" style="margin-left:3px;font-size:.65rem;"></i>تمت الزيارة
              </span>
            </div>
          </div>`;
        const noShowCard = (r) => `
          <div class="agenda-card" style="border-color:#fca5a5; background:#fef2f2; opacity:.85;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p class="agenda-patient-name">${escapeHtml(r.PatientName)}</p>
                <p class="agenda-patient-phone">${escapeHtml(r.Phone)}</p>
              </div>
              <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;
                background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">
                <i class="fas fa-user-times" style="margin-left:3px;font-size:.65rem;"></i>لم يحضر
              </span>
            </div>
          </div>`;
        const cancelCard = (r) => `
          <div class="agenda-card" style="border-color:#fca5a5; background:#fef2f2; opacity:.85;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p class="agenda-patient-name">${escapeHtml(r.PatientName)}</p>
                <p class="agenda-patient-phone">${escapeHtml(r.Phone)}</p>
              </div>
              <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;
                background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">
                <i class="fas fa-ban" style="margin-left:3px;font-size:.65rem;"></i>تم الإلغاء
              </span>
            </div>
          </div>`;
        const emptyMsg = (slot) => `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:.82rem;">لا توجد مواعيد ${slot}</div>`;
        document.getElementById('agendaMorning').innerHTML =
          (morning.length    ? morning.map(pastCard).join('')   : '') +
          (noShowMorn.length ? noShowMorn.map(noShowCard).join('') : '') +
          (cancelMorn.length ? cancelMorn.map(cancelCard).join('') : '') +
          (!morning.length && !noShowMorn.length && !cancelMorn.length ? emptyMsg('صباحية') : '');
        document.getElementById('agendaEvening').innerHTML =
          (evening.length   ? evening.map(pastCard).join('')   : '') +
          (noShowEve.length ? noShowEve.map(noShowCard).join('') : '') +
          (cancelEve.length ? cancelEve.map(cancelCard).join('') : '') +
          (!evening.length && !noShowEve.length && !cancelEve.length ? emptyMsg('مسائية') : '');

      } else {
        const accepted   = allRecords.filter(r => r.Status === 'Accepted'  && normalizeDate(r.Date) === dateStr);
        const visited    = allRecords.filter(r => r.Status === 'Visited'   && normalizeDate(r.Date) === dateStr);
        const cancelled  = allRecords.filter(r => (r.Status === 'Cancelled' || r.Status === 'Rejected') && normalizeDate(r.Date) === dateStr);
        const morning        = accepted.filter(r  => (r.Slot || 'Morning') === 'Morning');
        const evening        = accepted.filter(r  =>  r.Slot === 'Evening');
        const visitedMorning = visited.filter(r   => (r.Slot || 'Morning') === 'Morning');
        const visitedEvening = visited.filter(r   =>  r.Slot === 'Evening');
        const cancelMorning  = cancelled.filter(r => (r.Slot || 'Morning') === 'Morning');
        const cancelEvening  = cancelled.filter(r =>  r.Slot === 'Evening');
        const totalAll = accepted.length + visited.length + cancelled.length;
        document.getElementById('agendaCount').textContent =
          `مواعيد: ${accepted.length + visited.length}${cancelled.length ? ' · ملغاة: ' + cancelled.length : ''}`;
        document.getElementById('agendaMorningCount').textContent = morning.length + visitedMorning.length + cancelMorning.length;
        document.getElementById('agendaEveningCount').textContent = evening.length + visitedEvening.length + cancelEvening.length;
        const emptyMsg = (slot) => `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:.82rem;">لا توجد مواعيد ${slot}</div>`;
        const visitedCardHTML = (r) => `
          <div class="agenda-card" style="border-color:#86efac; background:#f0fdf4; opacity:.85;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p class="agenda-patient-name">${escapeHtml(r.PatientName)}</p>
                <p class="agenda-patient-phone">${escapeHtml(r.Phone)}</p>
              </div>
              <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;
                background:#dcfce7;color:#16a34a;border:1px solid #86efac;">
                <i class="fas fa-check-circle" style="margin-left:3px;font-size:.65rem;"></i>تمت الزيارة
              </span>
            </div>
          </div>`;
        const cancelCardHTML = (r) => `
          <div class="agenda-card" style="border-color:#fca5a5; background:#fef2f2; opacity:.85;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p class="agenda-patient-name">${escapeHtml(r.PatientName)}</p>
                <p class="agenda-patient-phone">${escapeHtml(r.Phone)}</p>
              </div>
              <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;
                background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">
                <i class="fas fa-ban" style="margin-left:3px;font-size:.65rem;"></i>تم الإلغاء
              </span>
            </div>
          </div>`;
        document.getElementById('agendaMorning').innerHTML =
          (morning.length ? morning.map(r => agendaCardHTML(r)).join('') : '') +
          (visitedMorning.length ? visitedMorning.map(visitedCardHTML).join('') : '') +
          (cancelMorning.length  ? cancelMorning.map(cancelCardHTML).join('') : '') +
          (!morning.length && !visitedMorning.length && !cancelMorning.length ? emptyMsg('صباحية') : '');
        document.getElementById('agendaEvening').innerHTML =
          (evening.length ? evening.map(r => agendaCardHTML(r)).join('') : '') +
          (visitedEvening.length ? visitedEvening.map(visitedCardHTML).join('') : '') +
          (cancelEvening.length  ? cancelEvening.map(cancelCardHTML).join('') : '') +
          (!evening.length && !visitedEvening.length && !cancelEvening.length ? emptyMsg('مسائية') : '');
        updateDayStatusBadge(dateStr);
      }
    }
    function showPastDayDetails(dateStr) {
      // جمع كل الزيارات الفعلية لهذا اليوم من دفتر المرضى فقط
      let actualVisits = [];
      Object.values(allPatients).forEach(p => {
        (p.appointments || []).forEach(v => {
          // مقارنة مرنة للتاريخ (date أو Date)
          const vDate = (v.date || v.Date || '').toString().trim().substring(0, 10);
          if (vDate === dateStr) {
            actualVisits.push({ slot: v.slot || v.Slot || 'Morning', visitType: v.visitType || v.VisitType });
          }
        });
      });

      const total   = actualVisits.length;
      const morning = actualVisits.filter(v => (v.slot||'').toLowerCase() !== 'evening').length;
      const evening = actualVisits.filter(v => (v.slot||'').toLowerCase() === 'evening').length;
      const cancelled = allRecords.filter(r =>
        (r.Status === 'Cancelled' || r.Status === 'Rejected') &&
        (r.Date || '').toString().trim().substring(0, 10) === dateStr
      ).length;

      document.getElementById('statInfoTitle').textContent = `تفاصيل ${formatDateAr(dateStr)}`;
      document.getElementById('statInfoDescription').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:14px;text-align:center;">
            <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:2px;">إجمالي الزيارات الفعلية</p>
            <p style="font-size:2rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;line-height:1;">${total}</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="background:var(--amber-light);border-radius:var(--radius-sm);padding:11px;text-align:center;">
              <p style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px;">صباحاً</p>
              <p style="font-size:1.5rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;">${morning}</p>
            </div>
            <div style="background:#eff6ff;border-radius:var(--radius-sm);padding:11px;text-align:center;">
              <p style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px;">مساءً</p>
              <p style="font-size:1.5rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;">${evening}</p>
            </div>
          </div>
          <div style="background:var(--red-light);border-radius:var(--radius-sm);padding:11px;text-align:center;">
            <p style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px;">ملغاة / مرفوضة</p>
            <p style="font-size:1.5rem;font-weight:800;color:var(--red);font-family:'DM Mono',monospace;">${cancelled}</p>
          </div>
          <p style="font-size:.68rem;color:var(--text-muted);text-align:center;opacity:.6;">${dateStr}</p>
        </div>`;
      document.getElementById('statInfoModal').classList.remove('hidden');
    }
    function agendaCardHTML(record) {
      const phone=normalizePhone(record.Phone);
      return `<div class="agenda-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <p class="agenda-patient-name">${escapeHtml(record.PatientName)}</p>
            <p class="agenda-patient-phone">${escapeHtml(record.Phone)}</p>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="agenda-action-btn manage" title="إدارة الزيارة" onclick='openVisitManagement(${JSON.stringify(record).replace(/'/g,"\\'")})'>${ICON.stethoscope}</button>
            <button class="agenda-action-btn details" title="تفاصيل" onclick="openModalById('${record.id}')">${ICON.eye}</button>
          </div>
        </div>
        <div style="margin-top:6px; font-size:.75rem; color:var(--primary); font-weight:600;">${record.VisitType}</div>
      </div>`;
    }

    window.openModalById = function(id) {
      const r=allRecords.find(r=>r.id===id); if(!r) return;
      document.getElementById('appDetailsName').textContent      = r.PatientName;
      const phone=r.Phone||'-';
      document.getElementById('appDetailsPhone').textContent     = phone;
      document.getElementById('appDetailsPhoneInfo').textContent = phone;
      document.getElementById('appDetailsWhatsappBtn').href = `https://wa.me/${normalizePhone(phone)}`;
      document.getElementById('appDetailsCallBtn').href     = `tel:${normalizePhone(phone)}`;
      document.getElementById('appDetailsBirthDate').textContent= r.BirthDate?formatDateAr(r.BirthDate):'-';
      const age=r.BirthDate?calculateAge(r.BirthDate):'-';
      document.getElementById('appDetailsAge').textContent       = age!=='-'?age+' سنة':'-';
      document.getElementById('appDetailsVisitType').textContent = r.VisitType||'-';
      document.getElementById('appDetailsAddress').textContent   = r.Address||'-';
      document.getElementById('appDetailsSlot').textContent      = r.Slot==='Morning'?'صباحاً':(r.Slot==='Evening'?'مساءً':'غير معلوم');
      document.getElementById('appDetailsDate').textContent      = r.Date?formatDateAr(r.Date):'-';
      deleteAppointmentId = id;
      const deleteBtn=document.getElementById('deleteAppointmentModalBtn');
      r.Status==='Accepted' ? deleteBtn.classList.remove('hidden') : deleteBtn.classList.add('hidden');
      document.getElementById('appointmentDetailsModal').classList.remove('hidden');
    };
    window.closeAppointmentDetailsModal = function() { document.getElementById('appointmentDetailsModal').classList.add('hidden'); };

    window.confirmDelete = function(id) {
      deleteAppointmentId = id;
      document.getElementById('confirmDeleteModal').classList.remove('hidden');
    };
    document.getElementById('confirmDeleteYes').addEventListener('click', function() {
      if(deleteAppointmentId) {
        deleteAppointment(deleteAppointmentId);
        document.getElementById('confirmDeleteModal').classList.add('hidden');
        document.getElementById('appointmentDetailsModal').classList.add('hidden');
        deleteAppointmentId = null;
      }
    });
    document.getElementById('confirmDeleteNo').addEventListener('click', function() {
      document.getElementById('confirmDeleteModal').classList.add('hidden'); deleteAppointmentId=null;
    });
    window.deleteAppointmentFromModal = function() {
      if(deleteAppointmentId) { document.getElementById('appointmentDetailsModal').classList.add('hidden'); confirmDelete(deleteAppointmentId); }
    };

    // ================== Manual Form ==================
    function updateManualSummaryFields() {
      document.getElementById('summaryPatientName').textContent = manualAppointmentData.patientName||'-';
      const age = manualAppointmentData.birthDate?calculateAge(manualAppointmentData.birthDate):'-';
      document.getElementById('summaryAge').textContent = age!=='-'?age+' سنة':'-';
      document.getElementById('confirmPatientName').textContent = manualAppointmentData.patientName||'-';
      document.getElementById('confirmPhone').textContent       = manualAppointmentData.phone||'-';
      document.getElementById('confirmVisitType').textContent   = manualAppointmentData.visitType||'-';
      document.getElementById('confirmDate').textContent        = manualAppointmentData.selectedDate?formatDateAr(manualAppointmentData.selectedDate):'-';
      document.getElementById('confirmSlot').textContent        = manualAppointmentData.selectedSlot==='Morning'?'صباحاً':'مساءً';
    }
    function setupManualForm() {
      document.getElementById('manualDateInput').min = todayStr;
      document.getElementById('manualDateInput').max = toLocalISODate(maxFutureDate);
      document.getElementById('manualBirthDate').max = todayStr;
      const slotMorning=document.getElementById('slotMorning'), slotEvening=document.getElementById('slotEvening');
      const newSlotMorning=slotMorning.cloneNode(true), newSlotEvening=slotEvening.cloneNode(true);
      slotMorning.parentNode.replaceChild(newSlotMorning, slotMorning);
      slotEvening.parentNode.replaceChild(newSlotEvening, slotEvening);
      document.getElementById('slotMorning').addEventListener('click',function(){
        document.getElementById('slotMorning').classList.add('selected');
        document.getElementById('slotEvening').classList.remove('selected');
        manualAppointmentData.selectedSlot='Morning'; updateManualSummaryFields();
      });
      document.getElementById('slotEvening').addEventListener('click',function(){
        document.getElementById('slotEvening').classList.add('selected');
        document.getElementById('slotMorning').classList.remove('selected');
        manualAppointmentData.selectedSlot='Evening'; updateManualSummaryFields();
      });
      document.getElementById('manualPatientName').addEventListener('input',function(e){ manualAppointmentData.patientName=e.target.value; updateManualSummaryFields(); });
      document.getElementById('manualPhone').addEventListener('input',function(e){ manualAppointmentData.phone=e.target.value; updateManualSummaryFields(); });
      document.getElementById('manualBirthDate').addEventListener('change',function(e){ manualAppointmentData.birthDate=e.target.value; updateManualSummaryFields(); });
      document.getElementById('manualAddress').addEventListener('input',function(e){ manualAppointmentData.address=e.target.value; });
      document.getElementById('manualVisitType').addEventListener('change',function(e){ manualAppointmentData.visitType=e.target.value; updateManualSummaryFields(); });
      document.getElementById('manualDateInput').addEventListener('change',function(e){ manualAppointmentData.selectedDate=e.target.value; updateManualSummaryFields(); });
      loadManualFormData();
    }
    function saveManualFormData() {
      manualAppointmentData.patientName   = document.getElementById('manualPatientName').value;
      manualAppointmentData.phone         = document.getElementById('manualPhone').value;
      manualAppointmentData.birthDate     = document.getElementById('manualBirthDate').value;
      manualAppointmentData.address       = document.getElementById('manualAddress').value;
      manualAppointmentData.visitType     = document.getElementById('manualVisitType').value;
      manualAppointmentData.selectedDate  = document.getElementById('manualDateInput').value;
    }
    function loadManualFormData() {
      document.getElementById('manualPatientName').value = manualAppointmentData.patientName||'';
      document.getElementById('manualPhone').value       = manualAppointmentData.phone||'';
      document.getElementById('manualBirthDate').value   = manualAppointmentData.birthDate||'';
      document.getElementById('manualAddress').value     = manualAppointmentData.address||'';
      document.getElementById('manualVisitType').value   = manualAppointmentData.visitType||'';
      document.getElementById('manualDateInput').value   = manualAppointmentData.selectedDate||'';
      if(manualAppointmentData.selectedSlot==='Morning') {
        document.getElementById('slotMorning').classList.add('selected');
        document.getElementById('slotEvening').classList.remove('selected');
      } else {
        document.getElementById('slotEvening').classList.add('selected');
        document.getElementById('slotMorning').classList.remove('selected');
      }
      updateManualSummaryFields();
    }
    function goToStep(step) {
      manualAppointmentData.currentStep = step;
      document.querySelectorAll('.form-step').forEach(s=>s.classList.remove('active'));
      document.getElementById(`step${step}`).classList.add('active');
      document.querySelectorAll('.step-dot').forEach((dot,i)=>{
        let n=i+1;
        const wrapper = dot.closest('.step-dot-wrapper');
        dot.classList.remove('active','completed');
        if(wrapper) wrapper.classList.remove('active','completed');
        if(n<step) { dot.classList.add('completed'); dot.innerHTML='<i class="fas fa-check" style="font-size:.75rem;"></i>'; if(wrapper) wrapper.classList.add('completed'); }
        else if(n===step) { dot.classList.add('active'); dot.textContent=n; if(wrapper) wrapper.classList.add('active'); }
        else dot.textContent=n;
      });
      // Update connectors
      document.querySelectorAll('.step-dot-connector').forEach((c,i)=>{
        c.classList.toggle('done', step > i+1);
      });
    }
    document.getElementById('nextToStep2')?.addEventListener('click',()=>{
      saveManualFormData();
      if(!manualAppointmentData.patientName||!manualAppointmentData.phone||!manualAppointmentData.birthDate||!manualAppointmentData.visitType){ showToast('املأ جميع الحقول','error'); return; }
      goToStep(2);
    });
    document.getElementById('backToStep1')?.addEventListener('click',()=>{ saveManualFormData(); goToStep(1); });
    document.getElementById('nextToStep3')?.addEventListener('click',()=>{
      saveManualFormData();
      if(!manualAppointmentData.selectedDate||isDayClosed(manualAppointmentData.selectedDate)){ showToast('اختر تاريخ صحيح','error'); return; }
      goToStep(3);
    });
    document.getElementById('backToStep2')?.addEventListener('click',()=>{ saveManualFormData(); goToStep(2); });
    document.getElementById('submitManualAppointment')?.addEventListener('click',()=>{
      saveManualFormData();
      if(!manualAppointmentData.patientName||!manualAppointmentData.phone||!manualAppointmentData.birthDate||!manualAppointmentData.visitType||!manualAppointmentData.selectedDate){ showToast('بيانات ناقصة','error'); return; }
      const appointment = {
        PatientName: manualAppointmentData.patientName,
        Phone: manualAppointmentData.phone,
        BirthDate: manualAppointmentData.birthDate,
        Address: manualAppointmentData.address,
        Age: calculateAge(manualAppointmentData.birthDate),
        Date: manualAppointmentData.selectedDate,
        Slot: manualAppointmentData.selectedSlot,
        VisitType: manualAppointmentData.visitType,
        Status: 'Accepted',
        DayName: daysAr[parseLocalISODate(manualAppointmentData.selectedDate).getDay()],
        CreatedAt: new Date().toISOString()
      };
      saveAppointment(appointment);
      showToast('تم تسجيل الموعد','success');
      setActiveSection('appointments');
    });

    // ================== Statistics ==================
    function calculateStatsFromPatients() {
      let totalVisits=0, activeCount=0, morningCount=0, eveningCount=0, repeatPatients=0;
      const totalPatients=Object.keys(allPatients).length;
      let allVisits=[];
      Object.values(allPatients).forEach(patient=>{
        totalVisits += patient.totalVisits||0;
        if(patient.totalVisits>1) repeatPatients++;
        if(patient.lastVisit&&patient.lastVisit>=thirtyDaysAgoStr) activeCount++;
        if(patient.appointments){
          patient.appointments.forEach(v=>{
            if(v.slot==='Morning') morningCount++;
            else if(v.slot==='Evening') eveningCount++;
            allVisits.push({patientName:patient.name, date:v.date, visitType:v.visitType});
          });
        }
      });
      allVisits.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      const recentVisits=allVisits.slice(0,30);
      const repeatRate=totalPatients?((repeatPatients/totalPatients)*100).toFixed(1):0;
      return {totalVisits,activeCount,repeatRate,morningCount,eveningCount,recentVisits};
    }
    function calculateCancelledAppointments() {
      return allRecords.filter(r=>r.Status==='Cancelled'||r.Status==='Rejected').length;
    }

    // ── iOS-style donut renderer ──
    const DONUT_C = 389.6; // 2π × 62
    const DONUT_GAP = 8;
    function animateDonut(seg1Id, seg2Id, totalId, legendId, val1, val2, color1, color2, label1, label2, suffix='', animate=true) {
      const total = val1 + val2;
      const seg1El = document.getElementById(seg1Id);
      const seg2El = document.getElementById(seg2Id);
      const totalEl = document.getElementById(totalId);
      const legendEl = document.getElementById(legendId);
      if (!seg1El || !seg2El) return;

      const arc1 = total ? Math.max(0, (val1 / total) * DONUT_C - DONUT_GAP) : 0;
      const arc2 = total ? Math.max(0, (val2 / total) * DONUT_C - DONUT_GAP) : 0;
      const pct1 = total ? ((val1 / total) * 100).toFixed(1) : 0;
      const pct2 = total ? ((val2 / total) * 100).toFixed(1) : 0;

      if (animate) {
        seg1El.setAttribute('stroke-dasharray', '0 ' + DONUT_C);
        seg2El.setAttribute('stroke-dasharray', '0 ' + DONUT_C);
        seg2El.setAttribute('stroke-dashoffset', '0');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          seg1El.setAttribute('stroke-dasharray', `${arc1} ${DONUT_C}`);
          seg2El.setAttribute('stroke-dasharray', `${arc2} ${DONUT_C}`);
          seg2El.setAttribute('stroke-dashoffset', -(arc1 + DONUT_GAP));
        }));
        animateNumber(totalEl, total, suffix, 700);
      } else {
        seg1El.setAttribute('stroke-dasharray', `${arc1} ${DONUT_C}`);
        seg2El.setAttribute('stroke-dasharray', `${arc2} ${DONUT_C}`);
        seg2El.setAttribute('stroke-dashoffset', -(arc1 + DONUT_GAP));
        if (totalEl) totalEl.textContent = total + suffix;
      }

      if (legendEl) {
        legendEl.innerHTML = [
          { color: color1, label: label1, val: val1, pct: pct1 },
          { color: color2, label: label2, val: val2, pct: pct2 }
        ].map((item, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
            opacity:${animate?0:1};transition:opacity .4s ease ${animate?(.55+i*.15):0}s;" class="legend-item">
            <div style="display:flex;align-items:center;gap:9px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${item.color};flex-shrink:0;
                box-shadow:0 0 0 3px ${item.color}28;"></div>
              <span style="font-size:.82rem;font-weight:600;color:var(--text);">${item.label}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:'DM Mono',monospace;font-size:.82rem;font-weight:700;color:var(--text);">${item.val}</span>
              <span style="font-size:.72rem;padding:2px 8px;border-radius:20px;font-weight:700;
                background:${item.color}18;color:${item.color};">${item.pct}%</span>
            </div>
          </div>`).join('');
        if (animate) setTimeout(() => legendEl.querySelectorAll('.legend-item').forEach(el => el.style.opacity='1'), 50);
      }
    }

    function updateStats(useAnimation=true) {
      const stats=calculateStatsFromPatients();
      const cancelled=calculateCancelledAppointments();
      const totalPatientsCount = Object.keys(allPatients).length;
      const activeEl=document.getElementById('statActiveUsers');
      const totalVisitsEl=document.getElementById('statTotalVisits');
      const cancelledEl=document.getElementById('statCancelled');
      const repeatEl=document.getElementById('statConversion');

      if(useAnimation) {
        // ── 1. Stat cards stagger pop-in ──
        document.querySelectorAll('#statsSection .stat-card').forEach((card, i) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(18px) scale(.97)';
          card.style.transition = 'none';
          setTimeout(() => {
            card.style.transition = 'opacity .4s ease, transform .4s cubic-bezier(.34,1.56,.64,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, i * 80);
        });

        // ── 2. Number counters (staggered start) ──
        setTimeout(() => animateNumber(activeEl, totalPatientsCount, '', 700), 100);
        setTimeout(() => animateNumber(totalVisitsEl, stats.totalVisits, '', 700), 180);
        setTimeout(() => animateNumber(cancelledEl, cancelled, '', 700), 260);
        setTimeout(() => animateNumber(repeatEl, parseFloat(stats.repeatRate), '%', 700), 340);

        // ── 3. Donut charts ──
        const C = DONUT_C;
        const GAP = DONUT_GAP;

        // Count booking sources from accepted appointments
        const onlineCount  = allRecords.filter(r => r.Status==='Accepted' && (!r.source || r.source==='online')).length;
        const manualCount  = allRecords.filter(r => r.Status==='Accepted' && r.source==='manual').length;

        const totalSlot = stats.morningCount + stats.eveningCount;

        animateDonut('donut1Seg1','donut1Seg2','donut1Total','donut1Legend',
          stats.morningCount, stats.eveningCount,
          '#f59e0b','#6366f1','صباحي','مسائي');

        setTimeout(() => animateDonut('donut2Seg1','donut2Seg2','donut2Total','donut2Legend',
          onlineCount, manualCount,
          '#22c55e','#f43f5e','أونلاين','يدوي'), 120);

        // ── 4. Recent visits table rows fade in ──
        const tbody = document.getElementById('recentAppointmentsTable');
        const rows = stats.recentVisits.length
          ? stats.recentVisits.map(v => `<tr style="opacity:0;transition:opacity .3s ease, transform .3s ease;transform:translateX(8px);">
              <td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${escapeHtml(v.patientName)}</td>
              <td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${v.visitType||'-'}</td>
              <td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${formatDateAr(v.date)}</td>
            </tr>`).join('')
          : '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--text-muted);">لا توجد زيارات</td></tr>';
        tbody.innerHTML = rows;
        tbody.querySelectorAll('tr').forEach((row, i) => {
          setTimeout(() => { row.style.opacity='1'; row.style.transform='translateX(0)'; }, 400 + i * 40);
        });

        // ── 5. Glass cards (chart + donut + recent) fade up ──
        document.querySelectorAll('#statsSection .glass-card').forEach((card, i) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(14px)';
          card.style.transition = 'none';
          setTimeout(() => {
            card.style.transition = 'opacity .45s ease, transform .45s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 200 + i * 100);
        });

        renderChart(true); // animated chart bars

      } else {
        // No animation (background refresh)
        activeEl.textContent = totalPatientsCount;
        totalVisitsEl.textContent = stats.totalVisits;
        cancelledEl.textContent = cancelled;
        repeatEl.textContent = stats.repeatRate + '%';
        const totalSlot = stats.morningCount + stats.eveningCount;
        const onlineCount2  = allRecords.filter(r => r.Status==='Accepted' && (!r.source || r.source==='online')).length;
        const manualCount2  = allRecords.filter(r => r.Status==='Accepted' && r.source==='manual').length;
        animateDonut('donut1Seg1','donut1Seg2','donut1Total','donut1Legend',
          stats.morningCount, stats.eveningCount, '#f59e0b','#6366f1','صباحي','مسائي','',false);
        animateDonut('donut2Seg1','donut2Seg2','donut2Total','donut2Legend',
          onlineCount2, manualCount2, '#22c55e','#f43f5e','أونلاين','يدوي','',false);
        const tbody = document.getElementById('recentAppointmentsTable');
        tbody.innerHTML = stats.recentVisits.length
          ? stats.recentVisits.map(v => `<tr><td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${escapeHtml(v.patientName)}</td><td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${v.visitType||'-'}</td><td style="padding:7px 8px;border-bottom:1px solid var(--bg);">${formatDateAr(v.date)}</td></tr>`).join('')
          : '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--text-muted);">لا توجد زيارات</td></tr>';
        renderChart(false);
      }
    }
    function animateNumber(element, target, suffix='', duration=700) {
      if(!element) return;
      const isFloat = !Number.isInteger(target);
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        element.textContent = isFloat ? current.toFixed(1) + suffix : Math.floor(current) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else element.textContent = (isFloat ? parseFloat(target).toFixed(1) : target) + suffix;
      };
      requestAnimationFrame(step);
    }
    function renderChart(animate=false) {
      const chartContainer=document.getElementById('appointmentsChart');
      const yAxis=document.getElementById('chartYAxis');
      if(!chartContainer) return;
      const months=monthsAr, weeks=['الأسبوع 1','الأسبوع 2','الأسبوع 3','الأسبوع 4'], days=daysAr;
      let labels=months, data=Array(12).fill(0), periods=[];
      const accepted=allRecords.filter(r=>r.Status==='Accepted');
      const now=new Date(), currentYear=now.getFullYear(), currentMonth=now.getMonth();
      const firstDayOfMonth=new Date(currentYear,currentMonth,1);
      const lastDayOfMonth=new Date(currentYear,currentMonth+1,0);
      const daysInMonth=lastDayOfMonth.getDate();
      if(currentChartPeriod==='weekly'){
        labels=weeks; data=Array(4).fill(0); periods=[];
        for(let week=0;week<4;week++){
          const startDay=week*7+1, endDay=Math.min((week+1)*7,daysInMonth);
          const startDate=toLocalISODate(new Date(currentYear,currentMonth,startDay));
          const endDate=toLocalISODate(new Date(currentYear,currentMonth,endDay));
          periods.push({label:`الأسبوع ${week+1}`,start:startDate,end:endDate});
        }
        accepted.forEach(record=>{
          const recordDate=parseLocalISODate(normalizeDate(record.Date));
          if(recordDate>=firstDayOfMonth&&recordDate<=lastDayOfMonth){
            const day=recordDate.getDate(), weekNum=Math.floor((day-1)/7);
            if(weekNum>=0&&weekNum<4) data[weekNum]++;
          }
        });
      } else if(currentChartPeriod==='daily'){
        labels=days; data=Array(7).fill(0); periods=[];
        const firstDayOfWeek=new Date(now); firstDayOfWeek.setDate(now.getDate()-now.getDay()); firstDayOfWeek.setHours(0,0,0,0);
        for(let d=0;d<7;d++){
          const dayDate=new Date(firstDayOfWeek); dayDate.setDate(firstDayOfWeek.getDate()+d);
          periods.push({label:daysAr[d],date:toLocalISODate(dayDate)});
        }
        accepted.forEach(record=>{
          const recordDate=parseLocalISODate(normalizeDate(record.Date));
          const diffDays=Math.floor((recordDate-firstDayOfWeek)/(1000*60*60*24));
          if(diffDays>=0&&diffDays<7) data[diffDays]++;
        });
      } else {
        labels=months; data=Array(12).fill(0); periods=months.map((m,idx)=>({label:m,month:idx}));
        accepted.forEach(record=>{ const month=parseLocalISODate(normalizeDate(record.Date)).getMonth(); data[month]++; });
      }
      const maxValue=Math.max(...data,1);
      yAxis.innerHTML='';
      for(let i=5;i>=0;i--){
        const value=Math.round((maxValue/5)*i);
        yAxis.innerHTML+=`<span class="y-value">${value}</span>`;
      }
      chartContainer.innerHTML=labels.map((label,index)=>{
        const height=(data[index]/maxValue)*190;
        const isMax = data[index]===maxValue && data[index]>0;
        const barStyle = isMax
          ? 'background:linear-gradient(180deg,#f59e0b,#d97706);box-shadow:0 0 12px rgba(245,158,11,.45);'
          : 'background:linear-gradient(180deg,var(--primary),var(--primary-hover));';
        const animStyle = animate ? `height:0px;transition:height .6s cubic-bezier(.4,0,.2,1) ${index*40}ms;` : `height:${height}px;`;
        return `<div class="chart-bar-group" onclick="showColumnDetails(${index})">
          <div class="chart-bar" style="${animStyle}${barStyle}" data-h="${height}"></div>
          <span class="chart-label">${label.substring(0,3)}</span>
        </div>`;
      }).join('');
      if (animate) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          chartContainer.querySelectorAll('.chart-bar').forEach(bar => {
            bar.style.height = bar.dataset.h + 'px';
          });
        }));
      }
      window.__chartData={periods,data,currentChartPeriod};
    }

    window.showColumnDetails=function(index){
      const chartData=window.__chartData; if(!chartData) return;
      const period=chartData.periods[index]; if(!period) return;
      let total=0,morning=0,evening=0,cancelledCount=0;
      const accepted=allRecords.filter(r=>r.Status==='Accepted');
      const cancelled=allRecords.filter(r=>r.Status==='Cancelled'||r.Status==='Rejected');
      let title='';
      if(chartData.currentChartPeriod==='monthly'){
        const month=period.month;
        total=accepted.filter(r=>parseLocalISODate(normalizeDate(r.Date)).getMonth()===month).length;
        morning=accepted.filter(r=>parseLocalISODate(normalizeDate(r.Date)).getMonth()===month&&(r.Slot||'Morning')==='Morning').length;
        evening=accepted.filter(r=>parseLocalISODate(normalizeDate(r.Date)).getMonth()===month&&(r.Slot||'Evening')==='Evening').length;
        cancelledCount=cancelled.filter(r=>parseLocalISODate(normalizeDate(r.Date)).getMonth()===month).length;
        title=`تفاصيل شهر ${period.label}`;
      } else if(chartData.currentChartPeriod==='weekly'){
        const start=period.start, end=period.end;
        total=accepted.filter(r=>normalizeDate(r.Date)>=start&&normalizeDate(r.Date)<=end).length;
        morning=accepted.filter(r=>normalizeDate(r.Date)>=start&&normalizeDate(r.Date)<=end&&(r.Slot||'Morning')==='Morning').length;
        evening=accepted.filter(r=>normalizeDate(r.Date)>=start&&normalizeDate(r.Date)<=end&&(r.Slot||'Evening')==='Evening').length;
        cancelledCount=cancelled.filter(r=>normalizeDate(r.Date)>=start&&normalizeDate(r.Date)<=end).length;
        title=`تفاصيل ${period.label}`;
      } else {
        const date=period.date;
        total=accepted.filter(r=>normalizeDate(r.Date)===date).length;
        morning=accepted.filter(r=>normalizeDate(r.Date)===date&&(r.Slot||'Morning')==='Morning').length;
        evening=accepted.filter(r=>normalizeDate(r.Date)===date&&(r.Slot||'Evening')==='Evening').length;
        cancelledCount=cancelled.filter(r=>normalizeDate(r.Date)===date).length;
        title=`تفاصيل ${period.label} ${formatDateAr(date)}`;
      }
      document.getElementById('statInfoTitle').textContent=title;
      document.getElementById('statInfoDescription').innerHTML=`
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:14px;text-align:center;">
            <p style="font-size:.82rem;color:var(--text-muted);">إجمالي المواعيد</p>
            <p style="font-size:2rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;">${total}</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="background:var(--amber-light);border-radius:var(--radius-sm);padding:12px;text-align:center;">
              <p style="font-size:.78rem;color:var(--text-muted);">صباحاً</p>
              <p style="font-size:1.6rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;">${morning}</p>
            </div>
            <div style="background:#eff6ff;border-radius:var(--radius-sm);padding:12px;text-align:center;">
              <p style="font-size:.78rem;color:var(--text-muted);">مساءً</p>
              <p style="font-size:1.6rem;font-weight:800;color:var(--text);font-family:'DM Mono',monospace;">${evening}</p>
            </div>
          </div>
          <div style="background:var(--red-light);border-radius:var(--radius-sm);padding:12px;text-align:center;">
            <p style="font-size:.78rem;color:var(--text-muted);">المواعيد الملغاة</p>
            <p style="font-size:1.6rem;font-weight:800;color:var(--red);font-family:'DM Mono',monospace;">${cancelledCount}</p>
          </div>
        </div>`;
      document.getElementById('statInfoModal').classList.remove('hidden');
    };

    window.updateChartPeriod=function(period){
      currentChartPeriod=period;
      document.querySelectorAll('#statsSection .card-actions .card-btn').forEach(btn=>btn.classList.remove('active'));
      event.target.classList.add('active');
      renderChart(true);
    };

    window.showStatInfo=function(type){
      const titleMap={active:'المرضى النشطين',totalPatients:'إجمالي المرضى',total:'إجمالي الزيارات',cancelled:'المواعيد الملغاة',repeat:'نسبة التكرار'};
      const descMap={active:'عدد المرضى الذين قاموا بزيارة واحدة على الأقل خلال آخر 30 يوم.',totalPatients:'إجمالي عدد المرضى المسجلين في دفتر المرضى.',total:'مجموع كل الزيارات المسجلة في دفتر المرضى.',cancelled:'عدد المواعيد التي تم إلغاؤها أو رفضها.',repeat:'النسبة المئوية للمرضى الذين زاروا العيادة أكثر من مرة.'};
      document.getElementById('statInfoTitle').textContent=titleMap[type]||'معلومات';
      document.getElementById('statInfoDescription').innerHTML=`<p style="color:var(--text-2);line-height:1.7;">${descMap[type]||''}</p>`;
      document.getElementById('statInfoModal').classList.remove('hidden');
    };
    window.closeStatInfoModal=function(){ document.getElementById('statInfoModal').classList.add('hidden'); };

    window.showDayDetails=function(){
      if(!selectedDayStr) return;
      const isPast = selectedDayStr < todayStr;
      const dateStr = selectedDayStr;
      let total, morningCount, eveningCount, cancelled;
      if (isPast) {
        const visits   = getPastDayVisits(dateStr);
        const noShow   = allRecords.filter(r => r.Status==='NoShow'   && normalizeDate(r.Date)===dateStr);
        const cancelRec= allRecords.filter(r => (r.Status==='Cancelled'||r.Status==='Rejected') && normalizeDate(r.Date)===dateStr);
        total        = visits.length + noShow.length + cancelRec.length;
        morningCount = visits.filter(v => (v.slot||'').toLowerCase() !== 'evening').length +
                       noShow.filter(r => (r.Slot||'Morning')==='Morning').length +
                       cancelRec.filter(r => (r.Slot||'Morning')==='Morning').length;
        eveningCount = visits.filter(v => (v.slot||'').toLowerCase() === 'evening').length +
                       noShow.filter(r => r.Slot==='Evening').length +
                       cancelRec.filter(r => r.Slot==='Evening').length;
        cancelled    = cancelRec.length;
      } else {
        const accepted = allRecords.filter(r => r.Status==='Accepted'  && normalizeDate(r.Date)===dateStr);
        const visitedR = allRecords.filter(r => r.Status==='Visited'   && normalizeDate(r.Date)===dateStr);
        const cancelRec= allRecords.filter(r => (r.Status==='Cancelled'||r.Status==='Rejected') && normalizeDate(r.Date)===dateStr);
        total        = accepted.length + visitedR.length + cancelRec.length;
        morningCount = accepted.filter(r => (r.Slot||'Morning')==='Morning').length +
                       visitedR.filter(r => (r.Slot||'Morning')==='Morning').length +
                       cancelRec.filter(r => (r.Slot||'Morning')==='Morning').length;
        eveningCount = accepted.filter(r => r.Slot==='Evening').length +
                       visitedR.filter(r => r.Slot==='Evening').length +
                       cancelRec.filter(r => r.Slot==='Evening').length;
        cancelled    = cancelRec.length;
      }
      document.getElementById('dayDetailsTitle').textContent = `تفاصيل ${formatDateAr(dateStr)}`;
      document.getElementById('dayDetailsContent').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:14px;text-align:center;">
            <p style="font-size:.82rem;color:var(--text-muted);">${isPast?'إجمالي الزيارات':'إجمالي المواعيد'}</p>
            <p style="font-size:2rem;font-weight:800;font-family:'DM Mono',monospace;">${total}</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="background:var(--amber-light);border-radius:var(--radius-sm);padding:12px;text-align:center;">
              <p style="font-size:.78rem;color:var(--text-muted);">صباحاً</p>
              <p style="font-size:1.6rem;font-weight:800;font-family:'DM Mono',monospace;">${morningCount}</p>
            </div>
            <div style="background:#eff6ff;border-radius:var(--radius-sm);padding:12px;text-align:center;">
              <p style="font-size:.78rem;color:var(--text-muted);">مساءً</p>
              <p style="font-size:1.6rem;font-weight:800;font-family:'DM Mono',monospace;">${eveningCount}</p>
            </div>
          </div>
          <div style="background:var(--red-light);border-radius:var(--radius-sm);padding:12px;text-align:center;">
            <p style="font-size:.78rem;color:var(--text-muted);">الملغاة / المرفوضة</p>
            <p style="font-size:1.6rem;font-weight:800;color:var(--red);font-family:'DM Mono',monospace;">${cancelled}</p>
          </div>
        </div>`;
      document.getElementById('dayDetailsModal').classList.remove('hidden');
    };
    window.closeDayDetailsModal=function(){ document.getElementById('dayDetailsModal').classList.add('hidden'); };

    // ================== DOMContentLoaded ==================
    document.addEventListener('DOMContentLoaded',()=>{
      initializeFirebaseData();
      applySettings();
      setActiveSection('calendar');
      document.getElementById('nurseHeaderDate').textContent = today.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

      // Nav listeners
      // sidebarAppointments يستخدم onclick مباشرة الآن
      document.getElementById('sidebarPatients').addEventListener('click',()=>setActiveSection('patients'));
      document.getElementById('sidebarCalendar').addEventListener('click',()=>setActiveSection('calendar'));
      document.getElementById('sidebarStats').addEventListener('click',()=>setActiveSection('stats'));
      // mobileAppointments يستخدم onclick مباشرة الآن
      document.getElementById('mobilePatients').addEventListener('click',()=>setActiveSection('patients'));
      document.getElementById('mobileCalendar').addEventListener('click',()=>setActiveSection('calendar'));
      document.getElementById('mobileStats').addEventListener('click',()=>setActiveSection('stats'));

      document.getElementById('appointmentsPendingTab').addEventListener('click',()=>setAppointmentsTab('pending'));
      document.getElementById('appointmentsAcceptedTab').addEventListener('click',()=>setAppointmentsTab('accepted'));
      document.getElementById('searchInput').addEventListener('input',(e)=>{ searchQuery=e.target.value; renderBothAppointmentColumns(); });

      document.getElementById('addNewPatientBtn').addEventListener('click',()=>document.getElementById('patientBookModal').classList.remove('hidden'));
      document.getElementById('patientBookSearch').addEventListener('input',(e)=>{ patientSearchQuery=e.target.value; renderPatientBook(); });
      document.getElementById('cancelPatientBtn').addEventListener('click',()=>document.getElementById('patientBookModal').classList.add('hidden'));

      document.getElementById('submitPatientBookBtn').addEventListener('click',()=>{
        const name=document.getElementById('patientBookName').value.trim();
        const phone=document.getElementById('patientBookPhone').value.trim();
        const birth=document.getElementById('patientBookBirthDate').value;
        const addr=document.getElementById('patientBookAddress').value.trim();
        const type=document.getElementById('patientBookVisitType').value;
        const slot=document.getElementById('patientBookSlot').value;
        if(!name||!phone||!birth||!type){ showToast('املأ البيانات الأساسية','error'); return; }
        const patientId='p_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
        const newPatient={id:patientId,name,phone,birthDate:birth,address:addr,
          appointments:[{date:todayStr,slot,visitType:type,dayName:daysAr[today.getDay()]}],
          firstVisit:todayStr,lastVisit:todayStr,totalVisits:1};
        savePatient(newPatient);
        document.getElementById('patientBookModal').classList.add('hidden');
        ['patientBookName','patientBookPhone','patientBookBirthDate','patientBookAddress','patientBookVisitType'].forEach(id=>document.getElementById(id).value='');
      });

      document.getElementById('cancelAddVisitBtn').addEventListener('click',()=>document.getElementById('addVisitModal').classList.add('hidden'));
      document.getElementById('submitAddVisitBtn').addEventListener('click',submitAddVisit);

      document.getElementById('prevMonthBtn').addEventListener('click',()=>{ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
      document.getElementById('nextMonthBtn').addEventListener('click',()=>{ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });
      document.getElementById('closeDayIcon').addEventListener('click',()=>closeDay(selectedDayStr));
      document.getElementById('openDayIcon').addEventListener('click',()=>openDay(selectedDayStr));
      document.getElementById('showDayDetailsBtn').addEventListener('click',showDayDetails);

      // Close modals on backdrop click
      ['appointmentDetailsModal','patientDetailsModal','visitManagementModal','addVisitModal',
       'patientBookModal','confirmDeleteModal','statInfoModal','dayDetailsModal','settingsModal'].forEach(id=>{
        document.getElementById(id).addEventListener('click',(e)=>{
          if(e.target.id===id){
            if(id==='appointmentDetailsModal') closeAppointmentDetailsModal();
            else if(id==='patientDetailsModal') closePatientDetailsModal();
            else if(id==='statInfoModal') closeStatInfoModal();
            else if(id==='dayDetailsModal') closeDayDetailsModal();
            else document.getElementById(id).classList.add('hidden');
          }
        });
      });
      document.getElementById('closePatientDetailsModalBtn').addEventListener('click',()=>closePatientDetailsModal());

      // Logo upload
      document.getElementById('logoFileInput').addEventListener('change',function(e){
        const file=e.target.files[0]; if(!file) return;
        if(!file.type.startsWith('image/')){ showToast('الرجاء اختيار ملف صورة','error'); return; }
        if(file.size>2*1024*1024){ showToast('حجم الصورة يجب أن يكون أقل من 2 ميغابايت','error'); return; }
        const reader=new FileReader();
        reader.onload=function(ev){
          settings.logo=ev.target.result;
          const previewImg=document.getElementById('logoPreviewImg');
          const previewIcon=document.getElementById('logoPreviewIcon');
          const removeBtn=document.getElementById('removeLogoBtn');
          previewImg.src=ev.target.result; previewImg.classList.remove('hidden');
          previewIcon.classList.add('hidden'); removeBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      });
    });

    // ================== Manual Form Overlay (desktop) ==================
    let oManualData = { patientName:'', phone:'', birthDate:'', address:'', visitType:'', selectedDate:'', selectedSlot:'Morning', currentStep:1 };

    function openManualFormOverlay() {
      oManualData = { patientName:'', phone:'', birthDate:'', address:'', visitType:'', selectedDate:'', selectedSlot:'Morning', currentStep:1 };
      // Reset fields
      ['oManualPatientName','oManualPhone','oManualBirthDate','oManualAddress'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('oManualVisitType').value = '';
      document.getElementById('oManualDateInput').value = '';
      document.getElementById('oManualDateInput').min = todayStr;
      document.getElementById('oManualDateInput').max = toLocalISODate(maxFutureDate);
      document.getElementById('oManualBirthDate').max = todayStr;
      document.getElementById('oSlotMorning').classList.add('selected');
      document.getElementById('oSlotEvening').classList.remove('selected');
      document.getElementById('oClosedDayWarning').classList.add('hidden');
      oUpdateSummary();
      oGoToStep(1);
      document.getElementById('manualFormOverlay').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeManualFormOverlay() {
      document.getElementById('manualFormOverlay').classList.remove('active');
      document.body.style.overflow = '';
    }

    window.handleOverlayClick = function(e) {
      if (e.target.id === 'manualFormOverlay') closeManualFormOverlay();
    };

    function oGoToStep(step) {
      oManualData.currentStep = step;
      document.querySelectorAll('#manualFormPanel .form-step').forEach(s => s.classList.remove('active'));
      document.getElementById('overlayStep' + step).classList.add('active');
      ['overlayStep1Dot','overlayStep2Dot','overlayStep3Dot'].forEach((id, i) => {
        const dot = document.getElementById(id);
        const wrapper = document.getElementById(id.replace('Dot','Wrapper'));
        const n = i + 1;
        dot.classList.remove('active','completed');
        if(wrapper) wrapper.classList.remove('active','completed');
        if (n < step) { dot.classList.add('completed'); dot.innerHTML = '<i class="fas fa-check" style="font-size:.75rem;"></i>'; if(wrapper) wrapper.classList.add('completed'); }
        else if (n === step) { dot.classList.add('active'); dot.textContent = n; if(wrapper) wrapper.classList.add('active'); }
        else dot.textContent = n;
      });
      // Update connectors
      const c1 = document.getElementById('overlayConnector1');
      const c2 = document.getElementById('overlayConnector2');
      if(c1) c1.classList.toggle('done', step > 1);
      if(c2) c2.classList.toggle('done', step > 2);
    }

    function oUpdateSummary() {
      document.getElementById('oSummaryPatientName').textContent = oManualData.patientName || '-';
      const age = oManualData.birthDate ? calculateAge(oManualData.birthDate) : '-';
      document.getElementById('oSummaryAge').textContent = age !== '-' ? age + ' سنة' : '-';
      document.getElementById('oConfirmPatientName').textContent = oManualData.patientName || '-';
      document.getElementById('oConfirmPhone').textContent       = oManualData.phone || '-';
      document.getElementById('oConfirmVisitType').textContent   = oManualData.visitType || '-';
      document.getElementById('oConfirmDate').textContent        = oManualData.selectedDate ? formatDateAr(oManualData.selectedDate) : '-';
      document.getElementById('oConfirmSlot').textContent        = oManualData.selectedSlot === 'Morning' ? 'صباحاً' : 'مساءً';
    }

    document.addEventListener('DOMContentLoaded', function() {
      // Slot pickers
      document.getElementById('oSlotMorning').addEventListener('click', function() {
        this.classList.add('selected'); document.getElementById('oSlotEvening').classList.remove('selected');
        oManualData.selectedSlot = 'Morning'; oUpdateSummary();
      });
      document.getElementById('oSlotEvening').addEventListener('click', function() {
        this.classList.add('selected'); document.getElementById('oSlotMorning').classList.remove('selected');
        oManualData.selectedSlot = 'Evening'; oUpdateSummary();
      });
      // Live input
      ['oManualPatientName','oManualPhone','oManualBirthDate','oManualAddress'].forEach(id => {
        document.getElementById(id).addEventListener('input', function(e) {
          const map = { oManualPatientName:'patientName', oManualPhone:'phone', oManualBirthDate:'birthDate', oManualAddress:'address' };
          oManualData[map[id]] = e.target.value;
          oUpdateSummary();
        });
      });
      document.getElementById('oManualVisitType').addEventListener('change', function(e) {
        oManualData.visitType = e.target.value; oUpdateSummary();
      });
      document.getElementById('oManualDateInput').addEventListener('change', function(e) {
        oManualData.selectedDate = e.target.value;
        const closed = isDayClosed(oManualData.selectedDate);
        document.getElementById('oClosedDayWarning').classList.toggle('hidden', !closed);
        oUpdateSummary();
      });

      // Step navigation
      document.getElementById('oNextToStep2').addEventListener('click', function() {
        oManualData.patientName = document.getElementById('oManualPatientName').value.trim();
        oManualData.phone       = document.getElementById('oManualPhone').value.trim();
        oManualData.birthDate   = document.getElementById('oManualBirthDate').value;
        oManualData.address     = document.getElementById('oManualAddress').value.trim();
        oManualData.visitType   = document.getElementById('oManualVisitType').value;
        if (!oManualData.patientName || !oManualData.phone || !oManualData.birthDate || !oManualData.visitType) {
          showToast('املأ جميع الحقول', 'error'); return;
        }
        oUpdateSummary(); oGoToStep(2);
      });
      document.getElementById('oBackToStep1').addEventListener('click', () => oGoToStep(1));
      document.getElementById('oNextToStep3').addEventListener('click', function() {
        oManualData.selectedDate = document.getElementById('oManualDateInput').value;
        if (!oManualData.selectedDate) { showToast('اختر تاريخ الموعد', 'error'); return; }
        if (isDayClosed(oManualData.selectedDate)) { showToast('هذا اليوم مغلق للحجز', 'error'); return; }
        oUpdateSummary(); oGoToStep(3);
      });
      document.getElementById('oBackToStep2').addEventListener('click', () => oGoToStep(2));
      document.getElementById('oSubmitManualAppointment').addEventListener('click', function() {
        const phone = normalizePhone(oManualData.phone);
        const appointment = {
          PatientName: oManualData.patientName, Phone: oManualData.phone,
          BirthDate: oManualData.birthDate, Address: oManualData.address,
          VisitType: oManualData.visitType, Date: oManualData.selectedDate,
          Slot: oManualData.selectedSlot, Status: 'Accepted',
          createdAt: new Date().toISOString(), source: 'manual'
        };
        saveAppointment(appointment);
        closeManualFormOverlay();
        showToast('تم تسجيل الموعد بنجاح', 'success');
      });

      // ESC key closes overlay
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeManualFormOverlay();
      });
    });



// ============================================================
// NOTES MODULE (extracted from original HTML)
// ============================================================

  // جلب الملاحظات من Firebase بشكل مستمر
  window.loadNotesData = function(callback) {
    database.ref('notes').once('value')
      .then(snapshot => {
        const notesData = snapshot.val();
        const notes = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);
        callback(notes);
      })
      .catch(error => {
        console.error('❌ خطأ جلب الملاحظات:', error);
        callback([]);
      });
  }

  // حفظ الملاحظات في Firebase
  window.saveNotesData = function(notes, callback) {
    database.ref('notes').set(notes)
      .then(() => {
        console.log('✅ تم حفظ الملاحظات');
        if (callback) callback();
        showToast('تم حفظ الملاحظة بنجاح', 'success');
      })
      .catch(error => {
        console.error('❌ خطأ حفظ الملاحظات:', error);
        showToast('فشل حفظ الملاحظة', 'error');
      });
  }

  window.openNotesOverlay = function() {
    const el = document.getElementById('notesOverlay');
    el.style.display = 'flex';
    // جلب البيانات أولاً ثم عرض الملاحظات
    window.loadNotesData(function(notes) {
      window.renderNotes();
      setTimeout(() => {
        const searchInput = document.getElementById('notesSearchInput');
        if (searchInput) searchInput.focus();
      }, 200);
    });
  };

  window.closeNotesOverlay = function() {
    document.getElementById('notesOverlay').style.display = 'none';
    window.hideAddNoteForm();
  };

  window.showAddNoteForm = function() {
    document.getElementById('addNoteForm').style.display = 'block';
    setTimeout(() => document.getElementById('noteTextInput').focus(), 50);
  };

  window.hideAddNoteForm = function() {
    document.getElementById('addNoteForm').style.display = 'none';
    document.getElementById('noteTextInput').value = '';
  };

  window.saveNote = function() {
    const text = document.getElementById('noteTextInput').value.trim();
    if (!text) {
      showToast('الرجاء إدخال ملاحظة', 'error');
      return;
    }

    window.loadNotesData(function(notes) {
      if (!notes) notes = [];
      const newNote = {
        id: Date.now(),
        text: text,
        pinned: false,
        date: new Date().toLocaleDateString('ar-EG')
      };
      notes.unshift(newNote);

      window.saveNotesData(notes, function() {
        window.hideAddNoteForm();
        window.renderNotes();
      });
    });
  };

  window.togglePin = function(id) {
    window.loadNotesData(function(notes) {
      if (!notes) notes = [];
      const note = notes.find(n => n.id === id);
      if (note) {
        note.pinned = !note.pinned;
        window.saveNotesData(notes, function() {
          window.renderNotes();
        });
      }
    });
  };

  window.deleteNote = function(id) {
    window.loadNotesData(function(notes) {
      if (!notes) notes = [];
      const filteredNotes = notes.filter(n => n.id !== id);
      window.saveNotesData(filteredNotes, function() {
        window.renderNotes();
      });
    });
  };

  window.renderNotes = function() {
    window.loadNotesData(function(notes) {
      if (!notes || !Array.isArray(notes)) notes = [];
      
      const q = (document.getElementById('notesSearchInput')?.value || '').trim().toLowerCase();
      let displayNotes = notes;
      if (q) {
        displayNotes = notes.filter(n => n && n.text && n.text.toLowerCase().includes(q));
      }

      displayNotes.sort((a, b) => {
        if (!a || !b) return 0;
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      });

      const total = notes.length;
      const countLabel = document.getElementById('notesCountLabel');
      if (countLabel) {
        countLabel.textContent = total === 0 ? 'لا توجد ملاحظات' : `${total} ملاحظة`;
      }

      const list = document.getElementById('notesList');
      const empty = document.getElementById('notesEmpty');
      
      if (!list) return;
      
      if (displayNotes.length === 0) {
        list.innerHTML = '';
        if (empty) {
          list.appendChild(empty);
          empty.style.display = 'block';
        }
        return;
      }
      if (empty) empty.style.display = 'none';
      
      list.innerHTML = displayNotes.map(n => {
        if (!n || !n.text) return '';
        return `
          <div class="note-card${n.pinned ? ' pinned' : ''}">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
              <p style="font-size:.88rem; line-height:1.65; color:var(--text); flex:1; white-space:pre-wrap; word-break:break-word;">${escapeHtml(n.text)}</p>
              <div style="display:flex; gap:2px; flex-shrink:0;">
                <button class="note-pin-btn" onclick="togglePin(${n.id})" title="${n.pinned ? 'إلغاء التثبيت' : 'تثبيت'}">${n.pinned ? '📌' : '📍'}</button>
                <button class="note-delete-btn" onclick="deleteNote(${n.id})" title="حذف"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div style="margin-top:8px; font-size:.7rem; color:var(--text-muted);">${n.date || ''}${n.pinned ? ' · <span style="color:#d97706;font-weight:700;">مثبتة</span>' : ''}</div>
          </div>
        `;
      }).join('');
    });
  };

  // استمع للتحديثات المباشرة من Firebase
  database.ref('notes').on('value', (snapshot) => {
    // تحديث الملاحظات عند حدوث أي تغيير
    if (document.getElementById('notesOverlay')?.style.display === 'flex') {
      window.renderNotes();
    }
  });

  // حفظ الملاحظة باستخدام Ctrl+Enter
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeNotesOverlay();
    if (e.key === 'Enter' && e.ctrlKey && document.getElementById('addNoteForm').style.display !== 'none') window.saveNote();
  });

  function escapeHtml(text) { 
    const d = document.createElement('div'); 
    d.textContent = text; 
    return d.innerHTML; 
  }
  

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  hideSplash();
});
