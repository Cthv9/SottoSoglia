// Disegno della dashboard. I calcoli stanno in stats.js.
// Tutto il testo passa da textContent, mai da innerHTML.
import { monthlyTotals, keyStats, tagTotals, installments, lastMonths, monthLabel } from "./stats.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const PERIODS = [3, 6, 12];
const MAX_TAGS = 8;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgEl(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

const eur = (n) => `€ ${n}`;

// Valori brevi per le etichette sulle barre: 950, 2,3k, 12k.
function short(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return String(n);
}

function section(title, ...children) {
  const box = el("section", "dashSection");
  box.append(el("div", "dashTitle", title), ...children);
  return box;
}

function periodChips(period, onPeriod) {
  const row = el("div", "row");
  for (const p of PERIODS) {
    const btn = el("button", "btn" + (p === period ? " isOn" : ""), `${p} mesi`);
    btn.type = "button";
    btn.setAttribute("aria-pressed", p === period ? "true" : "false");
    btn.onclick = () => onPeriod(p);
    row.append(btn);
  }
  return row;
}

function chart(months, totals, todayKey, onOpenMonth) {
  const W = 340, H = 170, padX = 6, top = 22, base = 140;
  const slot = (W - padX * 2) / months.length;
  const barW = Math.min(30, slot * 0.62);
  const values = months.map((k) => totals.get(k)?.total || 0);
  const max = Math.max(1, ...values);

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "group", "aria-label": "Spesa al mese" });
  svg.append(svgEl("line", { x1: padX, x2: W - padX, y1: base, y2: base, class: "chartAxis" }));

  months.forEach((key, i) => {
    const v = values[i];
    const h = v > 0 ? Math.max(3, (v / max) * (base - top)) : 1.5;
    const x = padX + i * slot + (slot - barW) / 2;
    const cx = x + barW / 2;

    svg.append(svgEl("rect", { x, y: base - h, width: barW, height: h, rx: 3, class: "chartBar" + (key === todayKey ? " now" : "") }));
    if (v > 0) svg.append(svgEl("text", { x: cx, y: base - h - 4, "text-anchor": "middle", class: "chartVal" }, short(v)));

    const [year, month] = key.split("-");
    svg.append(svgEl("text", { x: cx, y: base + 14, "text-anchor": "middle", class: "chartLbl" }, monthLabel(key).split(" ")[0]));
    if (i === 0 || month === "01") {
      svg.append(svgEl("text", { x: cx, y: base + 26, "text-anchor": "middle", class: "chartLbl" }, year));
    }

    // Area toccabile: apre il mese.
    const hit = svgEl("rect", { x: padX + i * slot, y: 0, width: slot, height: H, class: "chartHit", role: "button", tabindex: "0", "aria-label": `${monthLabel(key)}: ${eur(v)}` });
    hit.onclick = () => onOpenMonth(key);
    hit.onkeydown = (ev) => { if (ev.key === "Enter" || ev.key === " ") onOpenMonth(key); };
    svg.append(hit);
  });
  return svg;
}

function tile(label, value, sub) {
  const box = el("div", "dashTile");
  box.append(el("div", "dashTileLabel", label), el("div", "dashTileValue", value), el("div", "dashTileSub", sub || " "));
  return box;
}

function keyNumbers(stats, period) {
  const grid = el("div", "dashTiles");
  grid.append(
    tile("Media al mese", stats.average === null ? "—" : eur(stats.average), "mesi già finiti"),
    tile("Totale periodo", eur(stats.periodTotal), `${period} mesi, mese in corso incluso`),
    tile("Mese più alto", stats.max ? eur(stats.max.total) : "—", stats.max ? monthLabel(stats.max.key) : ""),
    tile("Mese più basso", stats.min ? eur(stats.min.total) : "—", stats.min ? monthLabel(stats.min.key) : "")
  );
  return grid;
}

