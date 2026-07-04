<div align="center">

<h1>🕐 Desktop Clock — Advanced Widget</h1>

<p>
  <strong>A feature-rich, fully customizable desktop clock widget &amp; screensaver for Windows — built with Electron.</strong>
</p>

<p>
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows&logoColor=white" alt="Platform: Windows"/>
  <img src="https://img.shields.io/badge/Electron-31.x-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/License-ISC-green?style=for-the-badge" alt="License: ISC"/>
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge" alt="Version"/>
</p>

<p>
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-build--distribute">Build</a> •
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## ✨ Overview

**Desktop Clock Advanced** is a sleek, transparent **desktop widget** that floats on your Windows wallpaper — no taskbar icon, no window chrome, just pure information at a glance. It doubles as a full-screen **screensaver** when your PC goes idle, and packs in a surprisingly rich set of productivity and media tools all within a single lightweight Electron application.

---
##  Screenshots

| Widget View |
|:---:|
| <img src="https://github.com/Velang2003/Desktop-Clock-Advanced/blob/main/Readme%20assets/img1.png" width="450"/> |

---
## 🚀 Features

### 🕐 Clock & Time
- **Real-time clock** with second-accurate updates every 1000ms
- Switchable **12-hour (AM/PM)** and **24-hour** formats
- Optional **seconds display** — HH:MM or HH:MM:SS
- Full **date display** — weekday, month, and day, always up to date
- **Animated digit transitions** — three beautiful styles to choose from:
  - 🌟 **Fade** — smooth opacity crossfade
  - ⬆️ **Slide Up** — spring-physics upward bounce reveal
  - 🔄 **Flip** — 3D `rotateX` flip animation

### 🌍 World Clock
- Show a **second timezone** alongside your local clock
- Built-in timezone list covering major global cities:
  - UTC · New York (EST/EDT) · Los Angeles (PST/PDT) · London (GMT/BST)
  - Paris (CET/CEST) · Dubai (GST) · Tokyo (JST) · Sydney (AEST/AEDT)

