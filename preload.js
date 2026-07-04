const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.send('open-settings'),
  selectDir: () => ipcRenderer.invoke('select-dir'),
  readMusicDir: (dirPath) => ipcRenderer.invoke('read-music-dir', dirPath),
  readMusicTags: (filePath) => ipcRenderer.invoke('read-music-tags', filePath),
  setLoginItem: (enable) => ipcRenderer.invoke('set-login-item', enable),
  getLoginItem: () => ipcRenderer.invoke('get-login-item'),
  testScreensaver: () => ipcRenderer.send('test-screensaver'),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, value) => callback(value)),
  onScreensaverMode: (callback) => ipcRenderer.on('screensaver-mode', (_event, value) => callback(value))
});
