import { createElement, Fragment } from "react";

const h = createElement;

function detailValue(record) {
  return typeof record.detail === "string" && record.detail.trim()
    ? record.detail.trim()
    : "—";
}

function eventTag(record) {
  return h(
    "span",
    {
      className: `event-tag ${
        record.eventType === "Tele" ? "event-tag-blue" : "event-tag-green"
      }`,
    },
    record.eventType,
  );
}

export function OperationLogRecords({ records, formatDate }) {
  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "table-wrap desktop-table" },
      h(
        "table",
        null,
        h(
          "caption",
          { className: "sr-only" },
          "รายการเหตุการณ์ตามตัวกรองปัจจุบัน",
        ),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", { scope: "col" }, "วันเวลา"),
            h("th", { scope: "col" }, "ผู้ปฏิบัติงาน"),
            h("th", { scope: "col" }, "แผนก"),
            h(
              "th",
              { className: "detail-column", scope: "col" },
              "รายละเอียด",
            ),
            h("th", { scope: "col" }, "เหตุการณ์"),
          ),
        ),
        h(
          "tbody",
          null,
          records.map((record) => {
            const detail = detailValue(record);
            return h(
              "tr",
              { key: record.id },
              h(
                "td",
                null,
                h("strong", null, formatDate(record.date)),
                h("span", null, record.time),
              ),
              h("td", null, record.operator),
              h("td", null, record.department),
              h(
                "td",
                { className: "record-detail-cell" },
                h(
                  "span",
                  {
                    className: "record-detail-text",
                    title: detail === "—" ? "ไม่มีรายละเอียด" : detail,
                  },
                  detail,
                ),
              ),
              h("td", null, eventTag(record)),
            );
          }),
        ),
      ),
    ),
    h(
      "div",
      { className: "mobile-records" },
      records.map((record) => {
        const detail = detailValue(record);
        return h(
          "article",
          { className: "record-card", key: record.id },
          h(
            "div",
            { className: "record-card-top" },
            h(
              "span",
              { className: "record-date" },
              `${formatDate(record.date)} · ${record.time}`,
            ),
          ),
          h(
            "div",
            { className: "record-card-main" },
            h("strong", null, record.operator),
            h("span", null, record.department),
          ),
          h(
            "div",
            { className: "record-card-detail" },
            h("span", null, "รายละเอียด"),
            h("p", null, detail),
          ),
          h("div", { className: "record-card-bottom" }, eventTag(record)),
        );
      }),
    ),
  );
}
