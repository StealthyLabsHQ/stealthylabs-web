// =====================================================
// SCRIPT SOCIAL (Menu, Langue, Redirection)
// =====================================================

// ATTENTION : Si vos fichiers json sont dans un dossier "translations", mettez 'translations/'
// S'ils sont à côté de social.html, laissez vide ''
const JSON_PATH = 'translations/'; 

let currentLang = 'fr';
let currentTranslations = {};
let pendingRedirectUrl = ''; 

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script Social Démarré");

    // 1. Démarrage des boucles (Horloge, Discord)
    updateClock();
    setInterval(updateClock, 1000);
    
    updateDiscordStatus();
    setInterval(updateDiscordStatus, 30000);
    
    updateServerStats();
    setInterval(updateServerStats, 60000);

    // 2. Chargement préférences
    detectAndApplyLanguage();
    loadSavedFont();

    // 3. Activation des Redirections (Pop-up)
    setupRedirections();

    // 4. Gestionnaire "Fermer menu si clic ailleurs"
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        // Si le menu est ouvert et qu'on ne clique PAS dedans
        if (panel && panel.classList.contains('show') && !panel.contains(event.target)) {
            panel.classList.remove('show');
        }
    });
});

// --- FONCTIONS UI (ENGRENAGE) ---

function toggleSettings(event) {
    // CRUCIAL : Empêche le clic de remonter au document et de refermer le menu tout de suite
    if (event) event.stopPropagation();
    
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.classList.toggle('show');
        console.log("Menu Settings basculé"); // Pour vérifier dans la console (F12)
    }
}

function toggleSocials() {
    document.getElementById('socialsWrapper').classList.toggle('open');
    document.querySelector('.socials-toggle').classList.toggle('active');
}

function copyCode() {
    navigator.clipboard.writeText("stealthylabs");
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("show");
    setTimeout(() => tooltip.classList.remove("show"), 2000);
}

// --- FONCTIONS REDIRECTION ---

function setupRedirections() {
    const links = document.querySelectorAll('a[target="_blank"]');
    links.forEach(link => {
        // On exclut les boutons de musique et les liens internes
        if (!link.classList.contains('music-platform-btn') && !link.classList.contains('no-redirect')) {
            link.addEventListener('click', (e) => {
                if (link.href.startsWith('http')) {
                    e.preventDefault(); // Bloque le lien normal
                    openRedirect(link.href); // Ouvre notre pop-up
                }
            });
        }
    });

    // Bouton de confirmation dans la pop-up
    const confirmBtn = document.getElementById('confirmRedirectBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (pendingRedirectUrl) {
                window.open(pendingRedirectUrl, '_blank');
                closeRedirect();
            }
        };
    }
}

function openRedirect(url) {
    const modal = document.getElementById('redirectOverlay');
    const urlText = document.getElementById('redirectUrl');
    if (modal && urlText) {
        pendingRedirectUrl = url;
        urlText.textContent = url;
        modal.classList.add('show');
    } else {
        // Secours si la pop-up n'existe pas
        window.open(url, '_blank');
    }
}

function closeRedirect() {
    const modal = document.getElementById('redirectOverlay');
    if (modal) modal.classList.remove('show');
}

// --- LOGIQUE LANGUE ---

function detectAndApplyLanguage() {
    const savedLang = localStorage.getItem('userLang');
    const browserLang = navigator.language || navigator.userLanguage;
    
    if (savedLang) currentLang = savedLang;
    else currentLang = browserLang.startsWith('fr') ? 'fr' : 'en';

    const langSelect = document.getElementById('languageSelector');
    if(langSelect) langSelect.value = currentLang;

    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(res => {
            if(!res.ok) throw new Error("Fichier langue introuvable (Vérifiez le dossier json/ ou translations/)");
            return res.json();
        })
        .then(data => {
            currentTranslations = data; 
            applyTranslations();
            updateClock();
            updateDiscordStatus();
            
            const guidesCard = document.getElementById('guidesCard');
            if (guidesCard) guidesCard.style.display = (lang === 'fr') ? 'flex' : 'none';
        })
        .catch(err => console.error("Erreur Langue:", err));
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
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if(currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

// --- DISCORD ---

function updateDiscordStatus() {
    const userId = "1071461037741723648"; 
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const d = data.data;
            const status = d.discord_status;
            
            const avatarImg = document.getElementById('discordAvatar');
            const statusDot = document.getElementById('discordStatus');
            const activityEl = document.getElementById('discordActivity'); 

            if (avatarImg) avatarImg.src = `https://cdn.discordapp.com/avatars/${userId}/${d.discord_user.avatar}.png?size=128`;
            if (statusDot) statusDot.className = 'discord-status-dot ' + status;

            let statusText = status;
            if (currentTranslations[`status_${status}`]) statusText = currentTranslations[`status_${status}`];
            
            let html = `<div style="color:#888; font-size:0.8rem;">${statusText}</div>`;

            if (d.listening_to_spotify && d.spotify) {
                html += `<div class="rp-game-row" style="align-items: flex-start;"><img src="${d.spotify.album_art_url}" class="rp-game-icon" style="margin-top: 4px;"><div class="rp-game-info"><div class="rp-game-title" style="color: #fff; font-weight: 700;">${d.spotify.song}</div><div class="rp-game-detail" style="color: #ccc;">${d.spotify.artist}</div></div></div>`;
            } else if (d.activities && d.activities.length > 0) {
                const game = d.activities.find(a => a.type !== 4 && a.name !== "Spotify");
                if (game && game.assets) {
                     let icon = game.assets.large_image.startsWith("mp:") ? `https://media.discordapp.net/${game.assets.large_image.slice(3)}` : `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                     html += `<div class="rp-game-row"><img src="${icon}" class="rp-game-icon"><div class="rp-game-info"><div class="rp-game-title">${game.name}</div><div class="rp-game-detail">${game.details || game.state || ""}</div></div></div>`;
                }
            }
            if (activityEl) activityEl.innerHTML = html;
        }).catch(() => {});
}

function updateServerStats() {
    const inviteCode = "7CJbppbFdw"; 
    fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`)
        .then(res => res.json())
        .then(data => {
            const statsEl = document.getElementById('serverStats');
            if (statsEl) {
                const green = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
                const grey = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;
                if (currentLang === 'fr') statsEl.innerHTML = `${green} ${data.approximate_presence_count} En ligne ${grey} ${data.approximate_member_count} Membres`;
                else statsEl.innerHTML = `${green} ${data.approximate_presence_count} Online ${grey} ${data.approximate_member_count} Members`;
            }
        }).catch(() => {});
}

// Exports globaux indispensables pour le HTML onclick=""
window.toggleSettings = toggleSettings;
window.toggleSocials = toggleSocials;
window.copyCode = copyCode;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;
window.closeRedirect = closeRedirect;