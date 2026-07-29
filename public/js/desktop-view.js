/**
 * Desktop View UI Renderer Module
 * IT Call Center Analytics Web Application
 */

import { getStaffCounts } from './hr-calculator.js';

const PAGE_SIZE = 100;
let currentPage = 1;

function appendTextCell(row, className, value, tagName = 'td') {
  const cell = document.createElement(tagName);
  cell.className = className;
  cell.textContent = value;
  row.appendChild(cell);
  return cell;
}

export function updateDesktopMetrics(data) {
  const totalEls = [document.getElementById('totalTickets'), document.getElementById('mobileTotalTickets')];
  totalEls.forEach(el => {
    if (el) {
      el.style.opacity = '0.5';
      setTimeout(() => {
        el.textContent = data.length;
        el.style.opacity = '1';
      }, 150);
    }
  });

  const topDeptEls = [document.getElementById('topDept'), document.getElementById('mobileTopDept')];
  const topStaffEls = [document.getElementById('topStaff'), document.getElementById('mobileTopStaff')];

  if (!data || data.length === 0) {
    topDeptEls.forEach(el => { if (el) el.textContent = "-"; });
    topStaffEls.forEach(el => { if (el) el.textContent = "-"; });
    return;
  }

  const deptCounts = data.reduce((acc, curr) => {
    if (curr.dept) acc[curr.dept] = (acc[curr.dept] || 0) + 1;
    return acc;
  }, {});
  const topDept = Object.keys(deptCounts).length > 0 
    ? Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b, "-") 
    : "-";
  topDeptEls.forEach(el => { if (el) el.textContent = topDept; });

  const staffCounts = data.reduce((acc, curr) => {
    if (curr.operator) acc[curr.operator] = (acc[curr.operator] || 0) + 1;
    return acc;
  }, {});
  const topStaff = Object.keys(staffCounts).length > 0 
    ? Object.keys(staffCounts).reduce((a, b) => staffCounts[a] > staffCounts[b] ? a : b, "-") 
    : "-";
  topStaffEls.forEach(el => { if (el) el.textContent = topStaff; });
}

export function renderDesktopHRReport(data, activeMonthDisplay) {
  const tbody = document.getElementById('hrTableBody');
  const subtitle = document.getElementById('hrReportSubtitle');
  if (!tbody) return;

  tbody.replaceChildren();
  if (subtitle) {
    subtitle.textContent = `ข้อมูล: ${activeMonthDisplay} | ยอดรวมทั้งหมด ${data.length} รายการ`;
  }

  if (data.length === 0) {
    const row = document.createElement('tr');
    appendTextCell(row, 'text-center py-8 text-slate-400', 'ไม่มีข้อมูลในเดือนหรือคำค้นหานี้');
    row.firstChild.colSpan = 4;
    tbody.appendChild(row);
    const hrTotal = document.getElementById('hrTotal');
    if (hrTotal) hrTotal.textContent = '0';
    return;
  }

  const sortedStaff = Object.entries(getStaffCounts(data)).sort((a, b) => b[1] - a[1]);
  const totalTickets = data.length;
  const fragment = document.createDocumentFragment();

  sortedStaff.forEach(([name, count], index) => {
    const percentage = ((count / totalTickets) * 100).toFixed(1);
    const row = document.createElement('tr');
    row.className = 'hover:bg-rose-50/50 transition-colors border-b border-slate-100';
    appendTextCell(row, 'px-6 py-3.5 text-slate-500 font-mono', index + 1);

    const nameCell = document.createElement('td');
    nameCell.className = 'px-6 py-3.5 font-bold text-slate-800';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'flex items-center gap-2.5';
    const avatar = document.createElement('div');
    avatar.className = 'w-7 h-7 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shadow-sm';
    avatar.textContent = name.charAt(0);
    const nameText = document.createElement('span');
    nameText.textContent = name;
    nameWrap.append(avatar, nameText);
    nameCell.appendChild(nameWrap);
    row.appendChild(nameCell);

    appendTextCell(row, 'px-6 py-3.5 text-right font-bold text-rose-600 text-base', count);

    const percentageCell = document.createElement('td');
    percentageCell.className = 'px-6 py-3.5 text-right';
    const percentageWrap = document.createElement('div');
    percentageWrap.className = 'flex items-center justify-end gap-3';
    const percentageText = document.createElement('span');
    percentageText.className = 'text-slate-500 text-xs font-mono w-12';
    percentageText.textContent = `${percentage}%`;
    const track = document.createElement('div');
    track.className = 'w-20 h-2 bg-slate-100 rounded-full overflow-hidden';
    const bar = document.createElement('div');
    bar.className = 'h-full bg-rose-400 rounded-full';
    bar.style.width = `${percentage}%`;
    track.appendChild(bar);
    percentageWrap.append(percentageText, track);
    percentageCell.appendChild(percentageWrap);
    row.appendChild(percentageCell);
    fragment.appendChild(row);
  });

  tbody.appendChild(fragment);
  const hrTotal = document.getElementById('hrTotal');
  if (hrTotal) hrTotal.textContent = totalTickets;
}

