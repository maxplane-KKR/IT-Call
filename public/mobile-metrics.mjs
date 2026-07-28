export function setMetricPair(
  documentLike,
  desktopId,
  mobileId,
  desktopValue,
  mobileValue = desktopValue,
) {
  const desktop = documentLike.getElementById(desktopId);
  const mobile = documentLike.getElementById(mobileId);
  const fullValue = String(desktopValue);

  desktop.textContent = fullValue;
  mobile.textContent = String(mobileValue);
  mobile.title = fullValue;

  const mobileCard = mobile.closest("[data-metric-label]");
  if (mobileCard) {
    mobileCard.setAttribute(
      "aria-label",
      `${mobileCard.dataset.metricLabel}: ${fullValue}`,
    );
  }
}
