const path = require("node:path");
const fs = require("node:fs");
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
let isShuttingDown = false;
let backendManagedByApp = false;

const isDev = !app.isPackaged;

function getBackendCommand() {
  if (isDev) {
    return {
      command: "python",
      args: ["-m", "uvicorn", "backend.app.main:create_app", "--factory", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)]
    };
  }

  const candidates = [
    path.join(process.resourcesPath, "backend", "medflow_backend.exe"),
    path.join(process.resourcesPath, "medflow_backend.exe"),
    path.join(path.dirname(process.execPath), "medflow_backend.exe")
  ];
  const backendExe = candidates.find((candidate) => fs.existsSync(candidate));
  if (!backendExe) {
    throw new Error(`Backend não encontrado. Caminhos testados: ${candidates.join(" | ")}`);
  }

  return {
    command: backendExe,
    args: []
  };
}

function startBackend() {
  const backendPath = app.getPath("userData");
  let commandInfo;
  try {
    commandInfo = getBackendCommand();
  } catch (error) {
    dialog.showErrorBox("MedFlow", String(error.message || error));
    app.quit();
    return;
  }
  const { command, args } = commandInfo;
  const spawnCwd = isDev ? app.getAppPath() : path.dirname(command);
  const env = {
    ...process.env,
    MEDFLOW_DATA_DIR: backendPath,
    MEDFLOW_PORT: String(BACKEND_PORT)
  };

  backendProcess = spawn(command, args, {
    cwd: spawnCwd,
    env,
    windowsHide: true
  });
  backendManagedByApp = true;

  backendProcess.on("error", (error) => {
    dialog.showErrorBox("MedFlow", `Falha ao iniciar backend: ${error.message}`);
  });

  backendProcess.on("exit", async (code, signal) => {
    backendProcess = null;
    backendManagedByApp = false;
    if (isShuttingDown) return;
    if (code === 0) return;
    if (code === null && signal) return;
    if (code === 1) {
      try {
        const probe = await fetch(`${API_URL}/health`);
        if (probe.ok) return;
      } catch (_) {
        // if no server is reachable, keep the error message
      }
    }
    dialog.showErrorBox("MedFlow", `Backend finalizado com código ${code}.`);
  });
}

async function isBackendAlreadyRunning() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (_) {
    return false;
  }
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

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "frontend", "dist", "index.html"));
  }
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
  if (!backendProcess || !backendManagedByApp) return;
  backendProcess.kill();
}

app.whenReady().then(async () => {
  app.setAppUserModelId("com.medflow.desktop");
  const backendRunning = await isBackendAlreadyRunning();
  if (!backendRunning) {
    startBackend();
  } else {
    backendManagedByApp = false;
  }
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
  if (process.platform !== "darwin") {
    isShuttingDown = true;
    app.quit();
  }
});

app.on("before-quit", () => {
  isShuttingDown = true;
  stopNotificationLoop();
  stopBackend();
});
