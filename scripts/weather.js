// Simple weather integration using open-meteo (no API key required)
const weatherModule = document.getElementById('weather-module');
const weatherTemp = document.getElementById('weather-temp');

// Default coordinates (e.g., London, can be made configurable in settings later)
const lat = 51.5074;
const lon = -0.1278;

async function fetchWeather() {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (response.ok) {
            const data = await response.json();
            const temp = Math.round(data.current_weather.temperature);
            weatherTemp.innerText = `${temp}°C`;
        } else {
            weatherTemp.innerText = 'Err';
        }
    } catch (error) {
        console.error("Failed to fetch weather", error);
        weatherTemp.innerText = '--°';
    }
}

// Fetch weather every 30 minutes
fetchWeather();
setInterval(fetchWeather, 30 * 60 * 1000);
