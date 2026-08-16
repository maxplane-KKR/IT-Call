export const MOBILE_TABS = ["dashboard", "team", "charts", "log"];

export function resolveSwipeTab(currentTab, deltaX, deltaY, threshold = 56) {
  const currentIndex = MOBILE_TABS.indexOf(currentTab);
  if (currentIndex < 0 || Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return currentTab;
  }

  const direction = deltaX < 0 ? 1 : -1;
  const nextIndex = Math.max(0, Math.min(MOBILE_TABS.length - 1, currentIndex + direction));
  return MOBILE_TABS[nextIndex];
}
