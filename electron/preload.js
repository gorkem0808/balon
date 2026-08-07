const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('picoBridge', {
  listPorts: () => ipcRenderer.invoke('serial-list'),
  connect: (options) => ipcRenderer.invoke('serial-connect', options),
  disconnect: () => ipcRenderer.invoke('serial-disconnect'),
  write: (data) => ipcRenderer.invoke('serial-write', data),
  onLine: (callback) => {
    const handler = (_event, line) => callback(line);
    ipcRenderer.on('serial-line', handler);
    return () => ipcRenderer.removeListener('serial-line', handler);
  },
  onState: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('serial-state', handler);
    return () => ipcRenderer.removeListener('serial-state', handler);
  }
});
