import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("renders incident details in desktop rows and mobile cards", async () => {
  let operationLogModule = {};
  try {
    operationLogModule = await import("../components/operation-log-records.mjs");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }

  assert.equal(typeof operationLogModule.OperationLogRecords, "function");

  const records = [
    {
      id: "with-detail",
      date: "2026-07-29",
      time: "20:15:00",
      operator: "กรพีรวัศ",
      department: "ER",
      eventType: "ทั่วไป",
      detail: "ตรวจสอบสิทธิ์ VPN ผู้ใช้งาน",
    },
    {
      id: "without-detail",
      date: "2026-07-29",
      time: "21:00:00",
      operator: "อัศวิน",
      department: "Xray",
      eventType: "Tele",
      detail: "",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(operationLogModule.OperationLogRecords, {
      records,
      formatDate: (date) => date,
    }),
  );

  assert.match(
    html,
    /<th class="detail-column" scope="col">รายละเอียด<\/th>/,
  );
  assert.equal(
    (html.match(/>ตรวจสอบสิทธิ์ VPN ผู้ใช้งาน<\/(?:span|p)>/g) ?? []).length,
    2,
  );
  assert.match(html, /title="ตรวจสอบสิทธิ์ VPN ผู้ใช้งาน"/);
  assert.equal((html.match(/>—<\/(?:span|p)>/g) ?? []).length, 2);
  assert.match(html, /class="record-detail-cell"/);
  assert.match(html, /class="record-card-detail"/);
});
