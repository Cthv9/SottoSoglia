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

  // set limit input after load
  // (ui.refresh reads settings already, but we keep the UX of showing a number)
  // ui.refresh doesn't expose settings directly; simplest: keep default "0".
  // If you want: we can make ui.refresh return settings.
  await registerSW();
})();
