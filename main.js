// LIVET para escritorio.
// La app abre https://app.livet.work en su propia ventana: es la misma LIVET de la web,
// así que cada vez que actualizás la página en GitHub, la app de escritorio se actualiza sola.
const { app, BrowserWindow, Menu, shell, session, ipcMain } = require("electron");
const path = require("path");
const { execFile } = require("child_process");

const APP_URL = "https://app.livet.work";
// Sitios que se abren dentro de la app. Todo lo demás se abre en el navegador.
const INTERNAL_HOSTS = ["app.livet.work"];
const INTERNAL_SUFFIXES = [".supabase.co"];

let win = null;

function isInternal(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "file:") return true;
    if (u.protocol !== "https:") return false;
    return INTERNAL_HOSTS.includes(u.hostname) || INTERNAL_SUFFIXES.some(s => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}

function openOutside(url) {
  try {
    const u = new URL(url);
    if (["https:", "http:", "mailto:"].includes(u.protocol)) shell.openExternal(url);
  } catch { /* enlace inválido: se ignora */ }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    title: "LIVET Work",
    backgroundColor: "#111315",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.once("ready-to-show", () => win.show());

  // Ventanas nuevas y enlaces externos se abren en el navegador.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url) && !url.startsWith("file:")) win.loadURL(url);
    else openOutside(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!isInternal(url)) { e.preventDefault(); openOutside(url); }
  });

  // Sin internet: muestra una pantalla propia en vez de un error del navegador.
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && !String(url).startsWith("file:")) {
      win.loadFile(path.join(__dirname, "offline.html"));
    }
  });

  win.loadURL(APP_URL, { extraHeaders: "pragma: no-cache\n" });
}

// Calendario de la Mac → LIVET. Solo responde a la página de LIVET y solo lee.
ipcMain.handle("livet:calendar", (event, fromMs, toMs) => new Promise((resolve) => {
  try {
    const host = new URL(event.senderFrame.url).hostname;
    if (!INTERNAL_HOSTS.includes(host)) return resolve({ ok: false, error: "origen" });
  } catch { return resolve({ ok: false, error: "origen" }); }
  if (process.platform !== "darwin") return resolve({ ok: false, error: "solo_mac" });
  const from = Number.isFinite(fromMs) ? fromMs : Date.now() - 30 * 864e5;
  const to = Number.isFinite(toMs) ? Math.min(toMs, from + 400 * 864e5) : Date.now() + 180 * 864e5;
  const bin = path.join(path.dirname(process.execPath), "calread");
  execFile(bin, [String(Math.round(from)), String(Math.round(to))], { timeout: 150000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
    if (err && !stdout) return resolve({ ok: false, error: "lector" });
    try { resolve(JSON.parse(String(stdout).trim().split("\n").pop())); } catch { resolve({ ok: false, error: "lectura" }); }
  });
}));

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{
      label: "LIVET Work",
      submenu: [
        { role: "about", label: "Acerca de LIVET Work" },
        { type: "separator" },
        { role: "hide", label: "Ocultar LIVET Work" },
        { role: "hideOthers", label: "Ocultar otras" },
        { role: "unhide", label: "Mostrar todas" },
        { type: "separator" },
        { role: "quit", label: "Salir de LIVET Work" },
      ],
    }] : []),
    {
      label: "Archivo",
      submenu: [
        { label: "Inicio", accelerator: "CmdOrCtrl+Shift+H", click: () => win && win.loadURL(APP_URL) },
        { role: "reload", label: "Recargar" },
        { type: "separator" },
        isMac ? { role: "close", label: "Cerrar ventana" } : { role: "quit", label: "Salir" },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Deshacer" },
        { role: "redo", label: "Rehacer" },
        { type: "separator" },
        { role: "cut", label: "Cortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Pegar" },
        { role: "selectAll", label: "Seleccionar todo" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "resetZoom", label: "Tamaño real" },
        { role: "zoomIn", label: "Acercar" },
        { role: "zoomOut", label: "Alejar" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Pantalla completa" },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        { label: "Abrir LIVET en el navegador", click: () => shell.openExternal(APP_URL) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Una sola ventana: si la abrís de nuevo, trae al frente la que ya estaba.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(async () => {
    // Siempre la última versión de la web: se borra la caché HTTP al abrir (no toca la sesión ni los datos).
    try { await session.defaultSession.clearCache(); } catch (e) { /* sigue */ }
    if (process.platform === "win32") app.setAppUserModelId("work.livet.app");
    buildMenu();
    createWindow();
    app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
