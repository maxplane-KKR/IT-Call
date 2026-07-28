"use client";

import { useEffect, useMemo, useState } from "react";
import {
  filterRecords,
  rateCard,
  sampleRecords,
  summarizeRecords,
  toCsv,
} from "../lib/dashboard-data.mjs";
import {
  THEME_STORAGE_KEY,
  isTheme,
  nextTheme,
  themeToggleLabel,
} from "../lib/theme.mjs";

type FilterKey = "month" | "operator" | "eventType" | "department";
type FilterState = Record<FilterKey, string>;
type Theme = "dark" | "light";

const ALL = "ทั้งหมด";
const filterLabels: Record<FilterKey, string> = {
  month: "เดือน",
  operator: "ผู้ปฏิบัติงาน",
  eventType: "ประเภทเหตุการณ์",
  department: "แผนก",
};

const filterOptions: Record<FilterKey, string[]> = {
  month: [ALL, ...new Set(sampleRecords.map((record) => record.month))],
  operator: [ALL, ...new Set(sampleRecords.map((record) => record.operator))],
  eventType: [ALL, "Tele", "ทั่วไป"],
  department: [ALL, ...new Set(sampleRecords.map((record) => record.department))],
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

function severityClass(severity: string) {
  if (severity === "วิกฤต") return "tone-critical";
  if (severity === "สูง") return "tone-high";
  if (severity === "กลาง") return "tone-medium";
  return "tone-low";
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [theme, setTheme] = useState<Theme>("dark");
  const [refreshSeconds, setRefreshSeconds] = useState(300);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("ยังไม่มีการอัปเดต");
  const [exportMessage, setExportMessage] = useState("");

  const visibleRecords = useMemo(
    () => filterRecords(sampleRecords, filters),
    [filters],
  );
  const summary = useMemo(
    () => summarizeRecords(visibleRecords),
    [visibleRecords],
  );
  const activeFilters = Object.values(filters).some((value) => value !== ALL);
  const maxOperatorValue = Math.max(
    1,
    ...summary.byOperator.map((item) => item.value),
  );
  const maxHourValue = Math.max(1, ...summary.byHour.map((item) => item.value));

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: Theme = isTheme(storedTheme) ? (storedTheme as Theme) : "dark";
    document.documentElement.dataset.theme = initialTheme;

    const frame = window.requestAnimationFrame(() => setTheme(initialTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setRefreshSeconds((current) => (current <= 1 ? 300 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setExportMessage("");
  }

  function resetFilters() {
    setFilters(initialFilters);
    setExportMessage("");
  }

  function handleThemeToggle() {
    const updatedTheme = nextTheme(theme) as Theme;
    setTheme(updatedTheme);
    document.documentElement.dataset.theme = updatedTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, updatedTheme);
  }

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setExportMessage("");
    window.setTimeout(() => {
      setRefreshSeconds(300);
      setLastUpdated(
        new Intl.DateTimeFormat("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
      );
      setRefreshing(false);
    }, 700);
  }

  function handleExport() {
    try {
      const blob = new Blob([toCsv(visibleRecords)], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "it-oncall-compensation-local.csv";
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
              LOCAL PREVIEW
            </span>
            <button
              className="theme-toggle"
              type="button"
              onClick={handleThemeToggle}
              aria-label={themeToggleLabel(theme)}
              aria-pressed={theme === "light"}
              title={themeToggleLabel(theme)}
            >
              <span className={`theme-icon theme-icon-${theme}`} aria-hidden="true" />
              <span>{themeToggleLabel(theme)}</span>
            </button>
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
                ข้อมูลตัวอย่างสำหรับ local preview
              </span>
              <span>อัปเดตล่าสุด {lastUpdated}</span>
            </div>
          </div>

          <div className="status-card glass-card" aria-label="สถานะเวรและอัตราค่าตอบแทน">
            <div className="status-card-header">
              <div>
                <p className="eyebrow">NEXT REFRESH</p>
                <p className="refresh-countdown">
                  {Math.floor(refreshSeconds / 60)}:{String(refreshSeconds % 60).padStart(2, "0")}
                </p>
              </div>
              <span className="status-chip">พร้อมใช้งาน</span>
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
              <span className="filter-hint">แสดงข้อมูลตัวอย่างทั้งหมด</span>
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

          <div className="access-notice" role="note">
            <span className="notice-mark" aria-hidden="true">i</span>
            <p><strong>ข้อมูลจำกัดสิทธิ์:</strong> รายละเอียดและ HN แสดงเฉพาะผู้มีสิทธิ์เข้าถึงเท่านั้น · local preview ใช้ sample data</p>
          </div>
          <p className="sr-only" aria-live="polite">{exportMessage}</p>
          {visibleRecords.length ? (
            <>
              <div className="table-wrap desktop-table">
                <table>
                  <caption className="sr-only">รายการเหตุการณ์ตามตัวกรองปัจจุบัน</caption>
                  <thead>
                    <tr>
                      <th scope="col">วันเวลา</th>
                      <th scope="col">ผู้ปฏิบัติงาน</th>
                      <th scope="col">แผนก</th>
                      <th scope="col">เหตุการณ์</th>
                      <th scope="col">ระดับ</th>
                      <th scope="col">ระยะเวลา</th>
                      <th scope="col">ค่าตอบแทน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecords.map((record) => (
                      <tr key={record.id}>
                        <td><strong>{formatDate(record.date)}</strong><span>{record.time}</span></td>
                        <td>{record.operator}</td>
                        <td>{record.department}</td>
                        <td><span className={`event-tag ${record.eventType === "Tele" ? "event-tag-blue" : "event-tag-green"}`}>{record.eventType}</span></td>
                        <td><span className={`severity-tag ${severityClass(record.severity)}`}>{record.severity}</span></td>
                        <td>{record.durationMinutes} นาที</td>
                        <td><strong>{formatNumber(record.compensation)} บาท</strong>{record.capped ? <span className="capped-label">เพดาน</span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-records">
                {visibleRecords.map((record) => (
                  <article className="record-card" key={record.id}>
                    <div className="record-card-top"><span className="record-date">{formatDate(record.date)} · {record.time}</span><span className={`severity-tag ${severityClass(record.severity)}`}>{record.severity}</span></div>
                    <div className="record-card-main"><strong>{record.operator}</strong><span>{record.department}</span></div>
                    <div className="record-card-bottom"><span className={`event-tag ${record.eventType === "Tele" ? "event-tag-blue" : "event-tag-green"}`}>{record.eventType}</span><span>{record.durationMinutes} นาที</span><strong>{formatNumber(record.compensation)} บาท</strong></div>
                  </article>
                ))}
              </div>
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
          <span>LOCAL RECONSTRUCTION / SAMPLE DATA</span>
        </footer>
      </div>
    </main>
  );
}
