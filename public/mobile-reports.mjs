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

function element(documentLike, tagName, className, textContent) {
  const node = documentLike.createElement(tagName);
  node.className = className;
  if (textContent !== undefined) node.textContent = String(textContent);
  return node;
}

export function renderMobileHrList(
  documentLike,
  container,
  rows,
  totalTickets,
) {
  container.replaceChildren();

  if (rows.length === 0) {
    container.appendChild(
      element(
        documentLike,
        "p",
        "mobile-report-empty",
        "ไม่พบข้อมูลในเดือนหรือคำค้นหานี้",
      ),
    );
    return;
  }

  const fragment = documentLike.createDocumentFragment();

  rows.forEach((row) => {
    const article = element(documentLike, "article", "mobile-hr-row");
    article.setAttribute(
      "aria-label",
      `อันดับ ${row.rank} ${row.name} ${row.count} Ticket ${row.percentageLabel}`,
    );

    const rank = element(documentLike, "span", "mobile-hr-rank", row.rank);
    const identity = element(documentLike, "div", "mobile-hr-identity");
    const avatar = element(documentLike, "span", "mobile-hr-avatar", row.initial);
    const name = element(documentLike, "strong", "mobile-hr-name", row.name);
    name.setAttribute("title", row.name);
    identity.append(avatar, name);

    const count = element(documentLike, "strong", "mobile-hr-count", row.count);
    count.setAttribute("aria-label", `${row.count} Ticket`);

    const share = element(documentLike, "div", "mobile-hr-share");
    const percentage = element(
      documentLike,
      "span",
      "mobile-hr-percentage",
      row.percentageLabel,
    );
    const track = element(documentLike, "span", "mobile-hr-track");
    const bar = element(documentLike, "span", "mobile-hr-bar");
    bar.style.width = `${Math.min(100, Math.max(0, row.percentage))}%`;
    track.appendChild(bar);
    share.append(percentage, track);

    article.append(rank, identity, count, share);
    fragment.appendChild(article);
  });

  const total = element(documentLike, "div", "mobile-hr-total");
  total.append(
    element(documentLike, "strong", "", "รวมทั้งหมด"),
    element(documentLike, "strong", "", totalTickets),
  );
  fragment.appendChild(total);
  container.appendChild(fragment);
}
