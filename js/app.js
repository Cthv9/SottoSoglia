import { $, monthKeyFromDate } from "./utils.js";
import { createUI } from "./ui.js";
import { setupInstallUI, registerSW } from "./pwa.js";

const MONTH_KEY = monthKeyFromDate(new Date());

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
