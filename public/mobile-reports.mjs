function textOrFallback(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function buildMobileHrRows(staffCounts, totalTickets) {
  return Object.entries(staffCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
    .map(([name, count], index) => {
      const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;

      return {
        rank: index + 1,
        name,
        initial: name.charAt(0) || "?",
        count,
        percentage,
        percentageLabel: `${percentage.toFixed(1)}%`,
      };
    });
}

export function buildMobileLogRows(records) {
  return records.map((record) => {
    const operator = textOrFallback(record.operator);

    return {
      date: textOrFallback(record.date),
      time: textOrFallback(record.time),
      detail: textOrFallback(record.detail, "ไม่มีรายละเอียด"),
      type: textOrFallback(record.type),
      department: textOrFallback(record.dept),
      operator,
      operatorInitial: operator.charAt(0) || "?",
    };
  });
}
