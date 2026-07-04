const timeFormatEl = document.getElementById('time-format');
const showAmPmEl = document.getElementById('show-ampm');
const transitionTypeEl = document.getElementById('transition-type');
const fontFileEl = document.getElementById('font-file');
const currentFontEl = document.getElementById('current-font');
const textColorEl = document.getElementById('text-color');
const bgColorEl = document.getElementById('bg-color');
const bgOpacityEl = document.getElementById('bg-opacity');
const bgOpacityValEl = document.getElementById('bg-opacity-val');
const launchStartupEl = document.getElementById('launch-startup');
const bgImageEl = document.getElementById('bg-image');
const currentBgImageEl = document.getElementById('current-bg-image');
const textImageEl = document.getElementById('text-image');
const currentTextImageEl = document.getElementById('current-text-image');
const pomodoroTimeEl = document.getElementById('pomodoro-time');
const idleTimeoutEl = document.getElementById('idle-timeout');
const reminderMsgEl = document.getElementById('reminder-msg');
const worldClockTzEl = document.getElementById('world-clock-tz');
const testScreensaverBtn = document.getElementById('test-screensaver-btn');
const selectMusicDirBtn = document.getElementById('select-music-dir-btn');
const currentMusicDirEl = document.getElementById('current-music-dir');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

let currentSettings = null;

const defaultSettings = {
  timeFormat: 'HH:MM:SS',
  showAmPm: true,
  transitionType: 'fade',
  fontPath: '',
  bgImage: '',
  textImage: '',
  musicDir: '',
  worldClockTz: '',
  colors: {
    text: '#ffffff',
    background: 'rgba(0, 0, 0, 0.2)'
  },
  pomodoroTime: 25,
  idleTimeout: 300,
  reminderMessage: 'Pomodoro session complete! Take a break.'
};

function rgbaToHex(rgba) {
    if (!rgba) return '#000000';
    if (rgba.startsWith('#')) return rgba.substring(0, 7);
    const match = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#000000';
}

function hexToRgba(hex, alpha = 0.2) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function populateSettings(settings) {
    currentSettings = settings;
    timeFormatEl.value = settings.timeFormat || 'HH:MM:SS';
    showAmPmEl.checked = settings.showAmPm;
    transitionTypeEl.value = settings.transitionType || 'fade';
    textColorEl.value = settings.colors.text || '#ffffff';
    pomodoroTimeEl.value = settings.pomodoroTime || 25;
    idleTimeoutEl.value = settings.idleTimeout || 300;
    reminderMsgEl.value = settings.reminderMessage || 'Pomodoro session complete! Take a break.';
    worldClockTzEl.value = settings.worldClockTz || '';
    bgColorEl.value = rgbaToHex(settings.colors.background || 'rgba(0,0,0,0.2)');
    bgOpacityEl.value = settings.bgOpacity !== undefined ? Math.round(settings.bgOpacity * 100) : 20;
    bgOpacityValEl.innerText = bgOpacityEl.value;
    launchStartupEl.checked = settings.launchOnStartup || false;
    
    currentFontEl.innerText = settings.fontPath ? `Current: ${settings.fontPath.split('\\').pop()}` : 'No custom font selected';
    currentBgImageEl.innerText = settings.bgImage ? `Current: ${settings.bgImage.split('\\').pop()}` : 'No image selected';
    currentTextImageEl.innerText = settings.textImage ? `Current: ${settings.textImage.split('\\').pop()}` : 'No image selected';
    currentMusicDirEl.innerText = settings.musicDir ? `Current: ${settings.musicDir}` : 'No folder selected';
}

if (window.electronAPI) {
    window.electronAPI.getSettings().then((settings) => {
        populateSettings(settings);
        // Also fetch actual OS startup state
        window.electronAPI.getLoginItem().then(enabled => {
            launchStartupEl.checked = enabled;
            if (currentSettings) currentSettings.launchOnStartup = enabled;
        });
    });

    testScreensaverBtn.addEventListener('click', () => {
        window.electronAPI.testScreensaver();
    });

    selectMusicDirBtn.addEventListener('click', async () => {
        const dir = await window.electronAPI.selectDir();
        if (dir && currentSettings) {
            currentSettings.musicDir = dir;
            currentMusicDirEl.innerText = `Selected: ${dir}`;
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset all settings to defaults? This will remove custom fonts and images.")) {
            // Keep window size/pos if possible
            const resetConf = { ...defaultSettings };
            if (currentSettings.widgetSize) resetConf.widgetSize = currentSettings.widgetSize;
            if (currentSettings.widgetPosition) resetConf.widgetPosition = currentSettings.widgetPosition;
            
            populateSettings(resetConf);
            window.electronAPI.saveSettings(resetConf);
            
            resetBtn.innerHTML = '<i class="ph ph-check"></i> Reset!';
            setTimeout(() => resetBtn.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Reset to Defaults', 2000);
        }
    });

    bgOpacityEl.addEventListener('input', (e) => {
        bgOpacityValEl.innerText = e.target.value;
    });

    saveBtn.addEventListener('click', () => {
        if (!currentSettings) return;

        currentSettings.timeFormat = timeFormatEl.value;
        currentSettings.showAmPm = showAmPmEl.checked;
        currentSettings.transitionType = transitionTypeEl.value;
        currentSettings.colors.text = textColorEl.value;
        currentSettings.pomodoroTime = parseInt(pomodoroTimeEl.value) || 25;
        currentSettings.idleTimeout = parseInt(idleTimeoutEl.value) || 300;
        currentSettings.reminderMessage = reminderMsgEl.value;
        currentSettings.worldClockTz = worldClockTzEl.value;
        currentSettings.bgOpacity = parseInt(bgOpacityEl.value) / 100;
        currentSettings.colors.background = hexToRgba(bgColorEl.value, currentSettings.bgOpacity);
        currentSettings.launchOnStartup = launchStartupEl.checked;

        // Save OS startup state via IPC
        window.electronAPI.setLoginItem(currentSettings.launchOnStartup);

        if (fontFileEl.files.length > 0) currentSettings.fontPath = fontFileEl.files[0].path;
        if (bgImageEl.files.length > 0) currentSettings.bgImage = bgImageEl.files[0].path;
        if (textImageEl.files.length > 0) currentSettings.textImage = textImageEl.files[0].path;

        window.electronAPI.saveSettings(currentSettings);
        
        saveBtn.innerHTML = '<i class="ph ph-check"></i> Saved!';
        setTimeout(() => saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save All Settings', 2000);
    });
}
