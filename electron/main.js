const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let mainWindow = null;
let port = null;
let parser = null;

function sendState(state, detail = '') {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('serial-state', { state, detail });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 576,
    backgroundColor: '#101522',
    autoHideMenuBar: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'app', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  try {
    if (port && port.isOpen) await new Promise((resolve) => port.close(resolve));
  } catch (_) {}
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('serial-list', async () => {
  try {
    return await SerialPort.list();
  } catch (err) {
    return [];
  }
});

ipcMain.handle('serial-connect', async (_event, options) => {
  const { path: serialPath, baudRate = 115200 } = options || {};
  if (!serialPath) throw new Error('Seri port seçilmedi.');

  if (port && port.isOpen) {
    await new Promise((resolve) => port.close(resolve));
  }

  port = new SerialPort({ path: serialPath, baudRate, autoOpen: false });
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  parser.on('data', (line) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('serial-line', String(line).trim());
    }
  });

  port.on('error', (err) => sendState('error', err.message));
  port.on('close', () => sendState('disconnected'));

  await new Promise((resolve, reject) => {
    port.open((err) => err ? reject(err) : resolve());
  });

  sendState('connected', serialPath);
  return { ok: true, path: serialPath };
});

ipcMain.handle('serial-disconnect', async () => {
  if (!port || !port.isOpen) return { ok: true };
  await new Promise((resolve, reject) => {
    port.close((err) => err ? reject(err) : resolve());
  });
  return { ok: true };
});

ipcMain.handle('serial-write', async (_event, data) => {
  if (!port || !port.isOpen) throw new Error('Pico bağlı değil.');
  const payload = String(data).endsWith('\n') ? String(data) : `${data}\n`;
  await new Promise((resolve, reject) => {
    port.write(payload, (err) => {
      if (err) return reject(err);
      port.drain((drainErr) => drainErr ? reject(drainErr) : resolve());
    });
  });
  return { ok: true };
});
