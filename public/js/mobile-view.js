/**
 * Dedicated Mobile View Controller & Renderer Module
 * IT Call Center Analytics Web Application
 * 
 * Special Mobile Features:
 * - 100% full width viewport without horizontal overflow scroll
 * - Mobile Bottom Tab Bar (Dashboard, Team, Charts, Ticket Log)
 * - Mobile Touch Cards for Ticket Logs (replacing wide table scrolling)
 * - Touch-optimized target sizes (min 44px) & safe area spacing
 */

import { getStaffCounts } from './hr-calculator.js';
import { resolveSwipeTab } from '../mobile-navigation.mjs';

export const MobileState = {
  activeTab: 'dashboard', // 'dashboard' | 'hr' | 'charts' | 'log'
  mobilePage: 1,
  pageSize: 20
};

/**
 * Initialize Mobile Navigation & View Container
 */
export function initMobileView(onTabChange) {
  const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
  const mobileLayout = document.getElementById('mobile-layout');
  let gestureStart = null;

  const activateTab = (targetTab) => {
    if (!targetTab || targetTab === MobileState.activeTab) return;
    setMobileTab(targetTab);
    if (typeof onTabChange === 'function') onTabChange(targetTab);
  };

  bottomNavItems.forEach(item => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      activateTab(item.dataset.tab);
    });
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      activateTab(resolveSwipeTab(MobileState.activeTab, event.key === 'ArrowRight' ? -100 : 100, 0));
    });
  });

  mobileLayout?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || event.clientX < 24 || event.clientX > window.innerWidth - 24) return;
    if (event.target.closest('button, a, input, select, textarea, canvas, [data-horizontal-scroll]')) return;
    gestureStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  });
  mobileLayout?.addEventListener('pointerup', (event) => {
    if (!gestureStart || event.pointerId !== gestureStart.pointerId) return;
    const nextTab = resolveSwipeTab(MobileState.activeTab, event.clientX - gestureStart.x, event.clientY - gestureStart.y);
    gestureStart = null;
    activateTab(nextTab);
  });
  mobileLayout?.addEventListener('pointercancel', () => { gestureStart = null; });
}

/**
 * Switch Active Mobile View Tab
 */