function tagList(tags) {
  if (tags.length === 0) return el("div", "muted", "Nessuna spesa nel periodo.");

  const shown = tags.slice(0, MAX_TAGS);
  const rest = tags.slice(MAX_TAGS);
  if (rest.length > 0) {
    shown.push({ label: `Altro (${rest.length})`, total: rest.reduce((sum, t) => sum + t.total, 0), count: 0 });
  }
  const sum = tags.reduce((s, t) => s + t.total, 0) || 1;
  const top = Math.max(1, ...shown.map((t) => t.total));

  const list = el("div", "tagList");
  for (const t of shown) {
    const row = el("div", "tagRow");
    const head = el("div", "rowBetween tagHead");
    head.append(el("div", "tagName", t.label), el("div", "tagValue", `${eur(t.total)} • ${Math.round((t.total / sum) * 100)}%`));
    const track = el("div", "tagTrack");
    const fill = el("div", "tagFill");
    fill.style.width = `${Math.max(2, (t.total / top) * 100)}%`;
    track.append(fill);
    row.append(head, track);
    list.append(row);
  }
  return list;
}

function monthRows(totals, todayKey, onOpenMonth) {
  const keys = new Set([...totals.keys(), todayKey]);
  const list = el("div", "monthsList");
  for (const key of [...keys].sort().reverse()) {
    const s = totals.get(key) || { total: 0, count: 0 };
    const row = el("button", "monthRow");
    row.type = "button";

    const left = el("div");
    left.append(
      el("div", "monthName", monthLabel(key) + (key === todayKey ? " • in corso" : "")),
      el("div", "muted dashSub", s.count === 1 ? "1 voce" : `${s.count} voci`)
    );
    row.append(left, el("div", "monthTotal", eur(s.total)));
    row.onclick = () => onOpenMonth(key);
    list.append(row);
  }
  return list;
}

function installmentList(expenses, todayKey) {
  const { rate, openEnded } = installments(expenses, todayKey);
  const box = el("div");

  if (rate.length === 0) {
    box.append(el("div", "muted", "Nessuna rata con una fine impostata."));
  } else {
    for (const r of rate) {
      const row = el("div", "rowBetween rateRow");
      const left = el("div");
      left.append(
        el("div", "monthName", r.label || "Senza nome"),
        el("div", "muted dashSub", `${eur(r.amount)} al mese • ancora ${r.monthsLeft} ${r.monthsLeft === 1 ? "mese" : "mesi"} (fino a ${monthLabel(r.endMonth)})`)
      );
      const right = el("div", "rateRight");
      right.append(el("div", "monthTotal", eur(r.remaining)), el("div", "muted dashSub", "restanti"));
      row.append(left, right);
      box.append(row);
    }
    const perMonth = rate.reduce((sum, r) => sum + r.amount, 0);
    box.append(el("div", "muted", `Rate attive: ${eur(perMonth)} al mese.`));
  }
  if (openEnded.count > 0) {
    box.append(el("div", "muted", `Ricorrenti senza fine: ${eur(openEnded.monthly)} al mese (${openEnded.count}).`));
  }
  return box;
}

// root: contenitore da riempire. onPeriod(n) e onOpenMonth(key) li gestisce chi chiama.
export function renderDashboard(root, { expenses, todayKey, period, onPeriod, onOpenMonth }) {
  root.replaceChildren();

  if (expenses.length === 0) {
    root.append(el("div", "muted", "Nessuna spesa registrata: la dashboard si riempie man mano che aggiungi voci."));
    return;
  }

  const months = lastMonths(todayKey, period);
  const totals = monthlyTotals(expenses);

  root.append(
    periodChips(period, onPeriod),
    section("Andamento", chart(months, totals, todayKey, onOpenMonth), el("div", "muted", "Spesa al mese, voci conteggiate. Tocca una barra per aprire il mese.")),
    section("In numeri", keyNumbers(keyStats(totals, months, todayKey), period)),
    section("Per tag", tagList(tagTotals(expenses, months))),
    section("Mesi", monthRows(totals, todayKey, onOpenMonth)),
    section("Rate in arrivo", installmentList(expenses, todayKey))
  );
}
