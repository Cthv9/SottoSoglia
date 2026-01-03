import { $, clamp, escapeHtml, monthsLeftFromEndMonth, normalizeEndMonth } from "./utils.js";
import { STORE_EXP, STORE_SET, dbGet, dbPut, dbDelete, listExpensesByMonth, listRecentLabels } from "./db.js";
import { downloadTextFile, expensesToCSV, parseCSV, toBool, toInt } from "./csv.js";

export function createUI({ MONTH_KEY }) {
  // ---------------- State ----------------
  let settings = { monthlyLimitEur: 0 };
  let items = [];
  let filter = "all";
  let query = "";
  let editingId = null;

  // End month for NEW recurring expenses
  const END_LS_KEY = "sottosoglia_new_endmonth_v1";
  let newRecurringEndMonth = "";

  // Undo
  const UNDO_MS = 6500;
  let undoTimer = null;
  let undoPayload = null;

  // Theme
  const THEME_KEY = "sottosoglia_theme_v1"; // auto|light|dark

  // ---------------- Refs ----------------
  const topbar = $("topbar");
  const addBar = $("addBar");

  const monthPill = $("monthPill");
  const totalEurEl = $("totalEur");
  const limitEurEl = $("limitEur");
  const remainingEurEl = $("remainingEur");
  const remainingHintEl = $("remainingHint");
  const excludedInfoEl = $("excludedInfo");
  const barFill = $("barFill");
  const barHint = $("barHint");

  const listEl = $("list");
  const searchInput = $("searchInput");
  const filterBtn = $("filterBtn");
  const datalist = document.querySelector("#recent-labels");

  // Add bar
  const amountInput = $("amountInput");
  const labelInput = $("labelInput");
  const recurringInput = $("recurringInput");
  const addBtn = $("addBtn");
  const addRow2 = $("addRow2");
  const addHint = $("addHint");
  const endMonthBtn = $("endMonthBtn");
  const endMonthLabel = $("endMonthLabel");

  // Menu
  const menuBtn = $("menuBtn");
  const menuBackdrop = $("menuBackdrop");
  const menuSheet = $("menuSheet");
  const menuClose = $("menuClose");
  const openEIBtn = $("openEIBtn");
  const openLimitBtn = $("openLimitBtn");
  const themeAuto = $("themeAuto");
  const themeLight = $("themeLight");
  const themeDark = $("themeDark");

  // Limit sheet
  const limitBackdrop = $("limitBackdrop");
  const limitSheet = $("limitSheet");
  const limitClose = $("limitClose");
  const limitInput = $("limitInput");
  const saveLimitBtn = $("saveLimitBtn");

  // End month sheet
  const endBackdrop = $("endBackdrop");
  const endSheet = $("endSheet");
  const endClose = $("endClose");
  const endInput = $("endInput");
  const endSave = $("endSave");

  // Export/Import
  const eiBackdrop = $("eiBackdrop");
  const eiSheet = $("eiSheet");
  const eiClose = $("eiClose");
  const doExport = $("doExport");
  const doImport = $("doImport");
  const csvFile = $("csvFile");

  // Filter sheet
  const filterBackdrop = $("filterBackdrop");
  const filterSheet = $("filterSheet");
  const filterClose = $("filterClose");

  // Row actions sheet
  const rowBackdrop = $("rowBackdrop");
  const rowSheet = $("rowSheet");
  const rowClose = $("rowClose");
  const rowMeta = $("rowMeta");
  const rowCopy = $("rowCopy");
  const rowToggleExcluded = $("rowToggleExcluded");
  const rowToggleRecurring = $("rowToggleRecurring");
  const rowDelete = $("rowDelete");
  let rowActionId = null;

  // Edit sheet
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

  // Toast
  const toast = $("toast");
  const toastText = $("toastText");
  const toastUndo = $("toastUndo");

  // ---------------- Helpers ----------------
  const MONTH_NAMES = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  function formatMonthPretty(monthKey) {
    const [y, m] = String(monthKey).split("-");
    const mm = Number(m);
    if (!y || !mm || mm < 1 || mm > 12) return "—";
    return `${MONTH_NAMES[mm - 1]} ${y}`;
  }

  function formatYYYYMMtoMMYYYY(v) {
    const norm = normalizeEndMonth(v);
    if (!norm) return "—";
    const [y, m] = norm.split("-");
    return `${m}/${y}`;
  }

  function sumIncluded(arr) {
    return arr.reduce((acc, e) => acc + (!e.isExcluded ? (e.amountEur || 0) : 0), 0);
  }
  function sumExcluded(arr) {
    return arr.reduce((acc, e) => acc + (e.isExcluded ? (e.amountEur || 0) : 0), 0);
  }

  // ---------------- Premium sheets animation ----------------
  const OPEN_MS = 180;

  function openSheet(backdrop, sheet) {
    backdrop.style.display = "block";
    sheet.style.display = "block";
    requestAnimationFrame(() => {
      backdrop.classList.add("isOpen");
      sheet.classList.add("isOpen");
    });
  }

  function closeSheet(backdrop, sheet) {
    backdrop.classList.remove("isOpen");
    sheet.classList.remove("isOpen");
    setTimeout(() => {
      backdrop.style.display = "none";
      sheet.style.display = "none";
    }, OPEN_MS);
  }

  function isAnySheetOpen() {
    return document.querySelector(".sheet.isOpen") !== null;
  }

  // ---------------- Theme ----------------
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function applyTheme(mode) {
    const html = document.documentElement;
    if (mode === "light") html.setAttribute("data-theme", "light");
    else if (mode === "dark") html.removeAttribute("data-theme");
    else {
      if (systemPrefersDark()) html.removeAttribute("data-theme");
      else html.setAttribute("data-theme", "light");
    }
  }
  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY) || "auto"; } catch { return "auto"; }
  }
  function saveTheme(mode) {
    try { localStorage.setItem(THEME_KEY, mode); } catch {}
    applyTheme(mode);
  }
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => {
      if (getSavedTheme() === "auto") applyTheme("auto");
    });
  }

  // ---------------- EndMonth for new recurring ----------------
  function loadEndMonth() {
    try { newRecurringEndMonth = localStorage.getItem(END_LS_KEY) || ""; } catch { newRecurringEndMonth = ""; }
    newRecurringEndMonth = normalizeEndMonth(newRecurringEndMonth) || "";
  }
  function saveEndMonth(v) {
    newRecurringEndMonth = normalizeEndMonth(v) || "";
    try { localStorage.setItem(END_LS_KEY, newRecurringEndMonth); } catch {}
    renderAddRecurringUI();
  }

  function renderAddRecurringUI() {
    const on = !!recurringInput.checked;

    if (!on) {
      addRow2.style.display = "none";
      return;
    }

    addRow2.style.display = "flex";
    endMonthLabel.textContent = newRecurringEndMonth ? formatYYYYMMtoMMYYYY(newRecurringEndMonth) : "—";
    addHint.textContent = newRecurringEndMonth
      ? `Ricorrente: ON • fine ${formatYYYYMMtoMMYYYY(newRecurringEndMonth)}`
      : "Ricorrente: ON • fine non impostata";
  }

  // ---------------- Undo / Toast ----------------
  function hideToast() { toast.style.display = "none"; }
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
    await dbPut(STORE_EXP, item);
    clearUndo();
    await refresh();
  }
  toastUndo.onclick = () => { applyUndo().catch(console.error); };

  // ---------------- KPI Render ----------------
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
      remainingHintEl.textContent = "Imposta una soglia dal menu ⋯.";
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

    monthPill.textContent = formatMonthPretty(MONTH_KEY);
  }

  // ---------------- Filters ----------------
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

  // ---------------- Data helpers ----------------
  async function duplicateItem(e) {
    const { uid } = await import("./utils.js");
    const copy = { ...e, id: uid(), createdAt: Date.now(), monthKey: MONTH_KEY };
    await dbPut(STORE_EXP, copy);
    await refresh();
  }

  async function deleteWithUndo(e) {
    clearUndo();
    undoPayload = { item: { ...e } };
    await dbDelete(STORE_EXP, e.id);
    await refresh();
    showToast("Voce eliminata.");
    undoTimer = setTimeout(() => { clearUndo(); }, UNDO_MS);
  }

  function renderDatalist(labels) {
    datalist.innerHTML = "";
    for (const l of labels) {
      const opt = document.createElement("option");
      opt.value = l;
      datalist.appendChild(opt);
    }
  }

  // ---------------- Row actions ----------------
  function openRowActions(id) {
    rowActionId = id;
    const e = items.find(x => x.id === id);
    if (!e) return;

    rowMeta.textContent = `€ ${e.amountEur} • ${e.label}${e.isRecurring ? " • Ricorrente" : ""}${e.isExcluded ? " • Esclusa" : ""}`;
    openSheet(rowBackdrop, rowSheet);
  }
  function closeRowActions() {
    rowActionId = null;
    closeSheet(rowBackdrop, rowSheet);
  }

  // ---------------- List render ----------------
  function renderList() {
    listEl.innerHTML = "";
    const visible = items.filter(passesFilters);

    if (visible.length === 0) {
      const box = document.createElement("div");
      box.className = "emptyState";
      box.innerHTML = `
        <div class="emptyTitle">Nessuna voce ancora</div>
        <div class="emptySub">
          Aggiungi una spesa dal pannello in basso (Importo + Tag + ＋).<br/>
          Tip: usa tag coerenti (es. “Affitto”, “Benzina”) per filtrare meglio.
        </div>
      `;
      listEl.appendChild(box);
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
      main.style.fontWeight = "950";
      main.style.opacity = e.isExcluded ? "0.78" : "1";
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
          mm.title = `Mesi rimanenti (fine ${formatYYYYMMtoMMYYYY(e.endMonth)})`;
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
      right.className = "itemRight";

      const kebab = document.createElement("button");
      kebab.className = "rowKebab";
      kebab.textContent = "⋯";
      kebab.title = "Azioni";
      kebab.onclick = (ev) => {
        ev.stopPropagation();
        openRowActions(e.id);
      };

      right.appendChild(kebab);

      row.appendChild(left);
      row.appendChild(right);
      listEl.appendChild(row);
    }
  }

  // ---------------- Edit sheet ----------------
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

    openSheet(editBackdrop, editSheet);
  }
  function closeEditSheet() {
    editingId = null;
    closeSheet(editBackdrop, editSheet);
  }

  // ---------------- Premium: Topbar shadow + AddBar hide on scroll ----------------
  function elementContainsActive(el) {
    const a = document.activeElement;
    return el && a && el.contains(a);
  }

  function setupScrollUX() {
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      ticking = false;
      const y = window.scrollY;

      // topbar shadow
      if (y > 6) topbar.classList.add("scrolled");
      else topbar.classList.remove("scrolled");

      // add bar auto-hide (only if no sheet open and not typing in add bar)
      if (isAnySheetOpen() || elementContainsActive(addBar)) {
        addBar.classList.remove("hidden");
        lastY = y;
        return;
      }

      const delta = y - lastY;
      if (delta > 8) addBar.classList.add("hidden");     // scrolling down
      else if (delta < -8) addBar.classList.remove("hidden"); // scrolling up

      lastY = y;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    // initial state
    update();
  }

  // ---------------- Public API ----------------
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

    limitInput.value = String(settings.monthlyLimitEur || 0);
    renderAddRecurringUI();
  }

  function bind() {
    // init theme + endMonth
    applyTheme(getSavedTheme());
    loadEndMonth();
    monthPill.textContent = formatMonthPretty(MONTH_KEY);

    // search
    searchInput.oninput = () => {
      query = searchInput.value;
      renderList();
    };

    // filter sheet
    filterBtn.onclick = () => openSheet(filterBackdrop, filterSheet);
    filterClose.onclick = () => closeSheet(filterBackdrop, filterSheet);
    filterBackdrop.onclick = () => closeSheet(filterBackdrop, filterSheet);

    filterSheet.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        filter = btn.getAttribute("data-filter");
        closeSheet(filterBackdrop, filterSheet);
        renderList();
      });
    });

    // menu
    menuBtn.onclick = () => openSheet(menuBackdrop, menuSheet);
    menuClose.onclick = () => closeSheet(menuBackdrop, menuSheet);
    menuBackdrop.onclick = () => closeSheet(menuBackdrop, menuSheet);

    openEIBtn.onclick = () => {
      closeSheet(menuBackdrop, menuSheet);
      openSheet(eiBackdrop, eiSheet);
    };

    function openLimitSheet() {
      closeSheet(menuBackdrop, menuSheet);
      limitInput.value = String(settings.monthlyLimitEur || 0);
      openSheet(limitBackdrop, limitSheet);
      limitInput.focus();
    }
    openLimitBtn.onclick = openLimitSheet;

    themeAuto.onclick = () => saveTheme("auto");
    themeLight.onclick = () => saveTheme("light");
    themeDark.onclick = () => saveTheme("dark");

    // limit sheet
    limitClose.onclick = () => closeSheet(limitBackdrop, limitSheet);
    limitBackdrop.onclick = () => closeSheet(limitBackdrop, limitSheet);

    saveLimitBtn.onclick = async () => {
      const digits = String(limitInput.value || "").replace(/[^\d]/g, "");
      const n = digits ? Math.floor(Number(digits)) : 0;
      settings.monthlyLimitEur = Math.max(0, Number.isFinite(n) ? n : 0);
      await dbPut(STORE_SET, settings, "main");
      closeSheet(limitBackdrop, limitSheet);
      await refresh();
    };

    // recurring end month sheet (only when recurring ON)
    endMonthBtn.onclick = () => {
      endInput.value = newRecurringEndMonth || "";
      openSheet(endBackdrop, endSheet);
      endInput.focus();
    };
    endClose.onclick = () => closeSheet(endBackdrop, endSheet);
    endBackdrop.onclick = () => closeSheet(endBackdrop, endSheet);
    endSave.onclick = () => {
      const raw = String(endInput.value || "").trim();
      if (raw && !normalizeEndMonth(raw)) return alert("Formato non valido. Usa YYYY-MM (es. 2027-03).");
      saveEndMonth(raw);
      closeSheet(endBackdrop, endSheet);
    };

    // add
    recurringInput.onchange = () => renderAddRecurringUI();

    addBtn.onclick = async () => {
      const { parseAmount, roundUpToEuro, uid } = await import("./utils.js");
      const parsed = parseAmount(amountInput.value);
      const label = String(labelInput.value || "").trim();

      if (parsed === null || parsed <= 0) return alert("Inserisci un importo valido (> 0).");
      if (!label) return alert("Inserisci un tag/descrizione.");

      const isRecurring = !!recurringInput.checked;
      const endMonth = isRecurring ? (normalizeEndMonth(newRecurringEndMonth) || "") : "";

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
      renderAddRecurringUI();

      await refresh();
      amountInput.focus();
    };

    // export/import
    eiClose.onclick = () => closeSheet(eiBackdrop, eiSheet);
    eiBackdrop.onclick = () => closeSheet(eiBackdrop, eiSheet);

    doExport.onclick = () => {
      const csv = expensesToCSV(MONTH_KEY, items);
      downloadTextFile(`sottosoglia_spese_${MONTH_KEY}.csv`, csv);
      closeSheet(eiBackdrop, eiSheet);
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

        const { uid } = await import("./utils.js");

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

        closeSheet(eiBackdrop, eiSheet);
        await refresh();
        alert(`Import completato: ${imported} voci aggiunte a ${formatMonthPretty(MONTH_KEY)}.`);
      } catch (err) {
        console.error(err);
        alert("Errore durante l'import. Controlla il formato del CSV.");
      }
    };

    // row actions
    rowClose.onclick = closeRowActions;
    rowBackdrop.onclick = closeRowActions;

    rowCopy.onclick = async () => {
      const e = items.find(x => x.id === rowActionId);
      if (!e) return;
      await duplicateItem(e);
      closeRowActions();
    };

    rowToggleExcluded.onclick = async () => {
      const e = items.find(x => x.id === rowActionId);
      if (!e) return;
      e.isExcluded = !e.isExcluded;
      await dbPut(STORE_EXP, e);
      await refresh();
      rowMeta.textContent = `€ ${e.amountEur} • ${e.label}${e.isRecurring ? " • Ricorrente" : ""}${e.isExcluded ? " • Esclusa" : ""}`;
    };

    rowToggleRecurring.onclick = async () => {
      const e = items.find(x => x.id === rowActionId);
      if (!e) return;
      e.isRecurring = !e.isRecurring;
      if (!e.isRecurring) e.endMonth = "";
      await dbPut(STORE_EXP, e);
      await refresh();
      rowMeta.textContent = `€ ${e.amountEur} • ${e.label}${e.isRecurring ? " • Ricorrente" : ""}${e.isExcluded ? " • Esclusa" : ""}`;
    };

    rowDelete.onclick = async () => {
      const e = items.find(x => x.id === rowActionId);
      if (!e) return;
      closeRowActions();
      await deleteWithUndo(e);
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

      const { parseAmount, roundUpToEuro } = await import("./utils.js");
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
      closeEditSheet();
      await deleteWithUndo(e);
    };

    // toast init
    hideToast();

    // initial recurring UI
    renderAddRecurringUI();

    // premium scroll UX
    setupScrollUX();
  }

  return { bind, refresh };
}
