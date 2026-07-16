import type { DashboardSeries, Filters, IncidentRecord, Summary } from "../lib/oncall";

export const EMPTY_TEXT = "ไม่พบข้อมูลในขอบเขตที่เลือก";

type LiveMastheadProps = {
  statusText: string;
  errorMessage: string;
  lastRefresh: Date | null;
  nextRefreshAt: number;
  secondsRemaining: number;
  refreshing: boolean;
  onRefresh: () => void;
};

export function LiveMasthead(props: LiveMastheadProps) {
  const minutes = Math.floor(props.secondsRemaining / 60);
  const seconds = String(props.secondsRemaining % 60).padStart(2, "0");
  return <header className="masthead">
    <div className="masthead__identity">
      <p className="eyebrow">ระบบติดตามเวรนอกเวลา</p>
      <h1>IT <em>On-call</em></h1>
      <p className="purpose">ติดตามภาระงานและค่าตอบแทนของทีมไอทีอย่างโปร่งใสในมุมมองเดียว</p>
    </div>
    <div className="duty-board" aria-label="สถานะเวรและอัตราค่าตอบแทน">
      <div className="live-row">
        <p role="status" aria-live="polite"><span className="live-dot" aria-hidden="true" />{props.statusText}</p>
        <p className="countdown">รอบถัดไป <strong data-testid="countdown" data-next-refresh={props.nextRefreshAt}><span className="sr-only">{props.secondsRemaining} วินาที </span>{minutes}:{seconds}</strong></p>
      </div>
      {props.errorMessage && <p className="alert" role="alert">{props.errorMessage}</p>}
      <div className="refresh-row">
        <p>อัปเดตล่าสุด {props.lastRefresh ? <time dateTime={props.lastRefresh.toISOString()}>{props.lastRefresh.toLocaleString("th-TH")}</time> : "—"}</p>
        <button className="button button--signal" type="button" disabled={props.refreshing} onClick={props.onRefresh}>อัปเดตข้อมูล</button>
      </div>
      <dl className="rates">
        <div><dt>ค่าเวร</dt><dd>100 <span>บาท</span></dd></div>
        <div><dt>Tele</dt><dd>400 <span>บาท</span></dd></div>
        <div><dt>ทั่วไป</dt><dd>200 <span>บาท</span></dd></div>
        <div><dt>เพดาน</dt><dd>800 <span>บาท</span></dd></div>
      </dl>
    </div>
  </header>;
}

type FilterProps = {
  filters: Filters;
  months: string[];
  workers: string[];
  categories: string[];
  departments: string[];
  onChange: (key: keyof Filters, value: string) => void;
};

export function DashboardFilters({ filters, months, workers, categories, departments, onChange }: FilterProps) {
  const select = (label: string, key: keyof Filters, options: string[]) => <label className="filter">
    <span>{label}</span>
    <select value={filters[key] ?? ""} onChange={(event) => onChange(key, event.target.value)}>
      <option value="">ทั้งหมด</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
  return <section className="filters" aria-label="ตัวกรองแดชบอร์ด">
    {select("เดือน", "month", months)}
    {select("ผู้ปฏิบัติงาน", "worker", workers)}
    {select("ประเภทเหตุการณ์", "category", categories)}
    {select("แผนก", "department", departments)}
  </section>;
}

export function KpiGrid({ summary }: { summary: Summary }) {
  const values = [
    ["ยอดค่าตอบแทนที่จ่ายจริง", summary.eligibleCompensation.toLocaleString("th-TH"), "บาท"],
    ["จำนวนเวร On call", summary.shiftCount.toLocaleString("th-TH"), "เวร"],
    ["เหตุการณ์ Tele", summary.teleIncidents.toLocaleString("th-TH"), "ครั้ง"],
    ["เหตุการณ์ทั่วไป", summary.generalIncidents.toLocaleString("th-TH"), "ครั้ง"],
    ["ยอดที่ถูกจำกัดเพดาน", summary.capAdjustment.toLocaleString("th-TH"), "บาท"],
  ];
  return <section className="kpi-grid" aria-label="ตัวชี้วัดสำคัญ">
    {values.map(([label, value, unit], index) => <article className={`kpi kpi--${index + 1}`} key={label}>
      <h2>{label}</h2><p>{value} <span>{unit}</span></p>
    </article>)}
  </section>;
}

