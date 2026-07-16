import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OncallDashboard, { ENDPOINT, STATUS_TEXT } from "../app/components/oncall-dashboard";

const row = (worker: string) => ({ worker, workDate: "2026-07-01", time: "20:00", category: "ทั่วไป", department: "ER", detail: "Reset" });

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("OncallDashboard", () => {
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

  it("auto-refreshes at 300000 ms, updates countdown, resets manually, and clears timers", async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([row("Alice")]), { status: 200 }));
    const view = render(<OncallDashboard />);
    await act(async () => { vi.advanceTimersByTime(0); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByTestId("countdown")).toHaveTextContent("300");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId("countdown")).toHaveTextContent("299");
    fireEvent.click(screen.getByRole("button", { name: STATUS_TEXT.update }));
    expect(screen.getByTestId("countdown")).toHaveTextContent("300");
    await act(async () => { vi.advanceTimersByTime(300000); await Promise.resolve(); });
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    view.unmount();
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
