import assert from "node:assert/strict";
import test from "node:test";

test("syncs full desktop values with compact accessible mobile values", async () => {
  let mobileMetricsModule = {};
  try {
    mobileMetricsModule = await import("../public/mobile-metrics.mjs");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }

  assert.equal(typeof mobileMetricsModule.setMetricPair, "function");

  const cardAttributes = {};
  const mobileCard = {
    dataset: { metricLabel: "สถานะ" },
    setAttribute(name, value) {
      cardAttributes[name] = value;
    },
  };
  const elements = {
    apiStatus: { textContent: "" },
    mobileApiStatus: {
      textContent: "",
      title: "",
      closest(selector) {
        assert.equal(selector, "[data-metric-label]");
        return mobileCard;
      },
    },
  };
  const documentLike = {
    getElementById(id) {
      return elements[id] ?? null;
    },
  };

  mobileMetricsModule.setMetricPair(
    documentLike,
    "apiStatus",
    "mobileApiStatus",
    "เชื่อมต่อสำเร็จ",
    "สำเร็จ",
  );

  assert.equal(elements.apiStatus.textContent, "เชื่อมต่อสำเร็จ");
  assert.equal(elements.mobileApiStatus.textContent, "สำเร็จ");
  assert.equal(elements.mobileApiStatus.title, "เชื่อมต่อสำเร็จ");
  assert.equal(cardAttributes["aria-label"], "สถานะ: เชื่อมต่อสำเร็จ");
});
