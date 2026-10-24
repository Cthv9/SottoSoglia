// Calcoli per la dashboard. Nessun accesso alla pagina: lavorano su un elenco di spese.
// Come nel resto dell'app, le voci escluse non contano nei totali.

const MONTH_KEY = /^\d{4}-\d{2}$/;
const MONTH_NAMES = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export function monthLabel(key) {
  const [y, m] = String(key).split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Gli ultimi `count` mesi fino a `endKey` compreso, dal più vecchio.
export function lastMonths(endKey, count) {
  return Array.from({ length: count }, (_, i) => shiftMonth(endKey, i - (count - 1)));
}

// Mesi da `fromKey` a `toKey`, entrambi compresi.
function monthsBetween(fromKey, toKey) {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm) + 1;
}

// Map mese -> { total, count }. Il totale non include le voci escluse.
export function monthlyTotals(expenses) {
  const out = new Map();
  for (const e of expenses) {
    if (!MONTH_KEY.test(String(e.monthKey))) continue;
    const s = out.get(e.monthKey) || { total: 0, count: 0 };
    if (!e.isExcluded) s.total += Number(e.amountEur) || 0;
    s.count += 1;
    out.set(e.monthKey, s);
  }
  return out;
}

// Numeri chiave del periodo. Media, massimo e minimo valgono per i mesi già finiti
// (prima di oggi) con almeno una voce: il mese in corso è incompleto e li falserebbe.
export function keyStats(totals, months, todayKey) {
  const periodTotal = months.reduce((sum, k) => sum + (totals.get(k)?.total || 0), 0);
  const done = months
    .filter((k) => k < todayKey && totals.has(k))
    .map((k) => ({ key: k, total: totals.get(k).total }));
  if (done.length === 0) return { periodTotal, average: null, max: null, min: null };

  const average = Math.round(done.reduce((sum, x) => sum + x.total, 0) / done.length);
  const max = done.reduce((best, x) => (x.total > best.total ? x : best));
  const min = done.reduce((best, x) => (x.total < best.total ? x : best));
  return { periodTotal, average, max, min };
}

// Dove vanno i soldi nel periodo, per tag, dal più alto. Maiuscole e spazi non separano i tag.
export function tagTotals(expenses, months) {
  const inPeriod = new Set(months);
  const byTag = new Map();
  for (const e of expenses) {
    if (e.isExcluded || !inPeriod.has(e.monthKey)) continue;
    const raw = String(e.label || "").trim();
    const id = (raw || "Senza tag").toLowerCase();
    const t = byTag.get(id) || { total: 0, count: 0, spellings: new Map() };
    t.total += Number(e.amountEur) || 0;
    t.count += 1;
    t.spellings.set(raw || "Senza tag", (t.spellings.get(raw || "Senza tag") || 0) + 1);
    byTag.set(id, t);
  }
  return [...byTag.values()]
    .map((t) => ({
      label: [...t.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
      total: t.total,
      count: t.count,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

// Rate in arrivo: le ricorrenti con una fine ancora attive. Si parte dal mese più recente,
// fino a oggi, che ha ricorrenti attive, perché il mese di oggi potrebbe non averle ancora.
export function installments(expenses, todayKey) {
  const active = (e) =>
    e.isRecurring && !e.isExcluded && (!MONTH_KEY.test(String(e.endMonth || "")) || e.endMonth >= todayKey);

  const byMonth = new Map();
  for (const e of expenses) {
    if (!MONTH_KEY.test(String(e.monthKey)) || e.monthKey > todayKey || !active(e)) continue;
    if (!byMonth.has(e.monthKey)) byMonth.set(e.monthKey, []);
    byMonth.get(e.monthKey).push(e);
  }
  const source = [...byMonth.keys()].sort().pop();
  if (!source) return { rate: [], openEnded: { count: 0, monthly: 0 } };

  const list = byMonth.get(source);
  const hasEnd = (e) => MONTH_KEY.test(String(e.endMonth || ""));

  const rate = list
    .filter(hasEnd)
    .map((e) => {
      const amount = Number(e.amountEur) || 0;
      const monthsLeft = monthsBetween(todayKey, e.endMonth);
      return { label: String(e.label || "").trim(), amount, endMonth: e.endMonth, monthsLeft, remaining: amount * monthsLeft };
    })
    .sort((a, b) => a.endMonth.localeCompare(b.endMonth) || b.amount - a.amount);

  const open = list.filter((e) => !hasEnd(e));
  return {
    rate,
    openEnded: { count: open.length, monthly: open.reduce((sum, e) => sum + (Number(e.amountEur) || 0), 0) },
  };
}
