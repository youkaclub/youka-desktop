const os = require("os");
const { app, BrowserWindow } = require("electron");
const autoUpdate = require("update-electron-app");

app.allowRendererProcessReuse = false;
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (os.platform() === "win32") {
  autoUpdate();
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });
  mainWindow.removeMenu();
  mainWindow.maximize();
  mainWindow.show();

  const url = process.env.YOUKA_APP_URL || "https://app.youka.club/";
  mainWindow.loadURL(url);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
