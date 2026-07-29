import assert from "node:assert/strict";
import test from "node:test";

test("builds compact HR rows from the same staff totals as desktop", async () => {
  let mobileReports = {};
  try {
    mobileReports = await import("../public/mobile-reports.mjs");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }

  assert.equal(typeof mobileReports.buildMobileHrRows, "function");
  assert.deepEqual(
    mobileReports.buildMobileHrRows({ อธิบดี: 3, กรพีร์วัศ: 2 }, 5),
    [
      {
        rank: 1,
        name: "อธิบดี",
        initial: "อ",
        count: 3,
        percentage: 60,
        percentageLabel: "60.0%",
      },
      {
        rank: 2,
        name: "กรพีร์วัศ",
        initial: "ก",
        count: 2,
        percentage: 40,
        percentageLabel: "40.0%",
      },
    ],
  );
});

test("normalizes complete mobile Log records without dropping long details", async () => {
  let mobileReports = {};
  try {
    mobileReports = await import("../public/mobile-reports.mjs");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }

  assert.equal(typeof mobileReports.buildMobileLogRows, "function");

  const rows = mobileReports.buildMobileLogRows([
    {
      date: "23/7/2026",
      time: "20:19:00",
      detail: "เปิด Code ระบบ COMBIZYM และตรวจสิทธิ์ผู้ใช้งาน",
      type: "ทั่วไป",
      dept: "ER",
      operator: "อธิบดี",
    },
    {
      date: "19/7/2026",
      time: "20:10:00",
      detail: "",
      type: "",
      dept: "",
      operator: "",
    },
  ]);

  assert.deepEqual(rows, [
    {
      date: "23/7/2026",
      time: "20:19:00",
      detail: "เปิด Code ระบบ COMBIZYM และตรวจสิทธิ์ผู้ใช้งาน",
      type: "ทั่วไป",
      department: "ER",
      operator: "อธิบดี",
      operatorInitial: "อ",
    },
    {
      date: "19/7/2026",
      time: "20:10:00",
      detail: "ไม่มีรายละเอียด",
      type: "-",
      department: "-",
      operator: "-",
      operatorInitial: "-",
    },
  ]);
});
