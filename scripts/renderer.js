// Elements
const hourEl = document.getElementById('hour');
const minuteEl = document.getElementById('minute');
const secondEl = document.getElementById('second');
const ampmEl = document.getElementById('ampm');
const secondColonEl = document.getElementById('second-colon');
const dateDisplay = document.getElementById('date-display');
const worldClockModule = document.getElementById('world-clock-module');
const worldTimeEl = document.getElementById('world-time');
const settingsBtn = document.getElementById('settings-btn');
const dynamicFont = document.getElementById('dynamic-custom-font');
const dynamicColors = document.getElementById('dynamic-colors');

let currentSettings = null;
let lastHour = -1;
let lastMinute = -1;
let lastSecond = -1;

// Helper to trigger animation
function updateWithTransition(element, newValue, transitionClass) {
    if (element.innerText !== newValue) {
        element.classList.remove(transitionClass);
        // Trigger reflow to restart animation
        void element.offsetWidth;
        element.innerText = newValue;
        element.classList.add(transitionClass);
    }
}

function updateClock() {
    if (!currentSettings) return;

    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    let ampm = '';
    if (currentSettings.showAmPm) {
        ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        ampmEl.style.display = 'inline';
        ampmEl.innerText = ampm;
    } else {
        ampmEl.style.display = 'none';
        // Add leading zero for 24h mode if needed
        hours = hours < 10 ? '0' + hours : hours;
    }

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;

    const transClass = 'transition-' + currentSettings.transitionType;

    if (hours !== lastHour) {
        updateWithTransition(hourEl, hours.toString(), transClass);
        lastHour = hours;
    }
    
    if (minutes !== lastMinute) {
        updateWithTransition(minuteEl, minutesStr.toString(), transClass);
        lastMinute = minutes;
    }

    if (currentSettings.timeFormat === 'HH:MM:SS') {
        secondEl.style.display = 'inline-block';
        secondColonEl.style.display = 'inline-block';
        if (seconds !== lastSecond) {
            updateWithTransition(secondEl, secondsStr.toString(), transClass);
            lastSecond = seconds;
        }
    } else {
        secondEl.style.display = 'none';
        secondColonEl.style.display = 'none';
    }

    // Update Date
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    dateDisplay.innerText = now.toLocaleDateString(undefined, options);

    // Update World Clock
    if (currentSettings.worldClockTz) {
        worldClockModule.style.display = 'flex';
        try {
            const tzOptions = { timeZone: currentSettings.worldClockTz, hour: '2-digit', minute: '2-digit', hour12: currentSettings.showAmPm };
            const worldTimeStr = new Intl.DateTimeFormat('en-US', tzOptions).format(now);
            worldTimeEl.innerText = `${currentSettings.worldClockTz.split('/').pop().replace('_', ' ')} ${worldTimeStr}`;
        } catch (e) {
            worldTimeEl.innerText = "Invalid TZ";
        }
    } else {
        worldClockModule.style.display = 'none';
    }
}

function applySettings(settings) {
    currentSettings = settings;
    
    // Apply Colors and Backgrounds
    let bgImageCss = '';
    if (settings.bgImage) {
        const bgUrl = `file:///${settings.bgImage.replace(/\\/g, '/')}`;
        bgImageCss = `background-image: linear-gradient(${settings.colors.background}, ${settings.colors.background}), url('${bgUrl}') !important; background-size: cover !important; background-position: center !important;`;
    }

    let textImageCss = '';
    if (settings.textImage) {
        const textUrl = `file:///${settings.textImage.replace(/\\/g, '/')}`;
        textImageCss = `
            .digit, .colon, .ampm {
                background-image: url('${textUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                color: transparent !important;
            }
        `;
    }

    dynamicColors.innerHTML = `
        :root {
            --text-color: ${settings.colors.text};
            --bg-color: ${settings.colors.background};
            --primary-accent: ${settings.colors.text};
        }
        .widget-container {
            ${bgImageCss}
        }
        ${textImageCss}
    `;

    // Apply Font
    if (settings.fontPath) {
        // Convert local path to file URL to use in CSS
        const fontUrl = `file:///${settings.fontPath.replace(/\\/g, '/')}`;
        dynamicFont.innerHTML = `
            @font-face {
                font-family: 'CustomFont';
                src: url('${fontUrl}');
            }
            body { font-family: 'CustomFont', 'Inter', sans-serif !important; }
        `;
    } else {
        dynamicFont.innerHTML = `body { font-family: 'Inter', sans-serif !important; }`;
    }

    // Immediately force clock update to reflect format changes
    lastHour = -1;
    updateClock();
}

// IPC Listeners
if (window.electronAPI) {
    window.electronAPI.getSettings().then(applySettings);
    
    window.electronAPI.onSettingsUpdated((newSettings) => {
        applySettings(newSettings);
    });

    window.electronAPI.onScreensaverMode((isActive) => {
        if (isActive) {
            document.body.classList.add('screensaver-mode');
        } else {
            document.body.classList.remove('screensaver-mode');
        }
    });

    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openSettings();
    });
} else {
    // Fallback for browser testing
    currentSettings = {
        timeFormat: 'HH:MM:SS',
        showAmPm: true,
        transitionType: 'slide',
        colors: { text: '#ffffff', background: 'rgba(0,0,0,0.2)' }
    };
    applySettings(currentSettings);
}

// Start Clock
setInterval(updateClock, 1000);
updateClock();
