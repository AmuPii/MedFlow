const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("medflowDesktop", {
  platform: process.platform
});