export function setMobileTab(tabName) {
  MobileState.activeTab = tabName;

  // Update Nav Item States
  const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
  bottomNavItems.forEach(item => {
    const isActive = item.dataset.tab === tabName;
    item.setAttribute('aria-selected', String(isActive));
    item.tabIndex = isActive ? 0 : -1;
    if (isActive) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle Section Visibility
  const sections = {
    'dashboard': document.getElementById('mobile-section-dashboard'),
    'team': document.getElementById('mobile-section-team'),
    'charts': document.getElementById('mobile-section-charts'),
    'log': document.getElementById('mobile-section-log')
  };

  Object.keys(sections).forEach(key => {
    const el = sections[key];
    if (el) {
      if (key === tabName) {
        el.classList.remove('hidden');
        el.classList.add('animate-fade-in');
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in');
        el.setAttribute('aria-hidden', 'true');
      }
    }
  });

  // Scroll to top of content container smoothly on tab switch
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('app-container')?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

if (typeof window !== 'undefined') {
  window.setMobileTab = setMobileTab;
}

/**
 * Render Mobile Ticket Log List as Compact Touch Cards (Zero Horizontal Overflow)
 */
export function renderMobileLogCards(data, page = 1) {
  MobileState.mobilePage = page;
  const container = document.getElementById('mobileLogContainer');
  const paginationInfo = document.getElementById('mobileLogPageInfo');
  const prevBtn = document.getElementById('mobilePrevBtn');
  const nextBtn = document.getElementById('mobileNextBtn');

  if (!container) return;
  container.replaceChildren();

  if (!data || data.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'glass-card p-6 text-center text-slate-400 text-sm font-medium';
    emptyCard.textContent = 'ไม่พบข้อมูลรายการแจ้งซ่อมในเงื่อนไขนี้';
    container.appendChild(emptyCard);
    
    if (paginationInfo) paginationInfo.textContent = '0 จาก 0 รายการ';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(data.length / MobileState.pageSize);
  MobileState.mobilePage = Math.min(MobileState.mobilePage, totalPages);
  
  const startIndex = (MobileState.mobilePage - 1) * MobileState.pageSize;
  const displayData = data.slice(startIndex, startIndex + MobileState.pageSize);

  const fragment = document.createDocumentFragment();

  displayData.forEach((row, index) => {
    const card = document.createElement('div');
    card.className = 'mobile-log-card animate-fade-in';
    card.style.animationDelay = `${index * 20}ms`;

    const operator = String(row.operator || 'ไม่ระบุชื่อ');
    const avatarLetter = operator.charAt(0) || '?';

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
            <i class="ph ph-calendar-blank mr-0.5"></i> ${row.date || '-'}
          </span>
          <span class="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
            <i class="ph ph-clock mr-0.5"></i> ${row.time || '-'}
          </span>
        </div>
        <span class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
          ${row.type || 'ทั่วไป'}
        </span>
      </div>

      <div class="text-slate-800 font-medium text-sm mb-3.5 leading-snug">
        ${row.detail || 'ไม่มีรายละเอียด'}
      </div>

      <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div class="flex items-center gap-1.5 text-slate-600">
          <i class="ph ph-buildings text-slate-400 text-sm"></i>
          <span class="font-medium">${row.dept || 'ไม่ระบุแผนก'}</span>
        </div>
        
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center text-[10px] font-bold uppercase shadow-sm">
            ${avatarLetter}
          </div>
          <span class="font-semibold text-slate-700">${operator}</span>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);

  // Update Pagination Controls
  const start = startIndex + 1;
  const end = Math.min(startIndex + MobileState.pageSize, data.length);

  if (paginationInfo) paginationInfo.textContent = `${start}-${end} จาก ${data.length} รายการ (หน้า ${MobileState.mobilePage}/${totalPages})`;
  if (prevBtn) prevBtn.disabled = MobileState.mobilePage === 1;
  if (nextBtn) nextBtn.disabled = MobileState.mobilePage === totalPages;
}

/**
 * Render Mobile HR Workload Cards
 */
export function renderMobileHRReport(data, activeMonthDisplay) {
  const container = document.getElementById('mobileHRContainer');
  const subtitle = document.getElementById('mobileHRSubtitle');
  if (!container) return;

  container.replaceChildren();
  if (subtitle) {
    subtitle.textContent = `${activeMonthDisplay} (รวม ${data.length} เคส)`;
  }

  if (!data || data.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'glass-card p-6 text-center text-slate-400 text-sm font-medium';
    emptyCard.textContent = 'ไม่มีข้อมูลในเดือนนี้';
    container.appendChild(emptyCard);
    return;
  }

  const sortedStaff = Object.entries(getStaffCounts(data)).sort((a, b) => b[1] - a[1]);
  const totalTickets = data.length;
  const fragment = document.createDocumentFragment();

  sortedStaff.forEach(([name, count], index) => {
    const percentage = ((count / totalTickets) * 100).toFixed(1);
    const card = document.createElement('div');
    card.className = 'glass-card p-4 mb-3 border-l-4 border-l-rose-500 flex flex-col gap-2 animate-fade-in';

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold font-mono">
            ${index + 1}
          </span>
          <span class="font-bold text-slate-800 text-base">${name}</span>
        </div>
        <div class="text-right">
          <span class="text-rose-600 font-bold text-lg font-mono">${count}</span>
          <span class="text-xs text-slate-500"> เคส</span>
        </div>
      </div>

      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
        <div class="bg-rose-400 h-full rounded-full" style="width: ${percentage}%"></div>
      </div>

      <div class="text-right text-xs text-slate-500 font-mono">
        คิดเป็น ${percentage}% ของเคสทั้งหมด
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

/**
 * Mobile view layout setup check
 */
export function isMobileScreen() {
  return window.innerWidth < 1280;
}
