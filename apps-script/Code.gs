/**
 * IT On-call incidents API
 *
 * วางไฟล์นี้แทน Code.gs เดิม แล้ว Deploy > Manage deployments > Edit
 * เพื่ออัปเดต deployment เดิมโดยไม่เปลี่ยน URL /exec
 *
 * โครงสร้างชีตที่คาดหวัง (คอลัมน์ A:G):
 * timestamp | operator | date | time | detail | type | dept
 */

var CONFIG = {
  // เว้นว่างเมื่อสคริปต์ผูกอยู่กับ Google Sheet เดิม
  // ถ้าเป็น standalone Apps Script ให้ใส่ Spreadsheet ID
  spreadsheetId: "",
  // เว้นว่างเพื่อใช้ชีตแท็บแรก
  sheetName: "",
  lookbackYears: 3,
  cacheSeconds: 300,
  lockWaitMilliseconds: 10000
};

var DATA_COLUMN_COUNT = 7;
var CACHE_ROWS_PER_CHUNK = 50;
var CACHE_VERSION = "it-oncall-incidents-v3";

function doGet(e) {
  var years = requestedLookbackYears_(e);
  var cutoff = createRollingCutoff_(new Date(), years);
  var cacheKey = [
    CACHE_VERSION,
    "years-" + years,
    "cutoff-" + formatDateKey_(cutoff)
  ].join(":");
  var forceRefresh = Boolean(
    e && e.parameter && String(e.parameter.refresh || "") === "1"
  );
  var cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    var cachedRows = readChunkedCache_(cache, cacheKey);
    if (cachedRows) return jsonResponse_(cachedRows);
  }

  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(CONFIG.lockWaitMilliseconds);
  if (!hasLock) {
    var rowsAfterWait = readChunkedCache_(cache, cacheKey);
    if (rowsAfterWait) return jsonResponse_(rowsAfterWait);

    // Cache cold และมีคำขออื่นกำลังทำงานอยู่: ยังตอบข้อมูลได้โดยไม่ค้างรอเพิ่ม
    return jsonResponse_(loadRecentIncidents_(cutoff));
  }

  try {
    if (!forceRefresh) {
      var rowsAfterLock = readChunkedCache_(cache, cacheKey);
      if (rowsAfterLock) return jsonResponse_(rowsAfterLock);
    }

    var rows = loadRecentIncidents_(cutoff);
    writeChunkedCache_(cache, cacheKey, rows, CONFIG.cacheSeconds);
    return jsonResponse_(rows);
  } finally {
    lock.releaseLock();
  }
}

function requestedLookbackYears_(e) {
  var requested = e && e.parameter ? Number(e.parameter.years) : Number.NaN;
  return Number.isInteger(requested) && requested >= 1 && requested <= 10
    ? requested
    : CONFIG.lookbackYears;
}

function createRollingCutoff_(now, years) {
  var cutoff = new Date(
    now.getFullYear() - years,
    now.getMonth(),
    now.getDate()
  );
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

function getIncidentSheet_() {
  var spreadsheet = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error(
      "ไม่พบ Google Sheet: ผูกสคริปต์กับชีตเดิมหรือใส่ CONFIG.spreadsheetId"
    );
  }

  var sheet = CONFIG.sheetName
    ? spreadsheet.getSheetByName(CONFIG.sheetName)
    : spreadsheet.getSheets()[0];
  if (!sheet) throw new Error("ไม่พบชีตแท็บที่กำหนด");
  return sheet;
}

function loadRecentIncidents_(cutoff) {
  var sheet = getIncidentSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  // อ่านเฉพาะคอลัมน์ A:G ในคำสั่งเดียว ลด round-trip ไป Google Sheets
  var values = sheet
    .getRange(2, 1, lastRow - 1, DATA_COLUMN_COUNT)
    .getDisplayValues();
  return buildRecentIncidents_(values, cutoff);
}

function buildRecentIncidents_(values, cutoff) {
  var rows = [];
  for (var index = 0; index < values.length; index += 1) {
    var row = values[index];
    var incidentDate = parseIncidentDate_(row[2]);
    if (!incidentDate || incidentDate.getTime() < cutoff.getTime()) continue;

    rows.push({
      timestamp: stringValue_(row[0]),
      operator: stringValue_(row[1]),
      date: stringValue_(row[2]),
      time: stringValue_(row[3]),
      detail: stringValue_(row[4]),
      type: stringValue_(row[5]),
      dept: stringValue_(row[6])
    });
  }
  return rows;
}

function parseIncidentDate_(value) {
  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value.getTime())
  ) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  var text = stringValue_(value);
  var local = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  var iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  var year;
  var month;
  var day;

  if (local) {
    day = Number(local[1]);
    month = Number(local[2]);
    year = Number(local[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return null;
  }

  var date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function readChunkedCache_(cache, cacheKey) {
  var metadataText = cache.get(cacheKey + ":meta");
  if (!metadataText) return null;

  var metadata;
  try {
    metadata = JSON.parse(metadataText);
  } catch (error) {
    return null;
  }
  if (!metadata || !Number.isInteger(metadata.chunkCount)) return null;
  if (metadata.chunkCount === 0) return [];

  var keys = [];
  for (var index = 0; index < metadata.chunkCount; index += 1) {
    keys.push(cacheKey + ":chunk-" + index);
  }
  var cached = cache.getAll(keys);
  var rows = [];

  for (var chunkIndex = 0; chunkIndex < keys.length; chunkIndex += 1) {
    var chunkText = cached[keys[chunkIndex]];
    if (!chunkText) return null;
    try {
      var chunkRows = JSON.parse(chunkText);
      if (!Array.isArray(chunkRows)) return null;
      rows = rows.concat(chunkRows);
    } catch (error) {
      return null;
    }
  }
  return rows;
}

function writeChunkedCache_(cache, cacheKey, rows, expirationSeconds) {
  var values = {};
  var chunkCount = Math.ceil(rows.length / CACHE_ROWS_PER_CHUNK);

  for (var index = 0; index < chunkCount; index += 1) {
    var start = index * CACHE_ROWS_PER_CHUNK;
    values[cacheKey + ":chunk-" + index] = JSON.stringify(
      rows.slice(start, start + CACHE_ROWS_PER_CHUNK)
    );
  }

  if (chunkCount > 0) cache.putAll(values, expirationSeconds);
  cache.put(
    cacheKey + ":meta",
    JSON.stringify({ chunkCount: chunkCount }),
    expirationSeconds
  );
}

function formatDateKey_(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function stringValue_(value) {
  return value == null ? "" : String(value).trim();
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
