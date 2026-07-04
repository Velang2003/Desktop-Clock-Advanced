const { app, BrowserWindow, ipcMain, powerMonitor, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settingsWindow;
let isScreensaverMode = false;

// Path to user settings
const userDataPath = app.getPath('userData');
const settingsFilePath = path.join(userDataPath, 'desktop-clock-settings.json');

// Default settings
const defaultSettings = {
  timeFormat: 'HH:MM:SS', // HH:MM or HH:MM:SS
  showAmPm: true,
  transitionType: 'fade', // fade, slide, flip
  fontPath: '', // custom font
  colors: {
    text: '#ffffff',
    background: 'rgba(0, 0, 0, 0.2)'
  },
  bgImage: '',
  textImage: '',
  pomodoroTime: 25,
  idleTimeout: 300,
  musicDir: '',
  bgOpacity: 0.2,
  launchOnStartup: false,
  worldClockTz: '',
  reminderMessage: 'Pomodoro session complete! Take a break.',
  widgetSize: { width: 500, height: 250 },
  widgetPosition: { x: 100, y: 100 },
  reminders: []
};

// Load settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error loading settings', err);
  }
  return defaultSettings;
}

// Save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

function createWindow() {
  const settings = loadSettings();

  mainWindow = new BrowserWindow({
    width: settings.widgetSize.width,
    height: settings.widgetSize.height,
    x: settings.widgetPosition.x,
    y: settings.widgetPosition.y,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Load the main html
  mainWindow.loadFile('index.html');
  
  // Set window to bottom z-order (pinned to desktop)
  // Workaround for Windows: type 'desktop' or setAlwaysOnTop with 'bottom'
  mainWindow.setAlwaysOnTop(false);

  mainWindow.on('moved', () => {
    const pos = mainWindow.getPosition();
    const currentSettings = loadSettings();
    currentSettings.widgetPosition = { x: pos[0], y: pos[1] };
    saveSettings(currentSettings);
  });
  
  mainWindow.on('resized', () => {
    const size = mainWindow.getSize();
    const currentSettings = loadSettings();
    currentSettings.widgetSize = { width: size[0], height: size[1] };
    saveSettings(currentSettings);
  });
}

function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  settingsWindow.loadFile('settings.html');
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function triggerScreensaver(active) {
  if (active && !isScreensaverMode) {
    isScreensaverMode = true;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.webContents.send('screensaver-mode', true);
  } else if (!active && isScreensaverMode) {
    isScreensaverMode = false;
    const settings = loadSettings();
    mainWindow.setBounds({ 
      x: settings.widgetPosition.x, 
      y: settings.widgetPosition.y, 
      width: settings.widgetSize.width, 
      height: settings.widgetSize.height 
    });
    mainWindow.setAlwaysOnTop(false);
    mainWindow.webContents.send('screensaver-mode', false);
  }
}

app.whenReady().then(() => {
  createWindow();

  // IPC Handlers
  ipcMain.handle('get-settings', () => loadSettings());
  ipcMain.handle('save-settings', (event, newSettings) => {
    saveSettings(newSettings);
    // Notify main window to update UI
    if (mainWindow) {
      mainWindow.webContents.send('settings-updated', newSettings);
      mainWindow.setSize(newSettings.widgetSize.width, newSettings.widgetSize.height);
    }
  });
  ipcMain.on('open-settings', () => openSettingsWindow());

  // Native directory picker
  ipcMain.handle('select-dir', async () => {
    const result = await dialog.showOpenDialog(settingsWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Read music files from directory (recursive)
  ipcMain.handle('read-music-dir', async (event, dirPath) => {
    const audioFiles = [];
    
    function scanDir(currentPath) {
      try {
        if (!fs.existsSync(currentPath)) return;
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath); // recursive call
          } else {
            const ext = entry.name.toLowerCase();
            if (ext.endsWith('.mp3') || ext.endsWith('.m4a') || ext.endsWith('.flac') || ext.endsWith('.wav') || ext.endsWith('.ogg') || ext.endsWith('.aac')) {
              audioFiles.push(fullPath);
            }
          }
        }
      } catch (e) {
        console.error("Error scanning dir:", currentPath, e);
      }
    }
    
    scanDir(dirPath);
    return audioFiles;
  });

  // Read ID3 tags from an audio file for album art
  ipcMain.handle('read-music-tags', async (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath);
      // Parse ID3v2 tags manually (fast, no extra dependency)
      // Works for MP3. For FLAC we skip (no embedded picture in basic FLAC tags easily).
      const result = { title: null, artist: null, picture: null };

      if (data.length < 10) return result;

      // Check ID3v2 header (MP3)
      if (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
        const majorVersion = data[3];
        const tagSize = ((data[6] & 0x7f) << 21) | ((data[7] & 0x7f) << 14) |
                        ((data[8] & 0x7f) << 7)  |  (data[9] & 0x7f);

        let offset = 10;
        const end = Math.min(10 + tagSize, data.length);

        while (offset < end - 10) {
          let frameId, frameSize;
          if (majorVersion <= 2) {
            frameId   = data.slice(offset, offset + 3).toString('ascii');
            frameSize = (data[offset+3] << 16) | (data[offset+4] << 8) | data[offset+5];
            offset += 6;
          } else {
            frameId   = data.slice(offset, offset + 4).toString('ascii');
            frameSize = (data[offset+4] << 24) | (data[offset+5] << 16) |
                        (data[offset+6] << 8)  |  data[offset+7];
            offset += 10;
          }

          if (!frameId || frameId === '\0\0\0\0' || frameSize <= 0) break;

          const frameData = data.slice(offset, offset + frameSize);
          offset += frameSize;

          const fid = frameId.toUpperCase();

          // Title
          if ((fid === 'TIT2' || fid === 'TT2') && !result.title) {
            result.title = frameData.slice(1).toString('utf8').replace(/\0/g, '').trim();
          }
          // Artist
          if ((fid === 'TPE1' || fid === 'TP1') && !result.artist) {
            result.artist = frameData.slice(1).toString('utf8').replace(/\0/g, '').trim();
          }
          // Picture (APIC or PIC)
          if ((fid === 'APIC' || fid === 'PIC') && !result.picture) {
            let picOffset = 1; 
            let mimeEnd = picOffset;
            while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) mimeEnd++;
            const mimeType = frameData.slice(picOffset, mimeEnd).toString('ascii');
            picOffset = mimeEnd + 1 + 1; 
            while (picOffset < frameData.length && frameData[picOffset] !== 0) picOffset++;
            picOffset++; 
            const imgData = frameData.slice(picOffset);
            result.picture = {
              format: mimeType || 'image/jpeg',
              data: 'data:' + (mimeType || 'image/jpeg') + ';base64,' + imgData.toString('base64')
            };
          }
        }
      }
      // Check FLAC header
      else if (data[0] === 0x66 && data[1] === 0x4C && data[2] === 0x61 && data[3] === 0x43) {
        let offset = 4;
        while (offset < data.length - 4) {
          const header = data[offset];
          const isLast = (header & 0x80) !== 0;
          const blockType = header & 0x7F;
          const blockLen = (data[offset+1] << 16) | (data[offset+2] << 8) | data[offset+3];
          offset += 4;

          if (blockType === 6) { // PICTURE
            // Parse FLAC PICTURE block
            let pOffset = offset;
            const picType = (data[pOffset] << 24) | (data[pOffset+1] << 16) | (data[pOffset+2] << 8) | data[pOffset+3];
            pOffset += 4;
            const mimeLen = (data[pOffset] << 24) | (data[pOffset+1] << 16) | (data[pOffset+2] << 8) | data[pOffset+3];
            pOffset += 4;
            const mimeType = data.slice(pOffset, pOffset + mimeLen).toString('ascii');
            pOffset += mimeLen;
            const descLen = (data[pOffset] << 24) | (data[pOffset+1] << 16) | (data[pOffset+2] << 8) | data[pOffset+3];
            pOffset += 4 + descLen;
            // skip width, height, depth, colors (4 * 4 bytes = 16 bytes)
            pOffset += 16;
            const imgLen = (data[pOffset] << 24) | (data[pOffset+1] << 16) | (data[pOffset+2] << 8) | data[pOffset+3];
            pOffset += 4;
            const imgData = data.slice(pOffset, pOffset + imgLen);
            result.picture = {
              format: mimeType || 'image/jpeg',
              data: 'data:' + (mimeType || 'image/jpeg') + ';base64,' + imgData.toString('base64')
            };
            break;
          }

          offset += blockLen;
          if (isLast) break;
        }
      }
      return result;
    } catch (e) {
      console.error('read-music-tags error:', e.message);
      return { title: null, artist: null, picture: null };
    }
  });

  // Launch on startup toggle
  // Use the installed .exe path so no terminal window pops up on boot
  const exePath = app.isPackaged ? process.execPath : process.execPath;
  ipcMain.handle('set-login-item', (event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,   // start silently, no visible terminal
      path: exePath,
      args: ['--hidden']    // suppress any startup flash
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('get-login-item', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  // Setup idle detection for screensaver
  setInterval(() => {
    const settings = loadSettings();
    const idleTime = powerMonitor.getSystemIdleTime();
    // Default to 5 minutes if not set or zero
    const timeout = settings.idleTimeout > 0 ? settings.idleTimeout : 300;
    
    if (idleTime >= timeout) {
      triggerScreensaver(true);
    } else {
      triggerScreensaver(false);
    }
  }, 1000);

  // Expose a way to test screensaver manually
  ipcMain.on('test-screensaver', () => {
    triggerScreensaver(true);
    // Revert after 5 seconds
    setTimeout(() => triggerScreensaver(false), 5000);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
