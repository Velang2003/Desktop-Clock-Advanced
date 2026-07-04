const pomodoroModule = document.getElementById('pomodoro-module');
const pomodoroToggleBtn = document.getElementById('pomodoro-toggle-btn');
const pomodoroTimeDisplay = document.getElementById('pomodoro-time');
const pomodoroStartBtn = document.getElementById('pomodoro-start');
const pomodoroResetBtn = document.getElementById('pomodoro-reset');
const playIcon = '<i class="ph ph-play"></i>';
const pauseIcon = '<i class="ph ph-pause"></i>';

let pomodoroTimer = null;
let currentPomodoroMins = 25;
let currentReminderMsg = "Pomodoro session complete! Take a break.";
let timeLeft = currentPomodoroMins * 60;
let isRunning = false;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    pomodoroTimeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showReminder(text) {
    const popup = document.getElementById('reminder-popup');
    document.getElementById('reminder-text').innerText = text;
    popup.style.display = 'flex';
    
    document.getElementById('reminder-dismiss').onclick = () => {
        popup.style.display = 'none';
    };
    
    // Auto dismiss after 10 seconds
    setTimeout(() => {
        popup.style.display = 'none';
    }, 10000);
}

pomodoroToggleBtn.addEventListener('click', () => {
    const isHidden = pomodoroModule.style.display === 'none';
    pomodoroModule.style.display = isHidden ? 'flex' : 'none';
});

pomodoroStartBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(pomodoroTimer);
        pomodoroStartBtn.innerHTML = playIcon;
        isRunning = false;
    } else {
        pomodoroStartBtn.innerHTML = pauseIcon;
        isRunning = true;
        pomodoroTimer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(pomodoroTimer);
                isRunning = false;
                pomodoroStartBtn.innerHTML = playIcon;
                showReminder(currentReminderMsg);
            }
        }, 1000);
    }
});

pomodoroResetBtn.addEventListener('click', () => {
    clearInterval(pomodoroTimer);
    isRunning = false;
    timeLeft = currentPomodoroMins * 60;
    pomodoroStartBtn.innerHTML = playIcon;
    updateDisplay();
});

// Listen to settings update to change default pomodoro time
if (window.electronAPI) {
    window.electronAPI.onSettingsUpdated((settings) => {
        if (settings) {
            if (settings.pomodoroTime) {
                currentPomodoroMins = settings.pomodoroTime;
                if (!isRunning) {
                    timeLeft = currentPomodoroMins * 60;
                    updateDisplay();
                }
            }
            if (settings.reminderMessage) {
                currentReminderMsg = settings.reminderMessage;
            }
        }
    });
    
    // Initial fetch to set the correct time on load
    window.electronAPI.getSettings().then((settings) => {
        if (settings) {
            if (settings.pomodoroTime) {
                currentPomodoroMins = settings.pomodoroTime;
                timeLeft = currentPomodoroMins * 60;
                updateDisplay();
            }
            if (settings.reminderMessage) {
                currentReminderMsg = settings.reminderMessage;
            }
        }
    });
}

updateDisplay();
