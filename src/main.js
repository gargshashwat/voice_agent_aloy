// Main Process - This is the "backend" of our Electron app
// It runs in Node.js and controls the application lifecycle

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a reference to the window object so it doesn't get garbage collected
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,  // Wider for chat panel
    height: 700,
    backgroundColor: '#1a1a1a', // Dark background
    webPreferences: {
      // For prototype: enable Node.js in renderer
      // (In production, use IPC instead)
      contextIsolation: false,
      nodeIntegration: true,
    }
  });

  // Load the HTML file (our UI)
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools (helpful for debugging) - remove this later if you want
  mainWindow.webContents.openDevTools();

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// When Electron is ready, create the window
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  // On macOS, apps usually stay open until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
