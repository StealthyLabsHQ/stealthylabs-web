// =====================================================
// SCRIPT SOCIAL (social.html uniquement)
// =====================================================

const JSON_PATH = 'translations/'; 
let currentLang = 'fr';
let currentTranslations = {};

// --- INITIALISATION ---
(function init() {
    updateClock();
    setInterval(updateClock, 1000);
    detectAndApplyLanguage();
    loadSavedFont();

    // Modules spécifiques Social
    updateDiscordStatus();
    updateServerStats();
    setInterval(updateDiscordStatus, 30000);
    setInterval(updateServerStats, 60000);

    // Gestionnaire fermeture menu (Spécifique au bouton "top-icon-btn" de cette page)
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        // Sur social.html, le bouton est une icône image dans un lien/bouton
        const btn = event.target.closest('button[onclick="toggleSettings()"]');
        
        if (panel && panel.classList.contains('show')) {
            // Si on clique en dehors du panneau ET en dehors du bouton
            if (!panel.contains(event.target) && !btn) {
                panel.classList.remove('show');
            }
        }
    });
})();

// --- FONCTIONS COMMUNES (Langue/Heure/Font) ---
function detectAndApplyLanguage() {
    const savedLang = localStorage.getItem('userLang');
    const browserLang = navigator.language || navigator.userLanguage;

    if (savedLang) {
        currentLang = savedLang;
    } else {
        currentLang = browserLang.startsWith('fr') ? 'fr' : 'en';
    }

    const langSelect = document.getElementById('languageSelector');
    if(langSelect) langSelect.value = currentLang;

    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(response => {
            if (!response.ok) throw new Error(`Erreur langue ${lang}`);
            return response.json();
        })
        .then(data => {
            currentTranslations = data; 
            applyTranslations();
            updateClock();
            
            // Mise à jour des textes dynamiques Discord après trad
            updateDiscordStatus();
            updateServerStats();

            // Carte Guides (Seulement en FR)
            const guidesCard = document.getElementById('guidesCard');
            if (guidesCard) guidesCard.style.display = (lang === 'fr') ? 'flex' : 'none';
        })
        .catch(console.error);
}

function applyTranslations() {
    if (!currentTranslations) return;
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) elem.innerHTML = currentTranslations[key];
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

function changeFont(font) {
    document.documentElement.style.setProperty('--main-font', font);
    localStorage.setItem('userFont', font);
}

function loadSavedFont() {
    const saved = localStorage.getItem('userFont');
    if (saved) {
        document.documentElement.style.setProperty('--main-font', saved);
        if(document.getElementById('fontSelector')) document.getElementById('fontSelector').value = saved;
    }
}

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeString = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if (currentLang !== 'en') timeString = timeString.replace(':', ':');
    clockEl.innerText = timeString;
}

// --- MODULES DISCORD & SOCIAL ---

function updateDiscordStatus() {
    const userId = "1071461037741723648"; 
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const d = data.data;
            
            // Live Badge
            const liveBadge = document.getElementById('liveBadge');
            const mainAvatar = document.querySelector('.avatar');
            let isStreaming = false;
            if (d.activities) {
                isStreaming = d.activities.some(a => a.type === 1 || (a.name && a.name.toLowerCase() === 'twitch'));
            }

            if (liveBadge && mainAvatar) {
                if (isStreaming) {
                    liveBadge.style.display = 'block';
                    mainAvatar.classList.add('streaming');
                    liveBadge.innerText = (currentLang === 'fr') ? "EN LIVE" : "LIVE";
                } else {
                    liveBadge.style.display = 'none';
                    mainAvatar.classList.remove('streaming');
                }
            }

            // Avatar & Status
            const avatarImg = document.getElementById('discordAvatar');
            const statusDot = document.getElementById('discordStatus');
            const activityEl = document.getElementById('discordActivity'); 

            if (avatarImg) avatarImg.src = `https://cdn.discordapp.com/avatars/${userId}/${d.discord_user.avatar}.png?size=128`;
            if (statusDot) statusDot.className = 'discord-status-dot ' + d.discord_status;

            // Texte d'activité
            let statusText = d.discord_status;
            if (currentTranslations[`status_${d.discord_status}`]) statusText = currentTranslations[`status_${d.discord_status}`];
            
            let html = `<div style="color:#888; font-size:0.8rem;">${statusText}</div>`;

            // Spotify / Jeu
            if (d.listening_to_spotify && d.spotify) {
                const s = d.spotify;
                html += `<div class="rp-game-row" style="align-items: flex-start;">
                        <img src="${s.album_art_url}" class="rp-game-icon" style="margin-top: 4px;">
                        <div class="rp-game-info">
                            <div class="rp-game-title" style="color: #fff; font-weight: 700;">${s.song}</div>
                            <div class="rp-game-detail" style="color: #ccc;">${s.artist}</div>
                        </div>
                    </div>`;
            } else {
                const game = d.activities.find(a => a.type !== 4 && a.name !== "Spotify" && a.assets);
                if (game) {
                    let icon = game.assets.large_image.startsWith("mp:") 
                        ? `https://media.discordapp.net/${game.assets.large_image.slice(3)}`
                        : `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                    html += `<div class="rp-game-row"><img src="${icon}" class="rp-game-icon"><div class="rp-game-info"><div class="rp-game-title">${game.name}</div><div class="rp-game-detail">${game.details || game.state || ""}</div></div></div>`;
                }
            }
            if (activityEl) activityEl.innerHTML = html;
        })
        .catch(() => {});
}

function updateServerStats() {
    const inviteCode = "7CJbppbFdw"; 
    fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`)
        .then(res => res.json())
        .then(data => {
            const statsEl = document.getElementById('serverStats');
            if (!statsEl) return;
            
            if (data.guild && document.getElementById('serverName')) {
                document.getElementById('serverName').innerText = data.guild.name;
                document.getElementById('serverIcon').src = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png`;
            }
            
            const online = data.approximate_presence_count;
            const total = data.approximate_member_count;
            const green = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
            const grey = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;

            if (currentLang === 'fr') statsEl.innerHTML = `${green} ${online} En ligne ${grey} ${total} Membres`;
            else statsEl.innerHTML = `${green} ${online} Online ${grey} ${total} Members`;
        })
        .catch(() => {});
}

// Exports
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;