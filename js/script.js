// =====================================================
// 1. CONFIGURATION & INITIALISATION
// =====================================================
let currentLang = 'fr'; // Valeur par défaut de sécurité
let currentTranslations = {};
const JSON_PATH = 'translations/'; // Assure-toi que le dossier s'appelle bien "translations"

document.addEventListener('DOMContentLoaded', () => {
    // 1. Détecter la langue (et appliquer la sauvegarde)
    detectAndApplyLanguage();

    // 2. Charger la police sauvegardée
    loadSavedFont();

    // 3. Lancer l'horloge immédiatement (sans attendre la trad)
    updateClock(); 
    setInterval(updateClock, 1000);

    // 4. Lancer les modules annexes
    setInterval(updateServerStats, 60000);
    setInterval(updateDiscordStatus, 30000);

    if (document.getElementById('serverStats')) updateServerStats();
    if (document.getElementById('discordActivity')) updateDiscordStatus();
    if (document.querySelector('.hero-title')) initTypewriter();

    // 5. Gestion fermeture menu paramètres
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        const btn = document.querySelector('.settings-btn');
        if (panel && btn && panel.classList.contains('show')) {
            if (!panel.contains(event.target) && !btn.contains(event.target)) {
                panel.classList.remove('show');
            }
        }
    });
});

// =====================================================
// 2. LOGIQUE LANGUE (AUTO + SAUVEGARDE)
// =====================================================

function detectAndApplyLanguage() {
    // A. Vérifier si l'utilisateur a déjà choisi une langue (Sauvegarde)
    const savedLang = localStorage.getItem('userLang');
    
    // B. Sinon, vérifier la langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;

    if (savedLang) {
        // Priorité 1 : Le choix de l'utilisateur sauvegardé
        currentLang = savedLang;
    } else {
        // Priorité 2 : La langue du navigateur (Si commence par 'fr' -> fr, sinon -> en)
        currentLang = browserLang.startsWith('fr') ? 'fr' : 'en';
    }

    // C. Mettre à jour visuellement le sélecteur tout de suite
    const langSelect = document.getElementById('languageSelector');
    if(langSelect) {
        langSelect.value = currentLang;
    }

    // D. Charger le fichier de langue correspondant
    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    // Si on est en local sans serveur, fetch peut échouer. 
    // Assure-toi d'utiliser Live Server ou d'héberger le site.
    fetch(`${JSON_PATH}${lang}.json`)
        .then(response => {
            if (!response.ok) throw new Error(`Fichier ${lang}.json introuvable`);
            return response.json();
        })
        .then(data => {
            currentTranslations = data; 
            applyTranslations();     
            
            // Une fois la langue chargée, on met à jour l'horloge pour le format (12h/24h)
            updateClock(); 
            
            // Modules spécifiques qui dépendent de la langue
            if (document.getElementById('serverStats')) updateServerStats();
            if (document.getElementById('discordActivity')) updateDiscordStatus();
        })
        .catch(err => {
            console.error("Erreur critique chargement langue:", err);
            // Fallback : Si le chargement échoue, l'heure tourne quand même
            updateClock();
        });
}

function applyTranslations() {
    if (!currentTranslations) return;
    
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) {
            // Utilise innerHTML pour permettre le gras ou les liens dans le JSON
            if (key === 'location' || key.includes('legal') || key.includes('desc') || key.includes('bio')) {
                elem.innerHTML = currentTranslations[key];
            } else {
                elem.innerText = currentTranslations[key];
            }
        }
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    // Sauvegarde le choix pour la prochaine fois
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
}

// =====================================================
// 3. UI & FONTS
// =====================================================

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--main-font', fontFamily);
    localStorage.setItem('userFont', fontFamily);
}

function loadSavedFont() {
    const savedFont = localStorage.getItem('userFont');
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        const fontSel = document.getElementById('fontSelector');
        if (fontSel) fontSel.value = savedFont;
    }
}

// =====================================================
// 4. HORLOGE (CORRIGÉE)
// =====================================================

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;

    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit' };
    
    // Si la langue est 'en' (Anglais), on passe en 12h (AM/PM)
    // Sinon (français ou par défaut), on reste en 24h
    if (currentLang === 'en') {
        options.hour12 = true;
        clockEl.innerText = now.toLocaleTimeString('en-US', options);
    } else {
        options.hour12 = false; 
        // Force le format 24h propre
        clockEl.innerText = now.toLocaleTimeString('fr-FR', options).replace(':', ':'); 
    }
}

