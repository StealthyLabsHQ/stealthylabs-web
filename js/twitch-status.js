// Client ID Twitch (Helix) - Not used directly due to static nature (CORS/Auth)
// CLIENT_ID = 'jjsy86yjlitq69q888s5lcawh7w534'; 
const CHANNEL_NAME = 'stealthylabs';
const UPTIME_API = `https://decapi.me/twitch/uptime/${CHANNEL_NAME}`;
const TITLE_API = `https://decapi.me/twitch/title/${CHANNEL_NAME}`;
const CHECK_INTERVAL = 60000; // Check every 60s

async function checkTwitchStatus() {
    try {
        // Check Uptime
        const response = await fetch(UPTIME_API);
        const uptime = await response.text();

        // decapi returns "channel is offline" or just "offline" if not live
        if (uptime.toLowerCase().includes('offline')) {
            console.log(`StealthyLabs is OFFLINE. (${uptime})`);
            return;
        }

        // If we are here, channel is LIVE
        console.log(`StealthyLabs is LIVE! Uptime: ${uptime}`);

        // Fetch Stream Title
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
        // 1. Add Neon Border / Glow
        card.classList.add('is-live');
    }

    // 2. Add "LIVE" Badge
    // Check if badge already exists to avoid duplicates
    let iconContainer = card.querySelector('.card-icon');
    if (iconContainer) {
        // Create badge if not present (or just replace content)
        // We want to replace the existing icon icon <i class="..."> with the badge
        // OR append it. Request said "Replace the icon... by a 'LIVE' indicator"
        // Let's keep the gamepad but ADD the badge next to it, or strictly replace?
        // "Remplace l'icône Twitch par un indicateur '🔴 LIVE' qui clignote." -> Strictly replace or overlay.
        // Let's replace the inner HTML of card-icon to be safe and clean.

        iconContainer.innerHTML = `<span class="live-badge">🔴 LIVE</span>`;
    }

    // 3. Update Description with Stream Title
    const descElement = card.querySelector('[data-key="card_gaming_desc"]');
    if (descElement) {
        // Truncate if too long (optional, but good practice)
        descElement.textContent = title || "En direct sur Twitch !";
        descElement.style.color = "#ffffff"; // Make it pop a bit more than muted text
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
    checkTwitchStatus();
    // Optional: Poll every 60s
    setTimeout(checkTwitchStatus, CHECK_INTERVAL);
});