function Bars({ items, unit }: { items: Array<{ label: string; value: number }>; unit: string }) {
  if (!items.length) return <p className="empty">{EMPTY_TEXT}</p>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return <ul className="bars">{items.map((item) => <li key={item.label}>
    <div><span>{item.label || "ไม่ระบุ"}</span><strong>{item.value.toLocaleString("th-TH")} {unit}</strong></div>
    <span className="bar" aria-hidden="true"><i style={{ width: `${Math.max(4, item.value / max * 100)}%` }} /></span>
  </li>)}</ul>;
}

export function AnalysisGrid({ records, series }: { records: IncidentRecord[]; series: DashboardSeries }) {
  const hourCounts = new Map<string, number>();
  const workerCases = new Map<string, number>();
  records.forEach((record) => {
    const hour = /^\d{1,2}/.exec(record.time)?.[0];
    if (hour) hourCounts.set(`${hour.padStart(2, "0")}:00–${hour.padStart(2, "0")}:59`, (hourCounts.get(`${hour.padStart(2, "0")}:00–${hour.padStart(2, "0")}:59`) ?? 0) + 1);
    workerCases.set(record.worker, (workerCases.get(record.worker) ?? 0) + 1);
  });
  const panels = [
    { title: "ค่าตอบแทนรายบุคคล", items: series.compensationByWorker.map(({ worker, amount }) => ({ label: worker, value: amount })), unit: "บาท" },
    { title: "สัดส่วนประเภทเหตุการณ์", items: series.incidentsByCategory.map(({ category, count }) => ({ label: category, value: count })), unit: "ครั้ง" },
    { title: "ช่วงเวลาที่แจ้งงานสูงสุด", items: Array.from(hourCounts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5), unit: "ครั้ง" },
    { title: "สัดส่วนเคสรายบุคคล", items: Array.from(workerCases, ([label, value]) => ({ label, value })), unit: "เคส" },
  ];
  return <section className="analysis-grid" aria-label="บทวิเคราะห์">
    {panels.map((panel, index) => <article className={`analysis analysis--${index + 1}`} key={panel.title}>
      <div className="section-heading"><p>ANALYSIS / {String(index + 1).padStart(2, "0")}</p><h2>{panel.title}</h2></div>
      <Bars items={panel.items} unit={panel.unit} />
    </article>)}
  </section>;
}

export function IncidentLedger({ records, onExport }: { records: IncidentRecord[]; onExport: () => void }) {
  return <section className="ledger" aria-labelledby="ledger-title">
    <div className="ledger__header"><div><p className="eyebrow">บันทึกปฏิบัติการ</p><h2 id="ledger-title">รายการเหตุการณ์</h2></div>
      <button className="button button--outline" type="button" onClick={onExport}>ดาวน์โหลด CSV รายวันและสรุปยอด</button>
    </div>
    <p className="restricted"><strong>ข้อมูลจำกัดสิทธิ์:</strong> รายละเอียดและ HN แสดงเฉพาะผู้มีสิทธิ์เข้าถึงเท่านั้น</p>
    {records.length ? <div className="table-scroll"><table>
      <thead><tr>{["วันที่", "เวลา", "ผู้ปฏิบัติงาน", "ประเภท", "แผนก", "รายละเอียด / HN"].map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{records.map((record, index) => <tr key={`${record.worker}-${record.workDate}-${record.time}-${index}`}><td>{record.workDate}</td><td>{record.time || "—"}</td><td>{record.worker}</td><td>{record.category}</td><td>{record.department || "—"}</td><td>{record.detail || "—"}</td></tr>)}</tbody>
    </table></div> : <p className="empty empty--ledger">{EMPTY_TEXT}</p>}
  </section>;
}
