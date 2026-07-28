"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OperationLogRecords } from "../components/operation-log-records.mjs";
import {
  filterRecords,
  INCIDENTS_ENDPOINT,
  normalizeLiveRows,
  rateCard,
  sortMonthsDescending,
  summarizeRecords,
  toCsv,
  visibleRecordWindow,
} from "../lib/dashboard-data.mjs";

type FilterKey = "month" | "operator" | "eventType" | "department";
type FilterState = Record<FilterKey, string>;
type DataStatus = "loading" | "success" | "error" | "refresh-error";
type DashboardRecord = {
  id: string;
  date: string;
  time: string;
  month: string;
  operator: string;
  department: string;
  eventType: string;
  detail?: string;
  compensation: number;
  capped?: boolean;
};

const ALL = "ทั้งหมด";
const RECORD_BATCH_SIZE = 100;
const filterLabels: Record<FilterKey, string> = {
  month: "เดือน",
  operator: "ผู้ปฏิบัติงาน",
  eventType: "ประเภทเหตุการณ์",
  department: "แผนก",
};

const initialFilters: FilterState = {
  month: ALL,
  operator: ALL,
  eventType: ALL,
  department: ALL,
};

const numberFormatter = new Intl.NumberFormat("th-TH");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export default function Home() {
  const [records, setRecords] = useState<DashboardRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("ยังไม่มีการอัปเดต");
  const [exportMessage, setExportMessage] = useState("");
  const [dataStatus, setDataStatus] = useState<DataStatus>("loading");
  const [dataError, setDataError] = useState("");
  const [visibleRecordCount, setVisibleRecordCount] = useState(RECORD_BATCH_SIZE);
  const hasLoadedRecords = useRef(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(INCIDENTS_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Malformed response");

      setRecords(normalizeLiveRows(payload));
      setLastUpdated(
        new Intl.DateTimeFormat("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
      );
      setDataStatus("success");
      setDataError("");
      hasLoadedRecords.current = true;
    } catch (error) {
      setDataStatus(hasLoadedRecords.current ? "refresh-error" : "error");
      setDataError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filterOptions = useMemo<Record<FilterKey, string[]>>(() => ({
    month: [ALL, ...sortMonthsDescending(records)],
    operator: [ALL, ...new Set(records.map((record) => record.operator))],
    eventType: [ALL, ...new Set(records.map((record) => record.eventType))],
    department: [ALL, ...new Set(records.map((record) => record.department).filter(Boolean))],
  }), [records]);

  const deferredFilters = useDeferredValue(filters);
  const visibleRecords = useMemo(
    () => filterRecords(records, deferredFilters),
    [records, deferredFilters],
  );
  const summary = useMemo(
    () => summarizeRecords(visibleRecords),
    [visibleRecords],
  );
  const displayedRecords = useMemo(
    () => visibleRecordWindow(visibleRecords, visibleRecordCount),
    [visibleRecords, visibleRecordCount],
  );
  const activeFilters = Object.values(filters).some((value) => value !== ALL);
  const maxOperatorValue = Math.max(
    1,
    ...summary.byOperator.map((item) => item.value),
  );
  const maxHourValue = Math.max(1, ...summary.byHour.map((item) => item.value));

  const statusText = dataStatus === "loading"
    ? "กำลังโหลดข้อมูล"
    : dataStatus === "success"
      ? "ข้อมูลพร้อมใช้งาน"
      : dataStatus === "refresh-error"
        ? "ข้อมูลเดิมยังอยู่ · อัปเดตไม่สำเร็จ"
        : "โหลดข้อมูลไม่สำเร็จ";

  useEffect(() => {
    // Initial fetch is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void refresh();
    }, 300_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setVisibleRecordCount(RECORD_BATCH_SIZE);
    setExportMessage("");
  }

  function resetFilters() {
    setFilters(initialFilters);
    setVisibleRecordCount(RECORD_BATCH_SIZE);
    setExportMessage("");
  }

  function handleRefresh() {
    if (refreshing) return;
    setExportMessage("");
    void refresh();
  }

  function handleExport() {
    try {
      const blob = new Blob(["\uFEFF", toCsv(visibleRecords)], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "it-oncall-compensation.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage(`ส่งออก ${visibleRecords.length} รายการแล้ว`);
    } catch {
      setExportMessage("ส่งออกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <main id="main-content" className="dashboard-shell">
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />

      <div className="dashboard-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">IT</span>
            <div>
              <p className="brand-kicker">ระบบติดตามเวรนอกเวลา</p>
              <p className="brand-name">Compensation Desk</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="preview-pill">
              <span className="status-dot" aria-hidden="true" />
              LIVE DATA
            </span>
            <button
              className="button button-primary"
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              {refreshing ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}
            </button>
          </div>
        </header>

        <section className="hero-grid" aria-labelledby="dashboard-title">
          <div className="hero-copy">
            <p className="eyebrow">OPS / IT ON-CALL</p>
            <h1 id="dashboard-title">
              IT <span>On-call</span>
            </h1>
            <p className="hero-description">
              ติดตามภาระงานและค่าตอบแทนของทีมไอทีอย่างโปร่งใสในมุมมองเดียว
            </p>
            <div className="hero-meta" aria-live="polite">
              <span className="live-label">
                <span className="status-dot" aria-hidden="true" />
                ข้อมูลปฏิบัติการล่าสุด
              </span>
              <span>อัปเดตล่าสุด {lastUpdated}</span>
              {dataError ? <span className="data-error" role="alert">{dataError}</span> : null}
            </div>
          </div>

          <div className="status-card glass-card" aria-label="สถานะเวรและอัตราค่าตอบแทน">
            <div className="status-card-header">
              <div>
                <p className="eyebrow">AUTO REFRESH</p>
                <p className="refresh-countdown">5 MIN</p>
              </div>
              <span className={`status-chip status-chip-${dataStatus}`}>{statusText}</span>
            </div>
            <div className="rate-grid">
              {rateCard.map((rate) => (
                <div className="rate-tile" key={rate.label}>
                  <span>{rate.label}</span>
                  <strong>{formatNumber(rate.value)}</strong>
                  <small>{rate.suffix}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="filter-section glass-card" aria-labelledby="filters-title">
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">CONTROL SURFACE</p>
              <h2 id="filters-title">ตัวกรองแดชบอร์ด</h2>
            </div>
            {activeFilters ? (
              <button className="button button-quiet" type="button" onClick={resetFilters}>
                ล้างตัวกรอง
              </button>
            ) : (
              <span className="filter-hint">
                {dataStatus === "loading" ? "กำลังซิงก์ข้อมูลจริง" : "ข้อมูลย้อนหลัง 3 ปี"}
              </span>
            )}
          </div>
          <div className="filter-grid">
            {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
              <label className="filter-control" key={key}>
                <span>{filterLabels[key]}</span>
                <select
                  value={filters[key]}
                  onChange={(event) => updateFilter(key, event.target.value)}
                >
                  {filterOptions[key].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="metrics-section" aria-labelledby="metrics-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AT A GLANCE / 01</p>
              <h2 id="metrics-title">ตัวชี้วัดสำคัญ</h2>
            </div>
            <p className="section-note">{visibleRecords.length} รายการในขอบเขตที่เลือก</p>
          </div>
          <div className="metric-grid">
            <article className="metric-card metric-card-primary">
              <p>ยอดค่าตอบแทนที่จ่ายจริง</p>
              <strong>{formatNumber(summary.paidCompensation)}</strong>
              <span>บาท</span>
            </article>
            <article className="metric-card">
              <p>จำนวนเวร On call</p>
              <strong>{formatNumber(summary.shifts)}</strong>
              <span>เวร</span>
            </article>
            <article className="metric-card">
              <p>เหตุการณ์ Tele</p>
              <strong>{formatNumber(summary.teleEvents)}</strong>
              <span>ครั้ง</span>
            </article>
            <article className="metric-card">
              <p>เหตุการณ์ทั่วไป</p>
              <strong>{formatNumber(summary.generalEvents)}</strong>
              <span>ครั้ง</span>
            </article>
            <article className="metric-card metric-card-warning">
              <p>ยอดที่ถูกจำกัดเพดาน</p>
              <strong>{formatNumber(summary.cappedAmount)}</strong>
              <span>บาท</span>
            </article>
          </div>
        </section>

        <section className="analysis-section" aria-labelledby="analysis-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DECISION SUPPORT / 02</p>
              <h2 id="analysis-title">บทวิเคราะห์</h2>
            </div>
            <span className="section-note">คำนวณจากรายการที่มองเห็น</span>
          </div>
          <div className="analysis-grid">
            <article className="analysis-card glass-card">
              <div className="analysis-card-heading">
                <div>
                  <p className="analysis-index">ANALYSIS / 01</p>
                  <h3>ค่าตอบแทนรายบุคคล</h3>
                </div>
                <span className="analysis-badge">บาท</span>
              </div>
              {summary.byOperator.length ? (
                <div className="bar-list">
                  {summary.byOperator.map((item) => (
                    <div className="bar-row" key={item.label}>
                      <div className="bar-label"><span>{item.label}</span><strong>{formatNumber(item.value)}</strong></div>
                      <div className="bar-track"><span style={{ width: `${Math.round((item.value / maxOperatorValue) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-copy">ไม่พบข้อมูลในขอบเขตที่เลือก</p>}
            </article>

            <article className="analysis-card glass-card">
              <div className="analysis-card-heading">
                <div>
                  <p className="analysis-index">ANALYSIS / 02</p>
                  <h3>สัดส่วนประเภทเหตุการณ์</h3>
                </div>
                <span className="analysis-badge">ครั้ง</span>
              </div>
              {summary.byEventType.length ? (
                <div className="event-mix">
                  {summary.byEventType.map((item) => (
                    <div className="mix-item" key={item.label}>
                      <div className="mix-heading"><span>{item.label}</span><strong>{item.value}</strong></div>
                      <div className="bar-track"><span className={item.label === "Tele" ? "bar-blue" : "bar-green"} style={{ width: `${Math.round((item.value / summary.shifts) * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-copy">ไม่พบข้อมูลในขอบเขตที่เลือก</p>}
            </article>

            <article className="analysis-card glass-card">
              <div className="analysis-card-heading">
                <div>
                  <p className="analysis-index">ANALYSIS / 03</p>
                  <h3>ช่วงเวลาที่แจ้งงานสูงสุด</h3>
                </div>
                <span className="analysis-badge">peak</span>
              </div>
              {summary.byHour.length ? (
                <div className="peak-list">
                  {summary.byHour.map((item) => (
                    <div className="peak-row" key={item.label}>
                      <span>{item.label}</span>
                      <div className="bar-track"><span className="bar-violet" style={{ width: `${Math.round((item.value / maxHourValue) * 100)}%` }} /></div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-copy">ไม่พบข้อมูลในขอบเขตที่เลือก</p>}
            </article>

            <article className="analysis-card glass-card">
              <div className="analysis-card-heading">
                <div>
                  <p className="analysis-index">ANALYSIS / 04</p>
                  <h3>สัดส่วนเคสรายบุคคล</h3>
                </div>
                <span className="analysis-badge">share</span>
              </div>
              {summary.caseShare.length ? (
                <div className="share-list">
                  {summary.caseShare.map((item) => (
                    <div className="share-row" key={item.label}>
                      <span className="share-avatar" aria-hidden="true">{item.label.slice(0, 1)}</span>
                      <span>{item.label}</span>
                      <strong>{item.percent}%</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-copy">ไม่พบข้อมูลในขอบเขตที่เลือก</p>}
            </article>
          </div>
        </section>

        <section className="events-section glass-card" aria-labelledby="events-title">
          <div className="section-heading events-heading">
            <div>
              <p className="eyebrow">OPERATION LOG / 03</p>
              <h2 id="events-title">รายการเหตุการณ์</h2>
              <p className="section-note">บันทึกปฏิบัติการ · {visibleRecords.length} รายการ</p>
            </div>
            <button className="button button-secondary" type="button" onClick={handleExport}>
              ดาวน์โหลด CSV รายการที่แสดง
            </button>
          </div>

          <p className="sr-only" aria-live="polite">{exportMessage}</p>
          {visibleRecords.length ? (
            <>
              <OperationLogRecords
                records={displayedRecords}
                formatDate={formatDate}
              />
              {displayedRecords.length < visibleRecords.length ? (
                <div className="event-pagination">
                  <span>แสดง {displayedRecords.length} จาก {visibleRecords.length} รายการ</span>
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={() => setVisibleRecordCount((current) => current + RECORD_BATCH_SIZE)}
                  >
                    แสดงเพิ่มอีก {Math.min(RECORD_BATCH_SIZE, visibleRecords.length - displayedRecords.length)} รายการ
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-state-mark" aria-hidden="true">—</span>
              <h3>ไม่พบข้อมูลในขอบเขตที่เลือก</h3>
              <p>ลองล้างตัวกรองเพื่อกลับไปดูรายการตัวอย่างทั้งหมด</p>
              <button className="button button-quiet" type="button" onClick={resetFilters}>ล้างตัวกรอง</button>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>IT ON-CALL COMPENSATION DESK</span>
        </footer>
      </div>
    </main>
  );
}
