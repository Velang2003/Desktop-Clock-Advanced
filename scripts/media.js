/**
 * media.js — Offline music player
 * All DOM elements are declared here after index.html defines them.
 */

// Grab stable DOM elements from index.html
const mediaModule   = document.getElementById('media-module');
const playPauseBtn  = document.getElementById('media-playpause');
const prevBtn       = document.getElementById('media-prev');
const nextBtn       = document.getElementById('media-next');
const titleEl       = document.getElementById('media-title-text');
const artistEl      = document.getElementById('media-artist-text');
const thumbImg      = document.getElementById('media-thumb-img');
const thumbPlaceholder = document.getElementById('media-thumb-placeholder');

const audioPlayer = new Audio();
let playlist      = [];
let currentIndex  = 0;
let isPlaying     = false;

// ─── Path → file URL helper ───────────────────────────────────────────────────
function pathToFileUrl(filePath) {
    // Normalise slashes, then encode each path segment individually
    // so spaces and special characters work, but the drive colon (C:) is kept.
    const segments = filePath.replace(/\\/g, '/').split('/');
    const encoded  = segments.map((s, i) => {
        // First segment on Windows is the drive letter like "C:" – don't encode it
        if (i === 0 && /^[A-Za-z]:$/.test(s)) return s;
        return encodeURIComponent(s);
    });
    return 'file:///' + encoded.join('/');
}

// ─── Marquee helper ───────────────────────────────────────────────────────────
function applyMarquee(el) {
    // Allow browser to paint, then measure overflow
    requestAnimationFrame(() => {
        const containerWidth = el.parentElement.clientWidth;
        const textWidth = el.scrollWidth;
        const overflow = textWidth - containerWidth;
        if (overflow > 4) {
            // Set a CSS variable so keyframe knows how far to scroll
            el.style.setProperty('--scroll-dist', `-${overflow + 10}px`);
            el.classList.add('marquee-active');
        } else {
            el.style.removeProperty('--scroll-dist');
            el.classList.remove('marquee-active');
        }
    });
}

// ─── Load a track by index ────────────────────────────────────────────────────
async function loadTrack(index) {
    if (playlist.length === 0) return;
    const trackPath = playlist[index];

    // Set audio source
    audioPlayer.src = pathToFileUrl(trackPath);
    audioPlayer.load();

    // Reset UI to filename / placeholder thumbnail first
    const filename = trackPath.replace(/\\/g, '/').split('/').pop();
    titleEl.innerText  = filename;
    titleEl.title      = filename;
    artistEl.innerText = 'Unknown Artist';
    thumbImg.style.display        = 'none';
    thumbPlaceholder.style.display = 'flex';
    
    // Start marquee if name is too long
    applyMarquee(titleEl);
    applyMarquee(artistEl);

    // Fetch tags via IPC
    if (window.electronAPI) {
        try {
            const tags = await window.electronAPI.readMusicTags(trackPath);
            if (tags.title) {
                titleEl.innerText = tags.title;
                titleEl.title = tags.title;
            }
            if (tags.artist) {
                artistEl.innerText = tags.artist;
            }
            if (tags.picture && tags.picture.data) {
                thumbImg.src = tags.picture.data;
                thumbImg.style.display = 'block';
                thumbPlaceholder.style.display = 'none';
            }
            // Re-apply marquee based on new text length
            applyMarquee(titleEl);
            applyMarquee(artistEl);
        } catch (e) {
            console.error("Failed to read tags", e);
        }
    }
}

// ─── Playback helpers ─────────────────────────────────────────────────────────
function playTrack() {
    if (playlist.length === 0) return;
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="ph ph-pause"></i>';
        })
        .catch(err => {
            console.error('Audio playback error:', err);
            titleEl.innerText = '⚠ Cannot play this file';
        });
}

function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="ph ph-play"></i>';
}

// ─── Button handlers ──────────────────────────────────────────────────────────
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) pauseTrack(); else playTrack();
});

nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(currentIndex);
    if (isPlaying) playTrack();
});

prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentIndex);
    if (isPlaying) playTrack();
});

// Auto advance to next track
audioPlayer.addEventListener('ended', () => nextBtn.click());

// ─── Directory loader ─────────────────────────────────────────────────────────
async function updateMusicDirectory(dirPath) {
    if (!dirPath) {
        mediaModule.style.display = 'none';
        return;
    }

    const files = await window.electronAPI.readMusicDir(dirPath);
    if (files && files.length > 0) {
        playlist      = files;
        currentIndex  = 0;
        loadTrack(0);
        mediaModule.style.display = 'flex';
    } else {
        mediaModule.style.display = 'none';
        console.warn('No audio files found in:', dirPath);
    }
}

// ─── IPC Integration ──────────────────────────────────────────────────────────
if (window.electronAPI) {
    window.electronAPI.getSettings().then(settings => {
        if (settings && settings.musicDir) {
            updateMusicDirectory(settings.musicDir);
        }
    });

    window.electronAPI.onSettingsUpdated(settings => {
        if (settings) {
            updateMusicDirectory(settings.musicDir || '');
        }
    });
} else {
    console.warn('electronAPI not available – media player in browser mode');
}
