import assert from "node:assert/strict";
import test from "node:test";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.style = {};
  }

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

const fakeDocument = {
  createElement(tagName) {
    return new FakeElement(tagName);
  },
  createDocumentFragment() {
    return new FakeElement("#fragment");
  },
};

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

test("renders an accessible full-width HR ranking list for mobile", async () => {
  const mobileReports = await import("../public/mobile-reports.mjs");
  assert.equal(typeof mobileReports.renderMobileHrList, "function");

  const container = new FakeElement("div");
  const rows = mobileReports.buildMobileHrRows(
    { อธิบดี: 3, กรพีร์วัศ: 2 },
    5,
  );

  mobileReports.renderMobileHrList(fakeDocument, container, rows, 5);

  assert.equal(container.children.length, 1);
  const fragment = container.children[0];
  assert.equal(fragment.children.length, 3);
  assert.equal(fragment.children[0].tagName, "article");
  assert.equal(fragment.children[0].className, "mobile-hr-row");
  assert.equal(
    fragment.children[0].attributes["aria-label"],
    "อันดับ 1 อธิบดี 3 Ticket 60.0%",
  );
  assert.equal(fragment.children[0].children[1].children[1].textContent, "อธิบดี");
  assert.equal(fragment.children[0].children[2].textContent, "3");
  assert.equal(fragment.children[0].children[3].children[0].textContent, "60.0%");
  assert.equal(fragment.children[2].className, "mobile-hr-total");
  assert.equal(fragment.children[2].children[1].textContent, "5");
});

test("renders an explicit empty HR state on mobile", async () => {
  const mobileReports = await import("../public/mobile-reports.mjs");
  assert.equal(typeof mobileReports.renderMobileHrList, "function");

  const container = new FakeElement("div");
  mobileReports.renderMobileHrList(fakeDocument, container, [], 0);

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].className, "mobile-report-empty");
  assert.equal(
    container.children[0].textContent,
    "ไม่พบข้อมูลในเดือนหรือคำค้นหานี้",
  );
});

test("renders complete mobile Log cards with wrapping detail content", async () => {
  const mobileReports = await import("../public/mobile-reports.mjs");
  assert.equal(typeof mobileReports.renderMobileLogList, "function");

  const container = new FakeElement("div");
  const rows = mobileReports.buildMobileLogRows([
    {
      date: "23/7/2026",
      time: "20:19:00",
      detail: "เปิด Code ระบบ COMBIZYM และตรวจสิทธิ์ผู้ใช้งาน",
      type: "ทั่วไป",
      dept: "ER",
      operator: "อธิบดี",
    },
  ]);

  mobileReports.renderMobileLogList(fakeDocument, container, rows);

  assert.equal(container.children.length, 1);
  const fragment = container.children[0];
  assert.equal(fragment.children.length, 1);
  const card = fragment.children[0];
  assert.equal(card.tagName, "article");
  assert.equal(card.className, "mobile-log-card");
  assert.equal(
    card.attributes["aria-label"],
    "23/7/2026 20:19:00 อธิบดี เปิด Code ระบบ COMBIZYM และตรวจสิทธิ์ผู้ใช้งาน",
  );
  assert.equal(card.children[0].children[0].textContent, "23/7/2026");
  assert.equal(card.children[0].children[1].textContent, "20:19:00");
  assert.equal(
    card.children[1].textContent,
    "เปิด Code ระบบ COMBIZYM และตรวจสิทธิ์ผู้ใช้งาน",
  );
  assert.equal(card.children[2].children[0].textContent, "ทั่วไป");
  assert.equal(card.children[2].children[1].textContent, "ER");
  assert.equal(card.children[3].children[1].textContent, "อธิบดี");
});

test("renders an explicit empty Log state on mobile", async () => {
  const mobileReports = await import("../public/mobile-reports.mjs");
  assert.equal(typeof mobileReports.renderMobileLogList, "function");

  const container = new FakeElement("div");
  mobileReports.renderMobileLogList(fakeDocument, container, []);

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].className, "mobile-report-empty");
  assert.equal(
    container.children[0].textContent,
    "ไม่พบข้อมูลในเดือนหรือคำค้นหานี้",
  );
});
