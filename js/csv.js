export function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function csvEscape(s) {
  const str = String(s ?? "");
  const needs = /[",\n]/.test(str);
  const out = str.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

export function expensesToCSV(monthKey, items) {
  const header = ["month", "dateTime", "amount_eur", "label", "recurring", "excluded", "end_month", "payment_method"].join(",");
  const rows = items.map(e => {
    const dt = new Date(e.createdAt).toISOString();
    return [
      monthKey,
      csvEscape(dt),
      String(e.amountEur),
      csvEscape(e.label),
      e.isRecurring ? "true" : "false",
      e.isExcluded ? "true" : "false",
      csvEscape(e.endMonth || ""),
      csvEscape(e.paymentMethod || "")
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      cur += ch;
    } else {
      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ",") { row.push(cur); cur = ""; continue; }
      if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; continue; }
      if (ch === "\r") continue;
      cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export function toBool(s) {
  return String(s).trim().toLowerCase() === "true";
}

export function toInt(s) {
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? Math.floor(n) : 0;
}