// =====================================================
// 5. MODULES (Discord, Typewriter...)
// =====================================================

function initTypewriter() {
    const targetTitle = "StealthyLabs | Content Creator"; 
    let index = 0;
    const speed = 200;
    document.title = "_";

    function type() {
        if (index < targetTitle.length) {
            document.title = targetTitle.substring(0, index + 1) + "_";
            index++;
            setTimeout(type, speed);
        } else {
            setTimeout(() => { document.title = targetTitle + " "; }, 500);
            setTimeout(() => { document.title = targetTitle + "_"; }, 1000);
            setTimeout(() => { document.title = targetTitle; }, 1500);
        }
    }
    setTimeout(type, 500);
}

function updateDiscordStatus() {
    if (!document.getElementById('discordActivity')) return;

    const userId = "1071461037741723648"; 
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const d = data.data;
            
            // Badge Live
            const liveBadge = document.getElementById('liveBadge');
            const mainAvatar = document.querySelector('.avatar');
            let isStreaming = false;

            if (d.activities) {
                for (const activity of d.activities) {
                    if (activity.type === 1 || (activity.name && activity.name.toLowerCase() === 'twitch')) {
                        isStreaming = true;
                        break;
                    }
                }
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
            const user = d.discord_user;
            const status = d.discord_status;
            const avatarImg = document.getElementById('discordAvatar');
            const statusDot = document.getElementById('discordStatus');
            const activityEl = document.getElementById('discordActivity'); 

            if (avatarImg) avatarImg.src = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128`;
            if (statusDot) statusDot.className = 'discord-status-dot ' + status;

            // Traduction statut
            const statusText = (currentTranslations && currentTranslations[`status_${status}`]) 
                ? currentTranslations[`status_${status}`] 
                : status;
                
            let htmlContent = `<div style="color:#888; font-size:0.8rem;">${statusText}</div>`;

            // Jeu / Spotify
            let game = null;
            let spotify = null;
            if (d.activities) game = d.activities.find(a => a.type !== 4 && a.name !== "Spotify" && a.assets);
            if (d.listening_to_spotify && d.spotify) spotify = d.spotify;

            if (spotify) {
                let explicitHtml = spotify.explicit ? `<span class="explicit-badge">E</span>` : '';
                htmlContent += `
                    <div class="rp-game-row" style="align-items: flex-start;">
                        <img src="${spotify.album_art_url}" class="rp-game-icon" style="margin-top: 4px;">
                        <div class="rp-game-info">
                            <div class="rp-game-title" style="color: #fff; font-weight: 700;">${spotify.song}${explicitHtml}</div>
                            <div class="rp-game-detail" style="color: #ccc;">${spotify.album}</div>
                            <div class="rp-game-detail" style="color: #888;">${spotify.artist}</div>
                        </div>
                    </div>`;
            } else if (game) {
                let iconUrl = game.assets.large_image.startsWith("mp:") 
                    ? `https://media.discordapp.net/${game.assets.large_image.slice(3)}`
                    : `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                
                htmlContent += `
                    <div class="rp-game-row">
                        <img src="${iconUrl}" class="rp-game-icon">
                        <div class="rp-game-info">
                            <div class="rp-game-title">${game.name}</div>
                            <div class="rp-game-detail">${game.details || game.state || ""}</div>
                        </div>
                    </div>`;
            }
            if (activityEl) activityEl.innerHTML = htmlContent;
        })
        .catch(err => console.log("Lanyard offline"));
}

function updateServerStats() {
    if (!document.getElementById('serverStats')) return;

    const inviteCode = "7CJbppbFdw"; 
    fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`)
        .then(res => res.json())
        .then(data => {
            const online = data.approximate_presence_count;
            const total = data.approximate_member_count;
            const statsEl = document.getElementById('serverStats');
            
            if (data.guild && document.getElementById('serverName')) {
                document.getElementById('serverName').innerText = data.guild.name;
                document.getElementById('serverIcon').src = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png`;
            }

            const greenDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
            const greyDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;

            if (currentLang === 'fr') {
                statsEl.innerHTML = `${greenDot} ${online} En ligne ${greyDot} ${total} Membres`;
            } else {
                statsEl.innerHTML = `${greenDot} ${online} Online ${greyDot} ${total} Members`;
            }
        })
        .catch(err => console.log("Erreur stats serveur"));
}

// Exports pour HTML
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;