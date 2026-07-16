"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterRecords, normalizeRows, type Filters, type IncidentRecord } from "../lib/oncall";

export const ENDPOINT = "https://script.google.com/macros/s/AKfycbzet3nNEL9X8pEqB0YiqseO8GylRGTQZbtcCw4EVBfro19JkmPUouoCmVq6OjO2mMM2zA/exec";
export const STATUS_TEXT = {
  loading: "เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅ",
  success: "เธเนเธญเธกเธนเธฅเธชเธ”",
  initialError: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเนเธ”เน",
  refreshError: "เธเธณเน€เธ•เธทเธญเธเธเธฒเธฃเธฃเธตเน€เธเธฃเธ",
  update: "เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅ",
  worker: "เธเธนเนเธเธเธดเธเธฑเธ•เธดเธเธฒเธ",
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
    const nextDeadline = Date.now() + REFRESH_MS;
    setNextRefreshAt(nextDeadline);
    setSecondsRemaining(300);
    try {
      const response = await fetch(ENDPOINT);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Malformed response");
      const nextRecords = normalizeRows(payload);
      setRecords(nextRecords);
      setLastRefresh(new Date());
      setStatus("success");
      setErrorMessage("");
      hasSucceeded.current = true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus(hasSucceeded.current ? "refresh-error" : "initial-error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => { void refresh(); }, Math.max(0, nextRefreshAt - Date.now()));
    return () => { window.clearTimeout(refreshTimer); };
  }, [nextRefreshAt, refresh]);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000)));
    }, 1000);
    return () => {
      window.clearInterval(countdownTimer);
    };
  }, [nextRefreshAt]);

  const workers = useMemo(() => Array.from(new Set(records.map((record) => record.worker))), [records]);
  const visibleRecords = useMemo(() => filterRecords(records, filters), [records, filters]);

  return <main>
    <p aria-live="polite">
      {status === "loading" && STATUS_TEXT.loading}
      {status === "success" && STATUS_TEXT.success}
      {status === "initial-error" && STATUS_TEXT.initialError}
      {status === "refresh-error" && STATUS_TEXT.refreshError}
    </p>
    {errorMessage && <p role="alert">{errorMessage}</p>}
    <p data-testid="countdown" data-next-refresh={nextRefreshAt}>{secondsRemaining}</p>
    {lastRefresh && <time dateTime={lastRefresh.toISOString()}>{lastRefresh.toLocaleString()}</time>}
    <button type="button" disabled={refreshing} onClick={() => { void refresh(); }}>{STATUS_TEXT.update}</button>
    <label>
      {STATUS_TEXT.worker}
      <select value={filters.worker ?? ""} onChange={(event) => setFilters((current) => ({ ...current, worker: event.target.value || undefined }))}>
        <option value="">เธ—เธฑเนเธเธซเธกเธ”</option>
        {workers.map((worker) => <option key={worker} value={worker}>{worker}</option>)}
      </select>
    </label>
    {records.length > 0 && <table>
      <thead><tr><th>เธเธนเนเธเธเธดเธเธฑเธ•เธดเธเธฒเธ</th><th>เธงเธฑเธเธ—เธตเน</th><th>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”</th></tr></thead>
      <tbody>{visibleRecords.map((record, index) => <tr key={`${record.worker}-${record.workDate}-${record.time}-${index}`}><td>{record.worker}</td><td>{record.workDate}</td><td>{record.detail}</td></tr>)}</tbody>
    </table>}
  </main>;
}
