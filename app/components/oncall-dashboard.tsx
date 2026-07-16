"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aggregateShifts, buildDashboardSeries, filterRecords, normalizeRows, summarizeShifts, type Filters, type IncidentRecord } from "../lib/oncall";
import { createDailySummaryCsv, downloadCsv } from "../lib/csv";
import { AnalysisGrid, DashboardFilters, IncidentLedger, KpiGrid, LiveMasthead } from "./dashboard-sections";

export const ENDPOINT = "/api/incidents";
export const STATUS_TEXT = {
  loading: "กำลังโหลดข้อมูล",
  success: "ข้อมูลพร้อมใช้งาน",
  initialError: "ไม่สามารถโหลดข้อมูลได้",
  refreshError: "ข้อมูลเดิมยังอยู่ แต่การอัปเดตล่าสุดไม่สำเร็จ",
  update: "อัปเดตข้อมูล",
  worker: "ผู้ปฏิบัติงาน",
} as const;
const REFRESH_MS = 300000;
type Status = "loading" | "success" | "initial-error" | "refresh-error";

export default function OncallDashboard() {
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState(() => Date.now() + REFRESH_MS);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const hasSucceeded = useRef(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const deadline = Date.now() + REFRESH_MS;
    setNextRefreshAt(deadline);
    setSecondsRemaining(300);
    try {
      const response = await fetch(ENDPOINT);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Malformed response");
      setRecords(normalizeRows(payload));
      setLastRefresh(new Date());
      setStatus("success");
      setErrorMessage("");
      hasSucceeded.current = true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus(hasSucceeded.current ? "refresh-error" : "initial-error");
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    // The initial fetch is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, Math.max(0, nextRefreshAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [nextRefreshAt, refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => setSecondsRemaining(Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [nextRefreshAt]);

  const values = useMemo(() => ({
    months: Array.from(new Set(records.map((record) => record.workDate.slice(0, 7))).values()).sort().reverse(),
    workers: Array.from(new Set(records.map((record) => record.worker))).sort(),
    categories: Array.from(new Set(records.map((record) => record.category))).sort(),
    departments: Array.from(new Set(records.map((record) => record.department).filter(Boolean))).sort(),
  }), [records]);
  const visibleRecords = useMemo(() => filterRecords(records, filters), [records, filters]);
  const shifts = useMemo(() => aggregateShifts(visibleRecords), [visibleRecords]);
  const summary = useMemo(() => summarizeShifts(shifts), [shifts]);
  const series = useMemo(() => buildDashboardSeries(visibleRecords, shifts), [visibleRecords, shifts]);
  const statusText = status === "loading" ? STATUS_TEXT.loading : status === "success" ? STATUS_TEXT.success : status === "initial-error" ? STATUS_TEXT.initialError : STATUS_TEXT.refreshError;

  const exportCsv = () => {
    const report = createDailySummaryCsv(visibleRecords, shifts, filters.month ?? "");
    downloadCsv(report.filename, report.content);
  };

  return <main>
    <LiveMasthead statusText={statusText} errorMessage={errorMessage} lastRefresh={lastRefresh} nextRefreshAt={nextRefreshAt} secondsRemaining={secondsRemaining} refreshing={refreshing} onRefresh={() => { void refresh(); }} />
    <div className="dashboard-shell">
      <DashboardFilters filters={filters} {...values} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value || undefined }))} />
      <KpiGrid summary={summary} />
      <AnalysisGrid records={visibleRecords} series={series} />
      {status !== "initial-error" && <IncidentLedger records={visibleRecords} onExport={exportCsv} />}
    </div>
  </main>;
}
