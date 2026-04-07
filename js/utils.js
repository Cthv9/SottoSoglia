export const $ = (id) => document.getElementById(id);

export function monthKeyFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseAmount(input) {
  const normalized = String(input || "").replace(",", ".").trim();
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function roundUpToEuro(amount) {
  return Math.ceil(amount);
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

/** Accept only YYYY-MM, return normalized or "" */
export function normalizeEndMonth(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (!/^\d{4}-\d{2}$/.test(s)) return "";
  const [yy, mm] = s.split("-");
  const y = Number(yy);
  const m = Number(mm);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return "";
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}`;
}

export function monthsInclusive(fromKey, toKey) {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  if (![fy,fm,ty,tm].every(Number.isFinite)) return null;
  const delta = (ty * 12 + (tm - 1)) - (fy * 12 + (fm - 1));
  return delta + 1;
}

export function monthsLeftFromEndMonth(currentMonthKey, endMonth) {
  const em = normalizeEndMonth(endMonth);
  if (!em) return null;
  const n = monthsInclusive(currentMonthKey, em);
  if (n === null) return null;
  return n; // can be <= 0
}

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