### ☁️ Live Weather
- Displays the **current temperature** using [Open-Meteo](https://open-meteo.com/) — **no API key needed, completely free**
- Auto-refreshes every **30 minutes**
- Clean pill-style display integrated into the widget's info bar

### 🎵 Offline Music Player
- Full-featured **offline audio player** — point it at any local folder and go
- Supports: **MP3, FLAC, WAV, M4A, OGG, AAC**
- **Deep recursive folder scan** — finds music in all nested subdirectories
- **Custom-built ID3v2 & FLAC metadata parser** — zero external libraries:
  - 🎨 Extracts embedded **album art** (APIC / PICTURE blocks) and renders it as a thumbnail
  - 📝 Reads **track title** and **artist name** from tags; falls back to filename
  - Automatic **marquee scroll animation** for text that overflows the player area
- Playback controls: **⏮ Previous · ▶/⏸ Play/Pause · ⏭ Next**
- **Auto-advances** to the next track when a song finishes playing

### 🍅 Pomodoro Timer
- Integrated **Pomodoro focus timer** toggled directly from the widget
- Fully configurable session length: **1–120 minutes** (default 25)
- **Play / Pause / Reset** controls
- Fires a **glassmorphic in-app reminder popup** at session end
- Customizable **reminder message** set in Settings
- Popup **auto-dismisses** after 10 seconds, or manually dismiss it

### 🖥️ Screensaver Mode
- Automatically switches to a **full-screen, immersive screensaver** after configurable idle time (default: **5 minutes**)
- Uses Electron's `powerMonitor.getSystemIdleTime()` — reliable native idle detection
- Widget seamlessly **expands to full display resolution** at screensaver activation
- **Test Screensaver** button in Settings for a 5-second live preview
- Instantly **restores widget size and position** when you move the mouse or press a key

### 🎨 Appearance & Customization
- **Glassmorphism** design — `backdrop-filter: blur(16px)`, translucent border, deep shadow
- Full **text color** picker — customize the clock and date color
- **Background tint color** picker + **opacity slider** (0–100%)
- **Custom background image** — any image file as the widget backdrop
- **Clock text image mask** — use any image as a fill texture on the clock digits via CSS `-webkit-background-clip: text`
- **Custom font** — load any `.ttf`, `.otf`, `.woff`, or `.woff2` font file; applied instantly
- Fully **frameless, transparent window** — invisibly merges with your desktop

### ⚙️ Widget Behavior & System Integration
- **Draggable** anywhere on the screen — position saved on every move
- **Resizable** — size saved on every resize; both restored on next launch
- **No taskbar icon** (`skipTaskbar: true`), no window title bar
- Settings & Pomodoro **controls appear on hover** and disappear when not needed
- **Launch on Windows Startup** — uses `app.setLoginItemSettings` to silently autostart with `--hidden` flag; no terminal flash

### 🔒 Security Architecture
- `contextIsolation: true` + `nodeIntegration: false` — renderer process is sandboxed
- All Node.js APIs exposed via **preload.js** using Electron `contextBridge`
- IPC over secure `ipcRenderer.invoke` / `ipcMain.handle` channels
- User settings persisted as **JSON in AppData** — no registry writes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Electron 31.x](https://www.electronjs.org/) |
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript |
| **Typography** | [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) |
| **Icons** | [Phosphor Icons](https://phosphoricons.com/) |
| **Weather API** | [Open-Meteo](https://open-meteo.com/) (free, no API key) |
| **Packager** | [electron-builder 24.x](https://www.electron.build/) |
| **Installer** | NSIS `.exe` + Portable `.exe` — Windows x64 |

---

## 📦 Installation

### Option 1 — Download Release *(Recommended)*

Download the latest installer or portable `.exe` from the **[Releases](https://github.com/Velang2003/Desktop-Clock-Advanced-/releases)** page and run it — no setup required.

### Option 2 — Run from Source

**Prerequisites:** [Node.js](https://nodejs.org/) v18+ and Git.

```bash
# 1. Clone the repository
git clone https://github.com/Velang2003/Desktop-Clock-Advanced-.git
cd Desktop-Clock-Advanced-

# 2. Install dependencies
npm install

# 3. Launch the app
npm start
```

---

## 🎮 Usage

The widget appears floating on your desktop as soon as you launch the app. Here's a quick reference:

| Action | How-To |
|--------|--------|
| **Move the widget** | Click and drag anywhere on it |
| **Open Settings** | Hover over the widget → click the ⚙️ gear icon |
| **Toggle Pomodoro** | Hover → click the ⏱️ timer icon |
| **Enable Music Player** | Open Settings → set your local music folder → player appears |
| **Trigger Screensaver** | Leave PC idle past your timeout, or test from Settings |

### ⚙️ Settings Panel Reference

| Section | Configurable Options |
|---------|---------------------|
| **General & Time** | Time format (HH:MM / HH:MM:SS), digit transition, AM/PM, Windows startup, world clock timezone |
| **Appearance** | Text color, background tint + opacity, custom font file, background image, text image mask |
| **Productivity** | Pomodoro session length, idle screensaver timeout, reminder message, screensaver test button |
| **Offline Music** | Browse and select local music library folder |

---

## 🏗️ Build & Distribute

```bash
npm run build
```

Outputs to `dist/`:

| File | Description |
|------|-------------|
| `Desktop Clock Setup x.x.x.exe` | NSIS installer — creates Start Menu & Desktop shortcuts, runs on finish |
| `Desktop Clock x.x.x.exe` | Fully portable — run it anywhere, no installation needed |

---

## 📁 Project Structure

```
Desktop Clock/
├── main.js              # Electron main process — window creation, IPC handlers, idle detection
├── preload.js           # Context bridge — safely exposes Node/IPC APIs to the renderer
├── index.html           # Widget UI — clock, weather, media player, pomodoro, reminder popup
├── settings.html        # Settings window UI
├── styles/
│   └── main.css         # Glassmorphism widget, digit transitions, media player, screensaver
├── scripts/
│   ├── renderer.js      # Clock updates, world clock, transition animations, settings sync
│   ├── weather.js       # Open-Meteo API fetch and temperature display
│   ├── media.js         # Offline music player — ID3/FLAC parsing, playlist, marquee scroll
│   ├── pomodoro.js      # Pomodoro countdown, reminder popup, settings sync
│   └── settings.js      # Settings window — load, save, reset, font/image file pickers
├── assets/
│   └── icon.ico         # Application icon (installer + app)
├── fonts/               # Directory for custom user-loaded fonts
└── package.json         # Project metadata, scripts, and electron-builder config
```

---

## 🤝 Contributing

All contributions, bug reports, and feature ideas are welcome!

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a **Pull Request**

---

## 👨‍💻 Author

**Velang2003** · GitHub: [@Velang2003](https://github.com/Velang2003)

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <sub>Built with ❤️ using Electron · © 2025 Velang2003</sub>
</div>