export function renderDesktopTable(data, page = 1) {
  currentPage = page;
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.replaceChildren();

  if (!data || data.length === 0) {
    const row = document.createElement('tr');
    appendTextCell(row, 'text-center py-8 text-slate-400', 'ไม่พบข้อมูลในเดือนหรือคำค้นหานี้');
    row.firstChild.colSpan = 6;
    tbody.appendChild(row);
    renderDesktopPagination(0);
    return;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayData = data.slice(startIndex, startIndex + PAGE_SIZE);
  const fragment = document.createDocumentFragment();

  displayData.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-blue-50/50 transition-colors group border-b border-slate-100';
    tr.style.animation = `fadeInUp 0.3s ease forwards ${index * 15}ms`;
    tr.style.opacity = '0';

    // Date
    const dateCell = document.createElement('td');
    dateCell.className = 'px-6 py-3.5 whitespace-nowrap';
    const dateWrap = document.createElement('div');
    dateWrap.className = 'flex items-center gap-2 font-medium text-slate-700';
    const dateIcon = document.createElement('i');
    dateIcon.className = 'ph ph-calendar-blank text-slate-400 group-hover:text-blue-500 transition-colors';
    const dateText = document.createElement('span');
    dateText.textContent = row.date || '-';
    dateWrap.append(dateIcon, dateText);
    dateCell.appendChild(dateWrap);
    tr.appendChild(dateCell);

    // Time
    const timeCell = document.createElement('td');
    timeCell.className = 'px-6 py-3.5 whitespace-nowrap';
    const timeBadge = document.createElement('span');
    timeBadge.className = 'bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono shadow-sm';
    timeBadge.textContent = row.time || '-';
    timeCell.appendChild(timeBadge);
    tr.appendChild(timeCell);

    // Detail
    appendTextCell(tr, 'px-6 py-3.5 font-medium text-slate-800 max-w-xs truncate', row.detail || '-');

    // Type
    const typeCell = document.createElement('td');
    typeCell.className = 'px-6 py-3.5';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold';
    typeBadge.textContent = row.type || '-';
    typeCell.appendChild(typeBadge);
    tr.appendChild(typeCell);

    // Department
    appendTextCell(tr, 'px-6 py-3.5 font-medium text-slate-600', row.dept || '-');

    // Operator
    const operatorCell = document.createElement('td');
    operatorCell.className = 'px-6 py-3.5';
    const operatorWrap = document.createElement('div');
    operatorWrap.className = 'flex items-center gap-2.5';
    const avatar = document.createElement('div');
    avatar.className = 'w-7 h-7 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm';
    const operator = String(row.operator || '-');
    avatar.textContent = operator.charAt(0) || '?';
    const operatorText = document.createElement('span');
    operatorText.className = 'font-medium text-slate-700';
    operatorText.textContent = operator;
    operatorWrap.append(avatar, operatorText);
    operatorCell.appendChild(operatorWrap);
    tr.appendChild(operatorCell);

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
  renderDesktopPagination(data.length);
}

function renderDesktopPagination(totalRecords) {
  const pagination = document.getElementById('tablePagination');
  const info = document.getElementById('tableRecordInfo');
  const pageInfo = document.getElementById('pageInfo');
  const previous = document.getElementById('prevPageBtn');
  const next = document.getElementById('nextPageBtn');

  if (!pagination) return;

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  if (totalRecords === 0) {
    pagination.classList.add('hidden');
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalRecords);

  if (info) info.textContent = `แสดง ${start}–${end} จาก ${totalRecords} รายการ`;
  if (pageInfo) pageInfo.textContent = `หน้า ${currentPage}/${totalPages}`;
  if (previous) previous.disabled = currentPage === 1;
  if (next) next.disabled = currentPage === totalPages;

  pagination.classList.remove('hidden');
}

export function getCurrentDesktopPage() {
  return currentPage;
}
