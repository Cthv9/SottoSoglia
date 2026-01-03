import { $, clamp, escapeHtml, monthsLeftFromEndMonth, normalizeEndMonth } from "./utils.js";
import { STORE_EXP, STORE_SET, dbGet, dbPut, dbDelete, listExpensesByMonth, listRecentLabels } from "./db.js";
import { downloadTextFile, expensesToCSV, parseCSV, toBool, toInt } from "./csv.js";

export function createUI({ MONTH_KEY }) {
  // state
  let settings = { monthlyLimitEur: 0 };
  let items = [];
  let filter = "all";
  let query = "";
  let editingId = null;

  // Undo state
  const UNDO_MS = 6500;
  let undoTimer = null;
  let undoPayload = null; // { item, position? }

  // refs
  const totalEurEl = $("totalEur");
  const limitEurEl = $("limitEur");
  const remainingEurEl = $("remainingEur");
  const remainingHintEl = $("remainingHint");
  const excludedInfoEl = $("excludedInfo");
  const limitInput = $("limitInput");
  const saveLimitBtn = $("saveLimitBtn");

  const barFill = $("barFill");
  const barHint = $("barHint");

  const amountInput = $("amountInput");
  const labelInput = $("labelInput");
  const recurringInput = $("recurringInput");
  const addBtn = $("addBtn");
  const addEndMonthWrap = $("addEndMonthWrap");
  const addEndMonth = $("addEndMonth");

  const listEl = $("list");
  const filterSelect = $("filterSelect");
  const searchInput = $("searchInput");
  const monthLabel = $("monthLabel");
  const datalist = document.querySelector("#recent-labels");

  // export/import
  const eiBtn = $("eiBtn");
  const eiBackdrop = $("eiBackdrop");
  const eiSheet = $("eiSheet");
  const eiClose = $("eiClose");
  const doExport = $("doExport");
  const doImport = $("doImport");
  const csvFile = $("csvFile");

  // edit
  const editBackdrop = $("editBackdrop");
  const editSheet = $("editSheet");
  const editClose = $("editClose");
  const editCancel = $("editCancel");
  const editSave = $("editSave");
  const editDelete = $("editDelete");
  const editAmount = $("editAmount");
  const editLabel = $("editLabel");
  const editRecurring = $("editRecurring");
  const editExcluded = $("editExcluded");
  const editEndMonth = $("editEndMonth");

  // toast
  const toast = $("toast");
  const toastText = $("toastText");
  const toastUndo = $("toastUndo");

  function sumIncluded(arr) {
    return arr.reduce((acc, e) => acc + (!e.isExcluded ? (e.amountEur || 0) : 0), 0);
  }
  function sumExcluded(arr) {
    return arr.reduce((acc, e) => acc + (e.isExcluded ? (e.amountEur || 0) : 0), 0);
  }

  // ---------- Toast / Undo ----------
  function hideToast() {
    toast.style.display = "none";
  }

  function showToast(message) {
    toastText.textContent = message;
    toast.style.display = "flex";
  }

  function clearUndo() {
    undoPayload = null;
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = null;
    hideToast();
  }

  async function applyUndo() {
    if (!undoPayload) return;
    const { item } = undoPayload;
    // Re-inserisce l'elemento con lo stesso id (ripristino)
    await dbPut(STORE_EXP, item);
    clearUndo();
    await refresh();
  }

  toastUndo.onclick = () => {
    applyUndo().catch(console.error);
  };

  // ---------- Render ----------
  function renderKPIs() {
    const limit = Number(settings.monthlyLimitEur) || 0;
    const totalIncluded = sumIncluded(items);
    const totalExcluded = sumExcluded(items);
    const remaining = limit - totalIncluded;

    totalEurEl.textContent = `€ ${totalIncluded}`;
    limitEurEl.textContent = `€ ${limit}`;
    remainingEurEl.textContent = `€ ${remaining}`;
    remainingEurEl.style.color = (limit > 0 && remaining < 0) ? "#ef4444" : "";

    if (limit > 0) {
      remainingHintEl.textContent = (remaining >= 0)
        ? `Ti restano € ${remaining} prima di superare la soglia.`
        : `Sei oltre la soglia di € ${Math.abs(remaining)}.`;

      const pct = clamp((totalIncluded / limit) * 100, 0, 100);
      barFill.style.width = `${pct}%`;
      barHint.textContent = (totalIncluded <= limit)
        ? `${Math.round(pct)}% della soglia utilizzata.`
        : `Oltre soglia di € ${totalIncluded - limit}.`;
    } else {
      remainingHintEl.textContent = "Imposta una soglia per vedere quanto manca.";
      barFill.style.width = "0%";
      barHint.textContent = "Gauge disponibile dopo aver impostato la soglia.";
    }

    if (totalExcluded > 0) {
      excludedInfoEl.style.display = "block";
      excludedInfoEl.textContent = `Escluse dal conteggio: € ${totalExcluded}`;
    } else {
      excludedInfoEl.style.display = "none";
      excludedInfoEl.textContent = "";
    }

    monthLabel.textContent = `Mese: ${MONTH_KEY}`;
  }

  function passesFilters(e) {
    if (filter === "recurring" && !e.isRecurring) return false;
    if (filter === "once" && e.isRecurring) return false;
    if (filter === "excluded" && !e.isExcluded) return false;
    if (filter === "included" && e.isExcluded) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!String(e.label || "").toLowerCase().includes(q)) return false;
    }
    return true;
  }

  async function duplicateItem(e) {
    const { uid } = await import("./utils.js");
    const copy = {
      ...e,
      id: uid(),
      createdAt: Date.now(),
      monthKey: MONTH_KEY
    };
    await dbPut(STORE_EXP, copy);
    await refresh();
  }

  async function deleteWithUndo(e) {
    // se c'è un undo attivo, lo “finalizziamo” (niente ripristino)
    clearUndo();

    // salva snapshot per undo
    undoPayload = { item: { ...e } };

    // elimina
    await dbDelete(STORE_EXP, e.id);

    // refresh UI
    await refresh();

    // mostra toast
    showToast("Voce eliminata.");
    undoTimer = setTimeout(() => {
      // scaduto: semplicemente puliamo lo stato
      clearUndo();
    }, UNDO_MS);
  }

  function renderList() {
    listEl.innerHTML = "";
    const visible = items.filter(passesFilters);

    if (visible.length === 0) {
      const d = document.createElement("div");
      d.className = "muted";
      d.textContent = "Nessuna voce.";
      listEl.appendChild(d);
      return;
    }

    for (const e of visible) {
      const row = document.createElement("div");
      row.className = "item";
      row.style.cursor = "pointer";

      row.onclick = (ev) => {
        if (ev.target && (ev.target.closest && ev.target.closest("button"))) return;
        openEdit(e.id);
      };

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "6px";

      const main = document.createElement("div");
      main.style.fontWeight = "900";
      main.style.opacity = e.isExcluded ? "0.75" : "1";
      main.innerHTML = `€ ${e.amountEur} <span class="tag">• ${escapeHtml(e.label)}</span>`;
      left.appendChild(main);

      const metaWrap = document.createElement("div");
      metaWrap.style.display = "flex";
      metaWrap.style.gap = "8px";
      metaWrap.style.flexWrap = "wrap";

      const meta = document.createElement("div");
      meta.className = "pill";
      meta.textContent = e.isRecurring ? "Ricorrente" : "Una tantum";
      metaWrap.appendChild(meta);

      if (e.isRecurring) {
        const leftMonths = monthsLeftFromEndMonth(MONTH_KEY, e.endMonth || "");
        if (leftMonths !== null && leftMonths > 0) {
          const mm = document.createElement("div");
          mm.className = "pill pillInfo";
          mm.textContent = `*${leftMonths}`;
          mm.title = `Mesi rimanenti fino a ${normalizeEndMonth(e.endMonth)}`;
          metaWrap.appendChild(mm);
        }
      }

      if (e.isExcluded) {
        const ex = document.createElement("div");
        ex.className = "pill pillWarn";
        ex.textContent = "Esclusa";
        metaWrap.appendChild(ex);
      }

      left.appendChild(metaWrap);

      const right = document.createElement("div");
      right.className = "row";

      // Escludi / includi
      const exc = document.createElement("button");
      exc.className = "btn";
      exc.textContent = e.isExcluded ? "✓" : "Ø";
      exc.title = e.isExcluded ? "Includi nel totale" : "Escludi dal totale";
      exc.onclick = async (ev) => {
        ev.stopPropagation();
        e.isExcluded = !e.isExcluded;
        await dbPut(STORE_EXP, e);
        await refresh();
      };

      // Ricorrente toggle
      const tog = document.createElement("button");
      tog.className = "btn";
      tog.textContent = e.isRecurring ? "↺" : "1×";
      tog.title = "Cambia ricorrente/una tantum";
      tog.onclick = async (ev) => {
        ev.stopPropagation();
        e.isRecurring = !e.isRecurring;
        if (!e.isRecurring) e.endMonth = "";
        await dbPut(STORE_EXP, e);
        await refresh();
      };

      // DUPLICA (nuovo)
      const dup = document.createElement("button");
      dup.className = "btn";
      dup.textContent = "Copia";
      dup.title = "Duplica questa voce";
      dup.onclick = async (ev) => {
        ev.stopPropagation();
        await duplicateItem(e);
      };

      // Elimina con undo
      const del = document.createElement("button");
      del.className = "btn btnDanger";
      del.textContent = "Elimina";
      del.onclick = async (ev) => {
        ev.stopPropagation();
        await deleteWithUndo(e);
      };

      right.appendChild(exc);
      right.appendChild(tog);
      right.appendChild(dup);
      right.appendChild(del);

      row.appendChild(left);
      row.appendChild(right);
      listEl.appendChild(row);
    }
  }

  function renderDatalist(labels) {
    datalist.innerHTML = "";
    for (const l of labels) {
      const opt = document.createElement("option");
      opt.value = l;
      datalist.appendChild(opt);
    }
  }

  // sheets
  function openSheet(backdrop, sheet) { backdrop.style.display = "block"; sheet.style.display = "block"; }
  function closeSheet(backdrop, sheet) { backdrop.style.display = "none"; sheet.style.display = "none"; }

  function openEISheet() { openSheet(eiBackdrop, eiSheet); }
  function closeEISheet() { closeSheet(eiBackdrop, eiSheet); }

  function openEditSheet() { openSheet(editBackdrop, editSheet); }
  function closeEditSheet() { closeSheet(editBackdrop, editSheet); editingId = null; }

  function openEdit(id) {
    const e = items.find(x => x.id === id);
    if (!e) return;

    editingId = id;
    editAmount.value = String(e.amountEur);
    editLabel.value = String(e.label || "");
    editRecurring.checked = !!e.isRecurring;
    editExcluded.checked = !!e.isExcluded;
    editEndMonth.value = e.endMonth || "";

    editEndMonth.disabled = !editRecurring.checked;
    if (!editRecurring.checked) editEndMonth.value = "";

    openEditSheet();
  }

  // add endMonth UI
  function syncAddEndMonthUI() {
    const on = !!recurringInput.checked;
    addEndMonthWrap.style.display = on ? "block" : "none";
    addEndMonth.disabled = !on;
    if (!on) addEndMonth.value = "";
  }

  // public API
  async function refresh() {
    settings = (await dbGet(STORE_SET, "main")) || { monthlyLimitEur: 0 };
    items = await listExpensesByMonth(MONTH_KEY);

    for (const e of items) {
      if (typeof e.isExcluded !== "boolean") e.isExcluded = false;
      if (typeof e.endMonth !== "string") e.endMonth = "";
    }

    renderKPIs();
    renderList();
    renderDatalist(await listRecentLabels());
  }

  function bind() {
    // settings
    saveLimitBtn.onclick = async () => {
      const digits = String(limitInput.value || "").replace(/[^\d]/g, "");
      const n = digits ? Math.floor(Number(digits)) : 0;
      settings.monthlyLimitEur = Math.max(0, Number.isFinite(n) ? n : 0);
      await dbPut(STORE_SET, settings, "main");
      await refresh();
    };

    // add
    recurringInput.onchange = syncAddEndMonthUI;

    addBtn.onclick = async () => {
      const { parseAmount, roundUpToEuro, uid, normalizeEndMonth } = await import("./utils.js");
      const parsed = parseAmount(amountInput.value);
      const label = String(labelInput.value || "").trim();
      if (parsed === null || parsed <= 0) return alert("Inserisci un importo valido (> 0).");
      if (!label) return alert("Inserisci un tag/descrizione.");

      const isRecurring = !!recurringInput.checked;
      const rawEnd = isRecurring ? String(addEndMonth.value || "").trim() : "";
      const endMonth = isRecurring ? normalizeEndMonth(rawEnd) : "";

      if (isRecurring && rawEnd && !endMonth) {
        return alert("Fine ricorrenza non valida. Usa il formato YYYY-MM (es. 2027-03).");
      }

      const e = {
        id: uid(),
        monthKey: MONTH_KEY,
        createdAt: Date.now(),
        amountEur: roundUpToEuro(parsed),
        label,
        isRecurring,
        isExcluded: false,
        endMonth
      };

      await dbPut(STORE_EXP, e);

      amountInput.value = "";
      labelInput.value = "";
      recurringInput.checked = false;
      addEndMonth.value = "";
      syncAddEndMonthUI();

      await refresh();
    };

    // filters
    filterSelect.onchange = () => { filter = filterSelect.value; renderList(); };
    searchInput.oninput = () => { query = searchInput.value; renderList(); };

    // export/import
    eiBtn.onclick = openEISheet;
    eiClose.onclick = closeEISheet;
    eiBackdrop.onclick = closeEISheet;

    doExport.onclick = () => {
      const csv = expensesToCSV(MONTH_KEY, items);
      downloadTextFile(`sottosoglia_spese_${MONTH_KEY}.csv`, csv);
      closeEISheet();
    };

    doImport.onclick = () => { csvFile.value = ""; csvFile.click(); };

    csvFile.onchange = async () => {
      const file = csvFile.files && csvFile.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const table = parseCSV(text);
        if (table.length < 2) return alert("CSV vuoto o non valido.");

        const header = table[0].map(h => String(h).trim().toLowerCase());
        const idx = (name) => header.indexOf(name.toLowerCase());

        const iAmt = idx("amount_eur");
        const iLbl = idx("label");
        const iRec = idx("recurring");
        const iExc = idx("excluded");
        const iEnd = idx("end_month");
        const iDT  = idx("datetime");

        if (iAmt === -1 || iLbl === -1) {
          return alert("CSV non riconosciuto. Deve contenere almeno: amount_eur,label");
        }

        const { normalizeEndMonth, uid } = await import("./utils.js");

        let imported = 0;
        for (let r = 1; r < table.length; r++) {
          const row = table[r];
          if (!row || row.length === 0) continue;

          const amountEur = toInt(row[iAmt]);
          const label = String(row[iLbl] ?? "").trim();
          const isRecurring = (iRec !== -1) ? toBool(row[iRec]) : false;
          const isExcluded = (iExc !== -1) ? toBool(row[iExc]) : false;
          const endMonth = (iEnd !== -1) ? normalizeEndMonth(row[iEnd]) : "";

          if (amountEur <= 0 || !label) continue;

          let createdAt = Date.now();
          if (iDT !== -1) {
            const d = new Date(String(row[iDT] ?? "").trim());
            if (!Number.isNaN(d.getTime())) createdAt = d.getTime();
          }

          const e = {
            id: uid(),
            monthKey: MONTH_KEY,
            createdAt,
            amountEur,
            label,
            isRecurring,
            isExcluded,
            endMonth
          };

          await dbPut(STORE_EXP, e);
          imported++;
        }

        closeEISheet();
        await refresh();
        alert(`Import completato: ${imported} voci aggiunte al mese ${MONTH_KEY}.`);
      } catch (err) {
        console.error(err);
        alert("Errore durante l'import. Controlla il formato del CSV.");
      }
    };

    // edit
    editClose.onclick = closeEditSheet;
    editCancel.onclick = closeEditSheet;
    editBackdrop.onclick = closeEditSheet;

    editRecurring.onchange = () => {
      editEndMonth.disabled = !editRecurring.checked;
      if (!editRecurring.checked) editEndMonth.value = "";
    };

    editSave.onclick = async () => {
      if (!editingId) return;

      const { parseAmount, roundUpToEuro, normalizeEndMonth } = await import("./utils.js");
      const parsed = parseAmount(editAmount.value);
      const label = String(editLabel.value || "").trim();
      if (parsed === null || parsed <= 0) return alert("Inserisci un importo valido (> 0).");
      if (!label) return alert("Inserisci un tag/descrizione.");

      const e = items.find(x => x.id === editingId);
      if (!e) return;

      const endMonth = editRecurring.checked ? normalizeEndMonth(editEndMonth.value) : "";
      if (editRecurring.checked && String(editEndMonth.value || "").trim() && !endMonth) {
        return alert("Fine ricorrenza non valida. Usa il formato YYYY-MM (es. 2027-03).");
      }

      e.amountEur = roundUpToEuro(parsed);
      e.label = label;
      e.isRecurring = !!editRecurring.checked;
      e.isExcluded = !!editExcluded.checked;
      e.endMonth = endMonth;

      await dbPut(STORE_EXP, e);
      closeEditSheet();
      await refresh();
    };

    editDelete.onclick = async () => {
      if (!editingId) return;
      const e = items.find(x => x.id === editingId);
      if (!e) return;

      // cancellazione dal foglio: chiudiamo e usiamo undo
      closeEditSheet();
      await deleteWithUndo(e);
    };

    // init UI state
    syncAddEndMonthUI();
    hideToast();
  }

  return {
    bind,
    refresh,
    setInitialLimitValue: (v) => { limitInput.value = String(v || 0); }
  };
}
