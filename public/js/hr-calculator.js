/**
 * HR Compensation Calculator & Export Utility Module
 * IT Call Center Analytics Web Application
 */

export const PAYMENT_RULES = Object.freeze({
  basePay: 100,
  telePay: 400,
  generalPay: 200,
  dailyCap: 800
});

const TELE_TYPE_KEYS = new Set(['x-ray-tele']);

export function normalizeType(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export function getOperatorName(row) {
  const name = String(row.operator ?? '').trim();
  return name || 'ไม่ระบุชื่อ';
}

export function getShiftKey(row) {
  const explicitShiftId = row.shiftId ?? row.shift_id ?? row.shift;
  return explicitShiftId ? `shift:${String(explicitShiftId).trim()}` : `date:${String(row.date ?? '').trim() || 'ไม่ระบุวัน'}`;
}

export function isTeleCase(row) {
  return TELE_TYPE_KEYS.has(normalizeType(row.type));
}

export function getStaffCounts(data) {
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

/**
 * Generate & Download HR Compensation CSV
 */
export function exportHRCompensationCSV(filteredData, monthDisplayKey) {
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

/**
 * Generate & Download Raw Log Data CSV
 */
export function exportRawCSV(filteredData, monthDisplayKey) {
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

/**
 * Copy HR Summary table to Clipboard
 */
export function copyHRReportText(filteredData, monthDisplay) {
  if (!filteredData || filteredData.length === 0) {
    throw new Error("ไม่มีข้อมูลให้คัดลอก");
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
