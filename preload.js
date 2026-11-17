// Puente mínimo y seguro entre la web de LIVET y la app de escritorio.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("livetDesktop", {
  platform: process.platform,
  // Lee los eventos del Calendario de la Mac (pide permiso la primera vez).
  readCalendar: (fromMs, toMs) => ipcRenderer.invoke("livet:calendar", Number(fromMs), Number(toMs)),
});
