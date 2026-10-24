import { $, NS, monthKeyFromDate } from "./utils.js";
import { createUI } from "./ui.js";
import { setupInstallUI, registerSW } from "./pwa.js";

const MONTH_KEY = monthKeyFromDate(new Date());

// L'anteprima non deve essere scambiata per la versione in uso.
if (NS) {
  const banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.textContent = "ANTEPRIMA: sviluppo, non la versione in uso";
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#111;font:700 12px/1.6 system-ui,sans-serif;text-align:center";
  document.body.prepend(banner);
}

const ui = createUI({ MONTH_KEY });

// setup install sheet
setupInstallUI({
  installBtn: $("installBtn"),
  installBackdrop: $("installBackdrop"),
  installSheet: $("installSheet"),
  installClose: $("installClose"),
  installOk: $("installOk"),
});

ui.bind();

(async () => {
  await ui.refresh();
  await registerSW();
})();
