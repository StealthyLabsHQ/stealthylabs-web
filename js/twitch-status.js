// Client ID Twitch (Helix) - Not used directly due to static nature (CORS/Auth)
// CLIENT_ID = 'jjsy86yjlitq69q888s5lcawh7w534'; 
const CHANNEL_NAME = 'stealthylabs';
const UPTIME_API = `https://decapi.me/twitch/uptime/${CHANNEL_NAME}`;
const TITLE_API = `https://decapi.me/twitch/title/${CHANNEL_NAME}`;
const CHECK_INTERVAL = 60000; // Check every 60s

async function checkTwitchStatus() {
    try {
        const response = await fetch(UPTIME_API);
        const uptime = await response.text();

        if (uptime.toLowerCase().includes('offline')) {
            console.log(`StealthyLabs is OFFLINE. (${uptime})`);
            return;
        }

        console.log(`StealthyLabs is LIVE! Uptime: ${uptime}`);

        const titleResponse = await fetch(TITLE_API);
        const streamTitle = await titleResponse.text();

        setLiveMode(streamTitle);

    } catch (error) {
        console.error('Error checking Twitch status:', error);
    }
}

function setLiveMode(title) {
    const gamingTitle = document.querySelector('[data-key="card_gaming_title"]');
    if (!gamingTitle) return;

    const card = gamingTitle.closest('.card');
    if (card) {
        card.classList.add('is-live');
    }

    let iconContainer = card.querySelector('.card-icon');
    if (iconContainer) {
        iconContainer.innerHTML = `<span class="live-badge">🔴 LIVE</span>`;
    }

    const descElement = card.querySelector('[data-key="card_gaming_desc"]');
    if (descElement) {
        descElement.textContent = title || "En direct sur Twitch !";
        descElement.style.color = "#ffffff";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkTwitchStatus();
    setTimeout(checkTwitchStatus, CHECK_INTERVAL);
});
