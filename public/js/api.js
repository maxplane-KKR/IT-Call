/**
 * API Data Service & State Management Module
 * IT Call Center Analytics Web Application
 */

const API_CONFIG = Object.freeze({
  url: '/api/incidents',
  timeoutMs: 15000,
  autoRefreshMs: 5 * 60 * 1000, // 5 minutes
});

const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const AppState = {
  rawData: [],
  filteredData: [],
  activeMonthKey: 'all',
  activeMonthDisplay: 'ภาพรวมทั้งหมด (All Time)',
  selectedDept: 'all',
  searchTerm: '',
  isFetching: false,
  lastUpdated: null,
  onDataUpdatedCallbacks: []
};

/**
 * Register callback to trigger when app state data updates
 */
export function onDataUpdated(callback) {
  if (typeof callback === 'function') {
    AppState.onDataUpdatedCallbacks.push(callback);
  }
}

/**
 * Notify all registered callbacks of state change
 */
function notifyDataUpdated() {
  AppState.onDataUpdatedCallbacks.forEach(cb => cb(AppState));
}

/**
 * Parse Date String DD/MM/YYYY into JS Date object
 */
export function parseDate(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  return date.getFullYear() === Number(yearText) &&
         date.getMonth() === Number(monthText) - 1 &&
         date.getDate() === Number(dayText) ? date : null;
}

/**
 * Process raw JSON rows into clean objects with metadata
 */
export function processRawData(data) {
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

/**
 * Apply filters (Month, Department, Search) to raw dataset
 */
export function applyDataFilters() {
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

/**
 * Fetch fresh data from Google Sheet Web App API
 */
export async function fetchLiveData() {
  if (AppState.isFetching) return;
  
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
  
  AppState.isFetching = true;
  AppState.fetchError = null;
  notifyDataUpdated();

  let rawJson = null;

  try {
    // Direct fetch without custom headers (prevents CORS OPTIONS preflight block)
    const response = await fetch(API_CONFIG.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
    rawJson = await response.json();

  } catch (directError) {
    console.error("Direct fetch to Google Sheet API failed:", directError);
    AppState.fetchError = directError.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
    AppState.isFetching = false;
    notifyDataUpdated();
    throw directError;
  } finally {
    window.clearTimeout(timeoutId);
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

/**
 * Initialize auto-refresh schedule
 */
export function startAutoRefresh() {
  window.setInterval(fetchLiveData, API_CONFIG.autoRefreshMs);
}
