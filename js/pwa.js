const LS_INSTALL_SEEN = "sottosoglia_install_seen_v1";
let deferredPrompt = null;

function isStandalone() {
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
    || window.navigator.standalone === true; // iOS
}
function isIOS() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}
function hasSeenInstallHint() {
  try { return localStorage.getItem(LS_INSTALL_SEEN) === "1"; } catch { return true; }
}
function markSeenInstallHint() {
  try { localStorage.setItem(LS_INSTALL_SEEN, "1"); } catch {}
}

export function setupInstallUI({ installBtn, installBackdrop, installSheet, installClose, installOk }) {
  function openInstallSheet() {
    installBackdrop.style.display = "block";
    installSheet.style.display = "block";
  }
  function closeInstallSheet(markSeen = true) {
    installBackdrop.style.display = "none";
    installSheet.style.display = "none";
    if (markSeen) markSeenInstallHint();
    installBtn.style.display = "none";
  }

  installClose.onclick = () => closeInstallSheet(true);
  installOk.onclick = () => closeInstallSheet(true);
  installBackdrop.onclick = () => closeInstallSheet(true);

  if (!hasSeenInstallHint()) {
    if (isIOS() && !isStandalone()) {
      installBtn.style.display = "inline-block";
    }
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone() && !hasSeenInstallHint()) {
      installBtn.style.display = "inline-block";
    }
  });

  installBtn.onclick = async () => {
    if (isStandalone()) { installBtn.style.display = "none"; return; }
    if (hasSeenInstallHint()) { installBtn.style.display = "none"; return; }

    if (isIOS() && !deferredPrompt) { openInstallSheet(); return; }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      markSeenInstallHint();
      installBtn.style.display = "none";
      return;
    }

    openInstallSheet();
  };

  window.addEventListener("appinstalled", () => {
    markSeenInstallHint();
    installBtn.style.display = "none";
    deferredPrompt = null;
  });
}

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (e) {
    console.warn("SW registration failed:", e);
  }
}
