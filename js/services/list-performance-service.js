export function paginate(items = [], { page = 1, pageSize = 50 } = {}) {
  const safePageSize = Math.max(1, Number(pageSize) || 50);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = clamp(Number(page) || 1, 1, totalPages);
  const start = (currentPage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: currentPage,
    pageSize: safePageSize,
    total,
    totalPages,
    start,
    end: Math.min(total, start + safePageSize)
  };
}

export function visibleRange({ scrollTop = 0, viewportHeight = 0, rowHeight = 1, total = 0, overscan = 5 } = {}) {
  const safeRowHeight = Math.max(1, Number(rowHeight) || 1);
  const safeTotal = Math.max(0, Number(total) || 0);
  const first = Math.floor(Math.max(0, scrollTop) / safeRowHeight);
  const visibleCount = Math.ceil(Math.max(0, viewportHeight) / safeRowHeight);
  const start = clamp(first - overscan, 0, safeTotal);
  const end = clamp(first + visibleCount + overscan, start, safeTotal);
  return {
    start,
    end,
    beforeHeight: start * safeRowHeight,
    afterHeight: Math.max(0, safeTotal - end) * safeRowHeight
  };
}

export function sortByField(items = [], field, direction = "asc", locale = "ru") {
  const sign = direction === "desc" ? -1 : 1;
  return [...items].sort((a, b) => sign * String(a?.[field] ?? "").localeCompare(String(b?.[field] ?? ""), locale, {
    numeric: true,
    sensitivity: "base"
  }));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

