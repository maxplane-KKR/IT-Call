import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OncallDashboard, { ENDPOINT, STATUS_TEXT } from "../app/components/oncall-dashboard";

const row = (worker: string) => ({ worker, workDate: "2026-07-01", time: "20:00", category: "ทั่วไป", department: "ER", detail: "Reset" });

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("OncallDashboard", () => {
  it("renders the complete accessible dashboard structure and actions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([row("Alice")]), { status: 200 }));
    render(<OncallDashboard />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    for (const label of ["เดือน", "ผู้ปฏิบัติงาน", "ประเภทเหตุการณ์", "แผนก"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    for (const heading of [
      "ยอดค่าตอบแทนที่จ่ายจริง", "จำนวนเวร On call", "เหตุการณ์ Tele", "เหตุการณ์ทั่วไป", "ยอดที่ถูกจำกัดเพดาน",
      "ค่าตอบแทนรายบุคคล", "สัดส่วนประเภทเหตุการณ์", "ช่วงเวลาที่แจ้งงานสูงสุด", "สัดส่วนเคสรายบุคคล",
    ]) expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();

    await screen.findByRole("table");
    for (const header of ["วันที่", "เวลา", "ผู้ปฏิบัติงาน", "ประเภท", "แผนก", "รายละเอียด / HN"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(screen.getByText(/รายละเอียดและ HN.*ผู้มีสิทธิ์/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: "อัปเดตข้อมูล" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ดาวน์โหลด CSV รายวันและสรุปยอด" })).toBeInTheDocument();
  });

  it("loads immediately and filters ledger rows by worker", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([row("Alice"), row("Bob")]), { status: 200 }));
    render(<OncallDashboard />);
    expect(screen.getByText(STATUS_TEXT.loading)).toBeInTheDocument();
    await screen.findByText(STATUS_TEXT.success);
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT);
    expect(within(screen.getByRole("table")).getByText("Alice")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Bob")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(STATUS_TEXT.worker), { target: { value: "Alice" } });
    const ledger = screen.getByRole("table");
    expect(within(ledger).getByText("Alice")).toBeInTheDocument();
    expect(within(ledger).queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows an empty failure state for a malformed initial response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ records: [] }), { status: 200 }));
    render(<OncallDashboard />);
    expect(await screen.findByText(STATUS_TEXT.initialError)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("preserves last-known rows and warns after a refresh failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([row("Alice")]), { status: 200 }))
      .mockResolvedValueOnce(new Response("no", { status: 500 }));
    render(<OncallDashboard />);
    await waitFor(() => expect(within(screen.getByRole("table")).getByText("Alice")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: STATUS_TEXT.update }));
    expect(await screen.findByText(STATUS_TEXT.refreshError)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Alice")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("schedules one auto-refresh exactly 300000 ms after a manual refresh and clears timers", async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([row("Alice")]), { status: 200 }));
    const view = render(<OncallDashboard />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("countdown")).toHaveTextContent("300");
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByTestId("countdown")).toHaveTextContent("240");
    fireEvent.click(screen.getByRole("button", { name: STATUS_TEXT.update }));
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("countdown")).toHaveTextContent("300");
    await act(async () => { vi.advanceTimersByTime(299999); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => { vi.advanceTimersByTime(1); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    view.unmount();
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
