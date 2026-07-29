import { fetchJsonWithRetry } from './fetch-resilience.js';

/**
 * IT Call Center Analytics Web Application
 * Complete Self-Contained Controller (Works on HTTP/HTTPS and file:// protocol)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. STATE & CONSTANTS
  // ==========================================================================
  const API_CONFIG = Object.freeze({
    url: '/api/incidents',
    timeoutMs: 50_000,
    autoRefreshMs: 5 * 60 * 1000 // 5 minutes
  });

  const PAYMENT_RULES = Object.freeze({
    basePay: 100,
    telePay: 400,
    generalPay: 200,
    dailyCap: 800
  });

  const TELE_TYPE_KEYS = new Set(['x-ray-tele']);
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const STAFF_COLORS = Object.freeze({
    'กรพี': '#f97316',
    'อธิบดี': '#8b5cf6',
    'อัศวิน': '#0ea5e9',
    'ณภัทร': '#10b981'
  });
  const DEFAULT_PALETTE = ['#ec4899', '#eab308', '#f43f5e', '#84cc16', '#14b8a6', '#64748b'];

  const AppState = {
    rawData: [],
    filteredData: [],
    activeMonthKey: 'all',
    activeMonthDisplay: 'ภาพรวมทั้งหมด (All Time)',
    selectedDept: 'all',
    searchTerm: '',
    isFetching: false,
    fetchError: null,
    lastUpdated: null,
    onDataUpdatedCallbacks: []
  };

  const MobileState = {
    activeTab: 'dashboard',
    mobilePage: 1,
    pageSize: 20
  };

  let desktopCurrentPage = 1;
  const DESKTOP_PAGE_SIZE = 100;
  let searchDebounceTimer = null;
  const chartInstances = {};

  // ==========================================================================
  // 2. HELPER FUNCTIONS
  // ==========================================================================
  function onDataUpdated(callback) {
    if (typeof callback === 'function') {
      AppState.onDataUpdatedCallbacks.push(callback);
    }
  }

  function notifyDataUpdated() {
    AppState.onDataUpdatedCallbacks.forEach(cb => cb(AppState));
  }

  function parseDate(value) {
    const text = String(value ?? '').trim();
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;

    const [, dayText, monthText, yearText] = match;
    const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
    return date.getFullYear() === Number(yearText) &&
           date.getMonth() === Number(monthText) - 1 &&
           date.getDate() === Number(dayText) ? date : null;
  }

  function processRawData(data) {
    const textFields = ['date', 'time', 'detail', 'type', 'dept', 'operator'];
    return data
      .filter(row => row && typeof row === 'object' && !Array.isArray(row))
      .map(source => {
        const row = { ...source };
        textFields.forEach(field => {
          row[field] = row[field] == null ? '' : String(row[field]).trim();
        });

        let parsedDate = null;
        let monthKey = "unknown";
        let monthDisplay = "ไม่ระบุเดือน";
        let dayNum = "0";
        let hourKey = "ไม่ระบุ";

        if (row.date) {
          const parts = String(row.date).split('/');
          parsedDate = parseDate(row.date);
          if (parsedDate && parts.length === 3) {
            const y = parsedDate.getFullYear();
            const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
            monthKey = `${y}-${m}`;
            monthDisplay = `${thaiMonths[parsedDate.getMonth()]} ${y}`;
            dayNum = parts[0];
          }
        }

        if (row.time) {
          const timeParts = String(row.time).trim().split(':');
          const hour = Number(timeParts[0]);
          if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
            hourKey = String(hour).padStart(2, '0') + ":00";
          }
        }

        return {
          ...row,
          _parsedDate: parsedDate,
          _monthKey: monthKey,
          _monthDisplay: monthDisplay,
          _dayNum: dayNum,
          _hourKey: hourKey
        };
      })
      .sort((a, b) => {
        if (!a._parsedDate) return 1;
        if (!b._parsedDate) return -1;
        return b._parsedDate - a._parsedDate;
      });
  }

  function applyDataFilters() {
    const searchLower = AppState.searchTerm.toLowerCase();
    
    AppState.filteredData = AppState.rawData.filter(row => {
      const matchMonth = AppState.activeMonthKey === 'all' || row._monthKey === AppState.activeMonthKey;
      const matchDept = AppState.selectedDept === 'all' || row.dept === AppState.selectedDept;
      
      const matchSearch = !searchLower ||
        (row.detail && row.detail.toLowerCase().includes(searchLower)) ||
        (row.operator && row.operator.toLowerCase().includes(searchLower)) ||
        (row.dept && row.dept.toLowerCase().includes(searchLower));

      return matchMonth && matchDept && matchSearch;
    });

    notifyDataUpdated();
  }

  // ==========================================================================
  // 3. API FETCH SERVICE
  // ==========================================================================
  async function fetchLiveData() {
    if (AppState.isFetching) return;
    
    AppState.isFetching = true;
    AppState.fetchError = null;
    notifyDataUpdated();

    let rawJson = null;

    try {
      rawJson = await fetchJsonWithRetry(API_CONFIG.url, {
        timeoutMs: API_CONFIG.timeoutMs,
        attempts: 2
      });

    } catch (directError) {
      console.warn("Direct fetch error:", directError);
      AppState.fetchError = directError.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      AppState.isFetching = false;
      notifyDataUpdated();
      throw directError;
    }

    if (!Array.isArray(rawJson)) {
      const formatErr = new Error('รูปแบบข้อมูล API ไม่ถูกต้อง');
      AppState.fetchError = formatErr.message;
      AppState.isFetching = false;
      notifyDataUpdated();
      throw formatErr;
    }

    AppState.rawData = processRawData(rawJson);
    AppState.lastUpdated = new Date();
    AppState.fetchError = null;
    applyDataFilters();
    
    AppState.isFetching = false;
    notifyDataUpdated();
  }

  function startAutoRefresh() {
    window.setInterval(() => {
      fetchLiveData().catch(() => undefined);
    }, API_CONFIG.autoRefreshMs);

    window.addEventListener('online', () => {
      fetchLiveData().catch(() => undefined);
    });

    document.addEventListener('visibilitychange', () => {
      const isStale = !AppState.lastUpdated
        || Date.now() - AppState.lastUpdated.getTime() >= API_CONFIG.autoRefreshMs;
      if (document.visibilityState === 'visible' && isStale) {
        fetchLiveData().catch(() => undefined);
      }
    });
  }

  // ==========================================================================
  // 4. HR COMPENSATION & CSV UTILITIES
  // ==========================================================================
  function normalizeType(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function getOperatorName(row) {
    const name = String(row.operator ?? '').trim();
    return name || 'ไม่ระบุชื่อ';
  }

  function getShiftKey(row) {
    const explicitShiftId = row.shiftId ?? row.shift_id ?? row.shift;
    return explicitShiftId ? `shift:${String(explicitShiftId).trim()}` : `date:${String(row.date ?? '').trim() || 'ไม่ระบุวัน'}`;
  }

  function isTeleCase(row) {
    return TELE_TYPE_KEYS.has(normalizeType(row.type));
  }

  function getStaffCounts(data) {
    return data.reduce((counts, row) => {
      const name = getOperatorName(row);
      counts[name] = (counts[name] || 0) + 1;
      return counts;
    }, {});
  }

  function escapeCsvCell(value) {
    let text = String(value ?? '');
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function toCsvRow(values) {
    return values.map(escapeCsvCell).join(',');
  }

  function downloadCsvFile(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportHRCompensationCSV(filteredData, monthDisplayKey) {
    if (!filteredData || filteredData.length === 0) {
      throw new Error("ไม่มีข้อมูลสำหรับคำนวณ");
    }

    const staffWork = {};

    filteredData.forEach(row => {
      const operator = getOperatorName(row);
      const date = String(row.date ?? '').trim() || "ไม่ระบุวัน";
      const shiftKey = getShiftKey(row);
      const isTele = isTeleCase(row);

      if (!staffWork[operator]) staffWork[operator] = {};
      if (!staffWork[operator][shiftKey]) {
        staffWork[operator][shiftKey] = { date, parsedDate: row._parsedDate, tele: 0, general: 0 };
      }

      if (isTele) {
        staffWork[operator][shiftKey].tele += 1;
      } else {
        staffWork[operator][shiftKey].general += 1;
      }
    });

    let csvContent = "\uFEFF"; 
    csvContent += `รายงานคำนวณค่าตอบแทน On-call: ${monthDisplayKey}\n`;
    csvContent += "กฎการคำนวณ:,1. On-call พื้นฐาน 100/เวร,2. ตามระบบ Tele 400/ครั้ง,3. ทั่วไป 200/ครั้ง,(ลิมิตรวมไม่เกิน 800/เวร)\n\n";
    csvContent += "ผู้ปฏิบัติงาน,วันที่เข้าเวร,จำนวนเคส Tele (400),จำนวนเคสทั่วไป (200),ค่าเวรพื้นฐาน,รายได้รวม,ยอดเงินสุทธิ (หักลิมิตแล้ว)\n";

    let grandTotal = 0;

    Object.keys(staffWork).sort().forEach(operator => {
      const shifts = Object.values(staffWork[operator]).sort((a, b) => {
        const aTime = a.parsedDate ? a.parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.parsedDate ? b.parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime || a.date.localeCompare(b.date, 'th');
      });

      let operatorTotal = 0;
      let opTele = 0;
      let opGeneral = 0;
      let opShifts = 0;

      shifts.forEach(work => {
        const basePay = PAYMENT_RULES.basePay;
        const telePay = work.tele * PAYMENT_RULES.telePay;
        const generalPay = work.general * PAYMENT_RULES.generalPay;
        
        const dayTotalRaw = basePay + telePay + generalPay;
        const dayTotalCapped = Math.min(dayTotalRaw, PAYMENT_RULES.dailyCap);
        
        csvContent += toCsvRow([operator, work.date, work.tele, work.general, basePay, dayTotalRaw, dayTotalCapped]) + '\n';
        
        operatorTotal += dayTotalCapped;
        opTele += work.tele;
        opGeneral += work.general;
        opShifts += 1;
      });
      
      csvContent += toCsvRow([`สรุปยอดคุณ ${operator}`, `รวม ${opShifts} เวร`, opTele, opGeneral, '-', '', operatorTotal]) + '\n';
      csvContent += '\n';
      grandTotal += operatorTotal;
    });

    csvContent += '\n' + toCsvRow(['ยอดรวมค่าตอบแทนทั้งแผนก', '', '', '', '', '', grandTotal]) + '\n';

    const safeFileNameMonth = monthDisplayKey === 'all' ? 'All_Time' : monthDisplayKey;
    downloadCsvFile(csvContent, `HR_Payment_Report_${safeFileNameMonth}.csv`);
  }

  function exportRawCSV(filteredData, monthDisplayKey) {
    if (!filteredData || filteredData.length === 0) {
      throw new Error("ไม่มีข้อมูลสำหรับส่งออก");
    }

    let csvContent = "\uFEFF";
    csvContent += toCsvRow(['วันที่', 'เวลา', 'ผู้ปฏิบัติงาน', 'รายละเอียดปัญหา', 'ประเภท', 'แผนก']) + '\n';
    
    filteredData.forEach(row => {
      csvContent += toCsvRow([row.date, row.time, row.operator, row.detail, row.type, row.dept]) + '\n';
    });

    const safeMonth = monthDisplayKey === 'all' ? 'All_Time' : monthDisplayKey;
    downloadCsvFile(csvContent, `IT_Call_Log_${safeMonth}.csv`);
  }

  function copyHRReportText(filteredData, monthDisplay) {
    if (!filteredData || filteredData.length === 0) {
      return Promise.reject(new Error("ไม่มีข้อมูลให้คัดลอก"));
    }

    let textToCopy = `สรุปยอดภาระงานรายบุคคล - ${monthDisplay}\n\n`;
    textToCopy += "ลำดับ\tผู้ปฏิบัติงาน\tจำนวนเคสที่รับ\tสัดส่วน(%)\n";

    const sortedStaff = Object.entries(getStaffCounts(filteredData)).sort((a, b) => b[1] - a[1]);
    sortedStaff.forEach(([name, count], index) => {
      const percent = ((count / filteredData.length) * 100).toFixed(1);
      textToCopy += `${index + 1}\t${name}\t${count}\t${percent}%\n`;
    });

    textToCopy += `\nรวมทั้งหมด\t\t${filteredData.length}\t100%\n`;

    return navigator.clipboard.writeText(textToCopy);
  }

  // ==========================================================================
  // 5. CHART.JS MANAGER
  // ==========================================================================
  function renderDailyChart(canvasId, data, activeMonthKey) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let labels = [];
    let dataPoints = [];

    if (activeMonthKey && activeMonthKey !== 'all') {
      const [year, month] = activeMonthKey.split('-');
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      
      const dailyCounts = new Array(daysInMonth).fill(0);
      data.forEach(row => {
        if (row._dayNum) {
          const dayIndex = parseInt(row._dayNum, 10) - 1;
          if (dayIndex >= 0 && dayIndex < daysInMonth) {
            dailyCounts[dayIndex]++;
          }
        }
      });
      dataPoints = dailyCounts;
    } else {
      const dailyCounts = {};
      const sortedForLine = [...data].reverse();
      sortedForLine.forEach(row => {
        if (row.date) dailyCounts[row.date] = (dailyCounts[row.date] || 0) + 1;
      });
      labels = Object.keys(dailyCounts).slice(-30);
      dataPoints = Object.values(dailyCounts).slice(-30);
    }

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].data.labels = labels;
      chartInstances[canvasId].data.datasets[0].data = dataPoints;
      chartInstances[canvasId].update();
    } else {
      chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'จำนวนปัญหา',
            data: dataPoints,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              padding: 10,
              cornerRadius: 8,
              titleFont: { family: 'Kanit' },
              bodyFont: { family: 'Sarabun' }
            }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { color: '#64748b' }, grid: { display: false } }
          }
        }
      });
    }
  }

  function renderTimeChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const timeCounts = data.reduce((acc, curr) => {
      if (curr._hourKey !== "ไม่ระบุ") {
        acc[curr._hourKey] = (acc[curr._hourKey] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedTimes = Object.keys(timeCounts).sort();
    const timeLabels = sortedTimes;
    const timeData = sortedTimes.map(key => timeCounts[key]);

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].data.labels = timeLabels;
      chartInstances[canvasId].data.datasets[0].data = timeData;
      chartInstances[canvasId].update();
    } else {
      chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'จำนวนปัญหา',
            data: timeData,
            backgroundColor: 'rgba(244, 63, 94, 0.8)',
            hoverBackgroundColor: 'rgba(225, 29, 72, 1)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutBounce' },
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { maxRotation: 45, minRotation: 45, color: '#64748b' }, grid: { display: false } }
          }
        }
      });
    }
  }

  function renderDeptChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const deptCounts = data.reduce((acc, curr) => {
      if (curr.dept) acc[curr.dept] = (acc[curr.dept] || 0) + 1;
      return acc;
    }, {});

    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const deptLabels = sortedDepts.map(item => item[0]);
    const deptData = sortedDepts.map(item => item[1]);

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].data.labels = deptLabels;
      chartInstances[canvasId].data.datasets[0].data = deptData;
      chartInstances[canvasId].update();
    } else {
      chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: deptLabels,
          datasets: [{
            label: 'จำนวน Ticket',
            data: deptData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutBounce' },
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { color: '#64748b' }, grid: { display: false } }
          }
        }
      });
    }
  }

  function renderStaffChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const staffCounts = data.reduce((acc, curr) => {
      if (curr.operator) acc[curr.operator] = (acc[curr.operator] || 0) + 1;
      return acc;
    }, {});

    const staffLabels = Object.keys(staffCounts);
    const staffData = Object.values(staffCounts);

    const staffColors = staffLabels.map((name, i) => {
      const n = name.toLowerCase();
      for (const [key, color] of Object.entries(STAFF_COLORS)) {
        if (n.includes(key.toLowerCase())) return color;
      }
      return DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
    });

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].data.labels = staffLabels;
      chartInstances[canvasId].data.datasets[0].data = staffData;
      chartInstances[canvasId].data.datasets[0].backgroundColor = staffColors;
      chartInstances[canvasId].update();
    } else {
      chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: staffLabels,
          datasets: [{
            data: staffData,
            backgroundColor: staffColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateScale: true, animateRotate: true, duration: 1000 },
          plugins: {
            legend: {
              position: 'right',
              labels: { usePointStyle: true, boxWidth: 8, color: '#475569', font: { family: 'Kanit' } }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  function renderAllCharts(data, activeMonthKey) {
    // Desktop Canvases
    renderDailyChart('dailyChart', data, activeMonthKey);
    renderTimeChart('timeChart', data);
    renderDeptChart('deptChart', data);
    renderStaffChart('staffChart', data);

    // Mobile Canvases
    renderDailyChart('mobileSummaryChart', data, activeMonthKey);
    renderTimeChart('mobileTimeChart', data);
    renderDeptChart('mobileDeptChart', data);
    renderStaffChart('mobileStaffChart', data);
  }

  // ==========================================================================
  // 6. UI RENDERERS (DESKTOP & MOBILE)
  // ==========================================================================
  function appendTextCell(row, className, value, tagName = 'td') {
    const cell = document.createElement(tagName);
    cell.className = className;
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }

  function updateMetrics(data) {
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

  function renderDesktopHRReport(data, activeMonthDisplay) {
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

  function renderDesktopTable(data, page = 1) {
    desktopCurrentPage = page;
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

    const startIndex = (desktopCurrentPage - 1) * DESKTOP_PAGE_SIZE;
    const displayData = data.slice(startIndex, startIndex + DESKTOP_PAGE_SIZE);
    const fragment = document.createDocumentFragment();

    displayData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-blue-50/50 transition-colors group border-b border-slate-100';
      tr.style.animation = `fadeInUp 0.3s ease forwards ${index * 15}ms`;
      tr.style.opacity = '0';

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

      const timeCell = document.createElement('td');
      timeCell.className = 'px-6 py-3.5 whitespace-nowrap';
      const timeBadge = document.createElement('span');
      timeBadge.className = 'bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono shadow-sm';
      timeBadge.textContent = row.time || '-';
      timeCell.appendChild(timeBadge);
      tr.appendChild(timeCell);

      appendTextCell(tr, 'px-6 py-3.5 font-medium text-slate-800 max-w-xs truncate', row.detail || '-');

      const typeCell = document.createElement('td');
      typeCell.className = 'px-6 py-3.5';
      const typeBadge = document.createElement('span');
      typeBadge.className = 'bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold';
      typeBadge.textContent = row.type || '-';
      typeCell.appendChild(typeBadge);
      tr.appendChild(typeCell);

      appendTextCell(tr, 'px-6 py-3.5 font-medium text-slate-600', row.dept || '-');

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

    const totalPages = Math.max(1, Math.ceil(totalRecords / DESKTOP_PAGE_SIZE));
    desktopCurrentPage = Math.min(desktopCurrentPage, totalPages);

    if (totalRecords === 0) {
      pagination.classList.add('hidden');
      return;
    }

    const start = (desktopCurrentPage - 1) * DESKTOP_PAGE_SIZE + 1;
    const end = Math.min(desktopCurrentPage * DESKTOP_PAGE_SIZE, totalRecords);

    if (info) info.textContent = `แสดง ${start}–${end} จาก ${totalRecords} รายการ`;
    if (pageInfo) pageInfo.textContent = `หน้า ${desktopCurrentPage}/${totalPages}`;
    if (previous) previous.disabled = desktopCurrentPage === 1;
    if (next) next.disabled = desktopCurrentPage === totalPages;

    pagination.classList.remove('hidden');
  }

  // Mobile View Renderers
  function setMobileTab(tabName) {
    MobileState.activeTab = tabName;

    const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
    bottomNavItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const sections = {
      'dashboard': document.getElementById('mobile-section-dashboard'),
      'hr': document.getElementById('mobile-section-hr'),
      'charts': document.getElementById('mobile-section-charts'),
      'log': document.getElementById('mobile-section-log')
    };

    Object.keys(sections).forEach(key => {
      const el = sections[key];
      if (el) {
        if (key === tabName) {
          el.classList.remove('hidden');
          el.classList.add('animate-fade-in');
        } else {
          el.classList.add('hidden');
          el.classList.remove('animate-fade-in');
        }
      }
    });

    if (tabName === 'charts') {
      setTimeout(() => renderAllCharts(AppState.filteredData, AppState.activeMonthKey), 50);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.setMobileTab = setMobileTab;

  function renderMobileLogCards(data, page = 1) {
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

    const start = startIndex + 1;
    const end = Math.min(startIndex + MobileState.pageSize, data.length);

    if (paginationInfo) paginationInfo.textContent = `${start}-${end} จาก ${data.length} รายการ (หน้า ${MobileState.mobilePage}/${totalPages})`;
    if (prevBtn) prevBtn.disabled = MobileState.mobilePage === 1;
    if (nextBtn) nextBtn.disabled = MobileState.mobilePage === totalPages;
  }

  function renderMobileHRReport(data, activeMonthDisplay) {
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

  // ==========================================================================
  // 7. ORCHESTRATION & EVENT BINDINGS
  // ==========================================================================
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const msgSpan = toast.querySelector('.toast-message') || toast.querySelector('span');
    if (msgSpan) msgSpan.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function updateHeaderIndicators() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('th-TH', options);
    }

    const updatedEl = document.getElementById('lastUpdated');
    if (updatedEl && AppState.lastUpdated) {
      updatedEl.textContent = `อัปเดต: ${AppState.lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const statusEls = document.querySelectorAll('.api-status-badge');
    statusEls.forEach(el => {
      if (AppState.isFetching) {
        el.textContent = 'กำลังโหลด...';
        el.className = 'api-status-badge text-blue-600 font-bold';
      } else if (AppState.fetchError) {
        el.textContent = 'เกิดข้อผิดพลาด';
        el.className = 'api-status-badge text-red-500 font-bold';
      } else if (AppState.rawData.length === 0) {
        el.textContent = 'ไม่มีข้อมูล';
        el.className = 'api-status-badge text-slate-400 font-bold';
      } else {
        el.textContent = 'เชื่อมต่อสำเร็จ';
        el.className = 'api-status-badge text-emerald-600 font-bold';
      }
    });

    const countBadge = document.getElementById('recordCount');
    if (countBadge) {
      countBadge.textContent = `พบ ${AppState.filteredData.length} รายการ`;
    }
  }

  function renderMonthSelector() {
    const container = document.getElementById('monthSelector');
    if (!container) return;

    container.replaceChildren();

    const uniqueMonths = new Map();
    AppState.rawData.forEach(row => {
      if (row._monthKey !== 'unknown') {
        uniqueMonths.set(row._monthKey, row._monthDisplay);
      }
    });

    const sortedMonthKeys = Array.from(uniqueMonths.keys()).sort().reverse();

    if (AppState.activeMonthKey !== 'all' && !uniqueMonths.has(AppState.activeMonthKey)) {
      AppState.activeMonthKey = 'all';
      AppState.activeMonthDisplay = 'ภาพรวมทั้งหมด (All Time)';
    }

    container.appendChild(createMonthBtn('all', 'ภาพรวมทั้งหมด (All Time)'));

    sortedMonthKeys.forEach(key => {
      container.appendChild(createMonthBtn(key, uniqueMonths.get(key)));
    });

    updateScrollButtons();
  }

  function createMonthBtn(key, text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.month = key;
    btn.textContent = text;
    
    const isActive = key === AppState.activeMonthKey;
    btn.className = `month-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
      isActive
        ? 'skeuo-btn skeuo-btn-primary scale-105'
        : 'skeuo-btn text-slate-700'
    }`;

    btn.addEventListener('click', () => {
      AppState.activeMonthKey = key;
      AppState.activeMonthDisplay = text;
      renderMonthSelector();
      applyDataFilters();
    });

    return btn;
  }

  function updateScrollButtons() {
    const container = document.getElementById('monthSelector');
    const leftBtn = document.getElementById('scrollLeftBtn');
    const rightBtn = document.getElementById('scrollRightBtn');

    if (!container || !leftBtn || !rightBtn) return;

    if (container.scrollLeft <= 0) {
      leftBtn.classList.add('hidden');
    } else {
      leftBtn.classList.remove('hidden');
    }

    if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 1) {
      rightBtn.classList.add('hidden');
    } else {
      rightBtn.classList.remove('hidden');
    }
  }

  function initDepartmentFilter() {
    const selects = [document.getElementById('deptFilter'), document.getElementById('mobileDeptFilter')];
    const uniqueDepts = [...new Set(AppState.rawData.map(r => r.dept).filter(d => d && d.trim() !== ''))].sort();

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value || 'all';
      select.innerHTML = '<option value="all">ทุกแผนก</option>';

      uniqueDepts.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        select.appendChild(opt);
      });

      if (uniqueDepts.includes(currentVal)) {
        select.value = currentVal;
      }

      select.onchange = (e) => {
        AppState.selectedDept = e.target.value;
        selects.forEach(s => { if (s) s.value = AppState.selectedDept; });
        applyDataFilters();
      };
    });
  }

  function onStateChanged() {
    updateHeaderIndicators();
    updateMetrics(AppState.filteredData);
    renderDesktopHRReport(AppState.filteredData, AppState.activeMonthDisplay);
    renderDesktopTable(AppState.filteredData, desktopCurrentPage);
    
    renderMobileHRReport(AppState.filteredData, AppState.activeMonthDisplay);
    renderMobileLogCards(AppState.filteredData, MobileState.mobilePage);

    renderAllCharts(AppState.filteredData, AppState.activeMonthKey);
  }

  function bindEvents() {
    // Refresh Buttons
    const refreshBtns = document.querySelectorAll('.refresh-btn');
    refreshBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await fetchLiveData();
          showToast("รีเฟรชข้อมูลสำเร็จ");
        } catch {
          showToast("เกิดข้อผิดพลาดในการดึงข้อมูล");
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Scroll Buttons
    const container = document.getElementById('monthSelector');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    
    if (scrollLeftBtn && container) {
      scrollLeftBtn.addEventListener('click', () => container.scrollBy({ left: -250, behavior: 'smooth' }));
    }
    if (scrollRightBtn && container) {
      scrollRightBtn.addEventListener('click', () => container.scrollBy({ left: 250, behavior: 'smooth' }));
    }
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);

      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let startScrollLeft = 0;
      let dragged = false;

      container.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        startScrollLeft = container.scrollLeft;
        dragged = false;
      });

      container.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (!dragged && Math.abs(deltaX) < 6) return;
        if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

        if (!dragged) {
          dragged = true;
          container.setPointerCapture?.(pointerId);
        }
        event.preventDefault();
        container.classList.add('is-dragging');
        container.scrollLeft = startScrollLeft - deltaX;
      });

      const finishPointerDrag = (event) => {
        if (event.pointerId !== pointerId) return;
        if (container.hasPointerCapture?.(pointerId)) {
          container.releasePointerCapture(pointerId);
        }
        pointerId = null;
        container.classList.remove('is-dragging');
      };

      container.addEventListener('pointerup', finishPointerDrag);
      container.addEventListener('pointercancel', finishPointerDrag);
      container.addEventListener('click', (event) => {
        if (!dragged) return;
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      }, true);
    }

    // Search Inputs
    const searchInputs = [document.getElementById('searchInput'), document.getElementById('mobileSearchInput')];
    searchInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', (e) => {
        window.clearTimeout(searchDebounceTimer);
        AppState.searchTerm = e.target.value;
        searchInputs.forEach(s => { if (s) s.value = AppState.searchTerm; });
        searchDebounceTimer = window.setTimeout(() => applyDataFilters(), 250);
      });
    });

    // HR CSV Export Buttons
    const exportHRBtns = document.querySelectorAll('.export-hr-btn');
    exportHRBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          exportHRCompensationCSV(AppState.filteredData, AppState.activeMonthDisplay);
          showToast("ดาวน์โหลดรายงานค่าตอบแทน HR สำเร็จ");
        } catch (err) {
          showToast(err.message || "ไม่สามารถส่งออกข้อมูลได้");
        }
      });
    });

    // Copy HR Summary Buttons
    const copyHRBtns = document.querySelectorAll('.copy-hr-btn');
    copyHRBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        copyHRReportText(AppState.filteredData, AppState.activeMonthDisplay)
          .then(() => showToast("คัดลอกสรุปข้อมูล HR แล้ว"))
          .catch(() => showToast("ไม่สามารถคัดลอกข้อมูลได้"));
      });
    });

    // Export Raw CSV Buttons
    const exportRawBtns = document.querySelectorAll('.export-raw-btn');
    exportRawBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          exportRawCSV(AppState.filteredData, AppState.activeMonthDisplay);
          showToast("ดาวน์โหลดข้อมูลดิบแล้ว");
        } catch (err) {
          showToast(err.message || "ไม่สามารถส่งออกข้อมูลได้");
        }
      });
    });

    // Desktop Pagination Buttons
    const prevDesktop = document.getElementById('prevPageBtn');
    const nextDesktop = document.getElementById('nextPageBtn');
    if (prevDesktop) {
      prevDesktop.addEventListener('click', () => {
        if (desktopCurrentPage > 1) renderDesktopTable(AppState.filteredData, desktopCurrentPage - 1);
      });
    }
    if (nextDesktop) {
      nextDesktop.addEventListener('click', () => {
        const totalPages = Math.ceil(AppState.filteredData.length / DESKTOP_PAGE_SIZE);
        if (desktopCurrentPage < totalPages) renderDesktopTable(AppState.filteredData, desktopCurrentPage + 1);
      });
    }

    // Mobile Pagination Buttons
    const prevMobile = document.getElementById('mobilePrevBtn');
    const nextMobile = document.getElementById('mobileNextBtn');
    if (prevMobile) {
      prevMobile.addEventListener('click', () => {
        if (MobileState.mobilePage > 1) renderMobileLogCards(AppState.filteredData, MobileState.mobilePage - 1);
      });
    }
    if (nextMobile) {
      nextMobile.addEventListener('click', () => {
        const totalPages = Math.ceil(AppState.filteredData.length / MobileState.pageSize);
        if (MobileState.mobilePage < totalPages) renderMobileLogCards(AppState.filteredData, MobileState.mobilePage + 1);
      });
    }

    // Mobile Bottom Navigation Event Binding
    const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
    bottomNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = item.dataset.tab;
        if (targetTab) {
          setMobileTab(targetTab);
        }
      });
    });

    // Resize Handler
    window.addEventListener('resize', () => {
      updateScrollButtons();
    });
  }

  // ==========================================================================
  // 8. INITIALIZATION
  // ==========================================================================
  async function initApp() {
    onDataUpdated(() => {
      renderMonthSelector();
      initDepartmentFilter();
      onStateChanged();
    });

    bindEvents();
    setMobileTab('dashboard');

    try {
      await fetchLiveData();
    } catch (err) {
      console.error("Initial load error:", err);
    }
    startAutoRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
