// Costruisce il sito pubblicato su GitHub Pages.
//
//   node scripts/build.mjs --prod <dir> --prod-id <id> --preview <dir> --preview-id <id> --out <dir>
//
// --prod     albero della PWA in produzione: diventa la radice del sito.
// --preview  albero del branch di sviluppo: diventa /preview/, con banner e dati separati.
// --*-id     identificativo della build (SHA del commit), usato nel nome della cache.
import fs from "node:fs";
import path from "node:path";

const WEB_FILES = ["index.html", "manifest.webmanifest", "sw.js", "favicon.ico", "pwa-192.png", "pwa-512.png", "assets", "js"];

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  for (const key of ["prod", "prod-id", "preview", "preview-id", "out"]) {
    if (!out[key]) throw new Error(`argomento mancante: --${key}`);
  }
  return out;
}

function replaceOnce(text, from, to, file) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${file}: "${from}" trovato ${count} volte, atteso 1`);
  return text.replace(from, to);
}

function copyWebFiles(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of WEB_FILES) {
    const from = path.join(src, name);
    if (!fs.existsSync(from)) throw new Error(`file mancante: ${from}`);
    fs.cpSync(from, path.join(dest, name), { recursive: true });
  }
}

function buildProduction({ src, id, dest }) {
  copyWebFiles(src, dest);
  const swPath = path.join(dest, "sw.js");
  let sw = fs.readFileSync(swPath, "utf8");
  sw = replaceOnce(sw, `"__CACHE_NAME__"`, `"sottosoglia-${id}"`, "sw.js");
  sw = replaceOnce(sw, `"__CACHE_FAMILY__"`, `"sottosoglia-"`, "sw.js");
  fs.writeFileSync(swPath, sw);
}

function buildPreview({ src, id, dest }) {
  copyWebFiles(src, dest);

  // Banner ben visibile: l'anteprima non deve essere scambiata per la versione in uso.
  const indexPath = path.join(dest, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const banner =
    `<div role="status" style="position:fixed;top:0;left:0;right:0;z-index:9999;` +
    `background:#f59e0b;color:#111;font:700 12px/1.6 system-ui,sans-serif;text-align:center">` +
    `ANTEPRIMA: sviluppo, non la versione in uso</div>`;
  html = replaceOnce(html, "<body>", `<body>\n  ${banner}`, "index.html");
  fs.writeFileSync(indexPath, html);

  // Nome proprio nel manifest, così l'anteprima non sovrascrive l'app installata.
  const manifestPath = path.join(dest, "manifest.webmanifest");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.name = "SottoSoglia (anteprima)";
  manifest.short_name = "Anteprima";
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  // Dati e impostazioni in namespace separati: stesso origin di produzione, quindi
  // IndexedDB e localStorage sono condivisi se non si separano i nomi.
  const jsDir = path.join(dest, "js");
  let renamed = 0;
  for (const name of fs.readdirSync(jsDir)) {
    const file = path.join(jsDir, name);
    const text = fs.readFileSync(file, "utf8");
    renamed += text.split(`"sottosoglia_`).length - 1;
    const next = text.split(`"sottosoglia_`).join(`"preview_sottosoglia_`);
    fs.writeFileSync(file, next);
  }
  if (renamed === 0) throw new Error("nessuna chiave dati trovata da separare nell'anteprima");

  const swPath = path.join(dest, "sw.js");
  let sw = fs.readFileSync(swPath, "utf8");
  sw = replaceOnce(sw, `"__CACHE_NAME__"`, `"preview-sottosoglia-${id}"`, "sw.js");
  sw = replaceOnce(sw, `"__CACHE_FAMILY__"`, `"preview-sottosoglia-"`, "sw.js");
  fs.writeFileSync(swPath, sw);
}

const args = parseArgs(process.argv);
const out = path.resolve(args.out);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

buildProduction({ src: args.prod, id: args["prod-id"], dest: out });
buildPreview({ src: args.preview, id: args["preview-id"], dest: path.join(out, "preview") });
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`sito costruito in ${out}`);
