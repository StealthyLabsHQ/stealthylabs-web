const TWITCH_CLIENT_ID = 'jjsy86yjlitq69q888s5lcawh7w534';
const CHANNEL_NAME = 'stealthylabs';
const CHECK_INTERVAL = 60000;

async function checkStreamStatus() {
    try {
        const response = await fetch(`https://decapi.me/twitch/uptime/${CHANNEL_NAME}`);
        const text = await response.text();

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

function setLiveStatus(isLive) {
    if (!isLive) return;

    const gamingTitle = document.querySelector('[data-key="card_gaming_title"]');

    if (gamingTitle) {
        if (!gamingTitle.querySelector('.live-badge')) {
            const badge = document.createElement('span');
            badge.className = 'live-badge';
            badge.textContent = 'LIVE';

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

        const card = gamingTitle.closest('.card');
        if (card) {
            card.style.border = '1px solid rgba(255, 0, 0, 0.5)';
            card.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.2)';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkStreamStatus();
});
