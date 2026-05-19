const path = require("node:path");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, Notification, dialog } = require("electron");
const { shouldTriggerNotification } = require("./notificationUtils");

const BACKEND_PORT = 8765;
const API_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const NOTIFICATION_POLL_MS = 30_000;

let mainWindow = null;
let backendProcess = null;
let notificationTimer = null;
let lastNotificationDate = null;

const isDev = !app.isPackaged;

function getBackendCommand() {
  if (isDev) {
    return {
      command: "python",
      args: ["-m", "uvicorn", "backend.app.main:create_app", "--factory", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)]
    };
  }

  return {
    command: path.join(process.resourcesPath, "backend", "medflow_backend.exe"),
    args: []
  };
}

function startBackend() {
  const backendPath = app.getPath("userData");
  const { command, args } = getBackendCommand();
  const env = {
    ...process.env,
    MEDFLOW_DATA_DIR: backendPath,
    MEDFLOW_PORT: String(BACKEND_PORT)
  };

  backendProcess = spawn(command, args, {
    cwd: app.getAppPath(),
    env,
    windowsHide: true
  });

  backendProcess.on("exit", (code) => {
    if (code !== 0) {
      dialog.showErrorBox("MedFlow", `Backend finalizado com código ${code}.`);
    }
  });
}

async function waitForBackend(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch (_) {
      // Waiting backend
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error("Tempo esgotado aguardando backend.");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#111217",
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  const url = isDev
    ? "http://localhost:5173"
    : `file://${path.join(app.getAppPath(), "frontend", "dist", "index.html")}`;

  mainWindow.loadURL(url);
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

async function pollAndNotify() {
  try {
    const settingsRes = await fetch(`${API_URL}/settings`);
    const settings = await settingsRes.json();
    const time = settings.notification_time || "09:00";
    const now = new Date();

    if (!shouldTriggerNotification(now, time, lastNotificationDate)) return;

    new Notification({
      title: "MedFlow",
      body: "Você já tomou seu remédio hoje?"
    }).show();

    lastNotificationDate = now.toISOString().slice(0, 10);
  } catch (_) {
    // Keep app running even if request fails temporarily.
  }
}

function startNotificationLoop() {
  notificationTimer = setInterval(pollAndNotify, NOTIFICATION_POLL_MS);
  pollAndNotify();
}

function stopNotificationLoop() {
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = null;
}

function stopBackend() {
  if (!backendProcess) return;
  backendProcess.kill();
  backendProcess = null;
}

app.whenReady().then(async () => {
  app.setAppUserModelId("com.medflow.desktop");
  startBackend();
  try {
    await waitForBackend();
  } catch (error) {
    dialog.showErrorBox("MedFlow", "Não foi possível iniciar o backend local.");
    app.quit();
    return;
  }
  createWindow();
  startNotificationLoop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopNotificationLoop();
  stopBackend();
});
