/**
 * Twitch Status Checker for StealthyLabs
 * Checks if the channel is live and updates the UI accordingly.
 */

// Configuration
const TWITCH_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Placeholder for Client ID as requested
const CHANNEL_NAME = 'stealthylabs';
const CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Checks if the Twitch channel is live using a proxy API to avoid exposing secrets
 * or dealing with complex OAuth flows on the client side.
 * using decapi.me which is a standard tool for this in the streaming community.
 */
async function checkStreamStatus() {
    try {
        // We use uptime as a proxy for "is live". 
        // If the channel is offline, it returns "Channel is offline" (or similar).
        // If online, it returns the uptime string.
        const response = await fetch(`https://decapi.me/twitch/uptime/${CHANNEL_NAME}`);
        const text = await response.text();

        // If the text does NOT contain "offline", the stream is likely live.
        // decapi.me usually returns "stealthylabs is offline" content.
        const isLive = !text.includes('offline');

        if (isLive) {
            setLiveStatus(true);
        } else {
            console.log('StealthyLabs is offline.');
        }

    } catch (error) {
        console.error('Error checking Twitch status:', error);
    }
}

/**
 * Updates the DOM to show the live status.
 */
function setLiveStatus(isLive) {
    if (!isLive) return;

    // Target the specific element: "FPS Gaming" title
    // Logic: Look for the element with data-key="card_gaming_title"
    const gamingTitle = document.querySelector('[data-key="card_gaming_title"]');

    if (gamingTitle) {
        // 1. Add LIVE badge
        // Check if badge already exists to avoid duplicates
        if (!gamingTitle.querySelector('.live-badge')) {
            const badge = document.createElement('span');
            badge.className = 'live-badge';
            badge.textContent = 'LIVE';

            // Inline styles for the badge to ensure it looks good immediately
            Object.assign(badge.style, {
                backgroundColor: '#ff0000',
                color: 'white',
                fontSize: '0.7em',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '10px',
                verticalAlign: 'middle',
                display: 'inline-block',
                boxShadow: '0 0 10px rgba(255, 0, 0, 0.7)',
                animation: 'pulse 2s infinite'
            });

            // Add simple pulse animation keyframes if not present
            if (!document.getElementById('live-pulse-style')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'live-pulse-style';
                styleSheet.textContent = `
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `;
                document.head.appendChild(styleSheet);
            }

            gamingTitle.appendChild(badge);
        }

        // 2. Change border/glow of the card
        const card = gamingTitle.closest('.card');
        if (card) {
            card.style.border = '1px solid rgba(255, 0, 0, 0.5)';
            card.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.2)';
        }
    }
}

// Run the check when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    checkStreamStatus();
    // Optional: Set up an interval to check periodically
    // setInterval(checkStreamStatus, CHECK_INTERVAL);
});
