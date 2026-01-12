// =====================================================
// SCRIPT SOCIAL TOUT-EN-UN (Musique + Core + UI)
// =====================================================

const JSON_PATH = 'translations/'; // Chemin vers les fichiers de langue
let currentLang = 'en';
let currentTranslations = {};

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Script Social chargé.");

    // 1. Initialiser les préférences
    detectLanguage();
    loadSavedFont();

    // 2. Lancer les modules
    updateClock();
    updateDiscordStatus();
    updateServerStats();
    loadPlaylist();     // Lance la musique
    checkCookieConsent();
    initRedirections(); // Active la pop-up sur les liens

    // 3. Boucles de mise à jour (Temps réel)
    setInterval(updateClock, 1000);
    setInterval(updateServerStats, 60000);
    setInterval(updateDiscordStatus, 30000);

    // 4. Gestionnaire Fermeture Menu (Clic extérieur)
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        // On cherche le bouton, peu importe s'il s'appelle settings-btn ou top-icon-btn
        const settingsBtn = event.target.closest('button[onclick*="toggleSettings"]');
        
        if (panel && panel.classList.contains('show')) {
            // Si on ne clique ni dans le panneau ni sur le bouton, on ferme
            if (!panel.contains(event.target) && !settingsBtn) {
                panel.classList.remove('show');
            }
        }
    });
});

// =====================================================
// 1. GESTION LANGUES & POLICE
// =====================================================

function detectLanguage() {
    const savedLang = localStorage.getItem('userLang');
    if (savedLang) {
        currentLang = savedLang;
    } else {
        const userLang = navigator.language || navigator.userLanguage;
        currentLang = userLang.startsWith('fr') ? 'fr' : 'en';
    }

    const langSelect = document.getElementById('languageSelector');
    if(langSelect) langSelect.value = currentLang;

    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(res => {
            if(!res.ok) throw new Error("Fichier langue introuvable");
            return res.json();
        })
        .then(data => {
            currentTranslations = data; 
            applyTranslations();     
            updateClock();
            updateDiscordStatus();
            
            // Gestion carte Guides (FR uniquement)
            const guidesCard = document.getElementById('guidesCard');
            if (guidesCard) guidesCard.style.display = (lang === 'fr') ? 'flex' : 'none';
        })
        .catch(console.error);
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) {
            if (key === 'location') elem.innerHTML = currentTranslations[key];
            else elem.innerText = currentTranslations[key];
        }
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
}

function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--main-font', fontFamily);
    localStorage.setItem('userFont', fontFamily);
}

function loadSavedFont() {
    const savedFont = localStorage.getItem('userFont');
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        const selector = document.getElementById('fontSelector');
        if(selector) selector.value = savedFont;
    }
}

// =====================================================
// 2. FONCTIONS UI & REDIRECTION
// =====================================================

function toggleSettings(event) {
    // Empêche le clic de fermer le menu immédiatement
    if (event) event.stopPropagation();
    document.getElementById('settingsPanel').classList.toggle('show');
}

function toggleSocials() {
    document.getElementById('socialsWrapper').classList.toggle('open');
    document.querySelector('.socials-toggle').classList.toggle('active');
}

function toggleMusic() {
    document.getElementById('musicWrapper').classList.toggle('open');
    document.querySelector('.music-toggle').classList.toggle('active');
}

function copyCode() {
    navigator.clipboard.writeText("stealthylabs");
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("show");
    setTimeout(() => tooltip.classList.remove("show"), 2000);
}

function openEmail() {
    window.location.href = `mailto:contact@stealthylabs.eu`;
}

// --- REDIRECTIONS (CORRIGÉ) ---
let pendingRedirectUrl = "";

function initRedirections() {
    const links = document.querySelectorAll('a[target="_blank"]');
    
    links.forEach(link => {
        // On ignore les boutons de musique et liens internes
        if (!link.classList.contains('music-platform-btn') && !link.classList.contains('no-redirect')) {
            link.addEventListener('click', (e) => {
                // Si c'est un lien http/https
                if (link.href.startsWith('http')) {
                    e.preventDefault(); 
                    openModal(link.href);
                }
            });
        }
    });

    // Configuration du bouton confirmer
    const confirmBtn = document.getElementById('confirmRedirectBtn');
    if(confirmBtn) {
        confirmBtn.onclick = () => {
            if(pendingRedirectUrl) {
                window.open(pendingRedirectUrl, '_blank');
                closeRedirect();
            }
        };
    }
}

function openModal(url) {
    pendingRedirectUrl = url;
    const overlay = document.getElementById('redirectOverlay');
    const urlDisplay = document.getElementById('redirectUrl');
    
    if(overlay && urlDisplay) {
        urlDisplay.innerText = url;
        overlay.classList.add('show');
        overlay.style.display = 'flex';
    } else {
        // Fallback si la modal bug
        window.open(url, '_blank');
    }
}

function closeRedirect() {
    const overlay = document.getElementById('redirectOverlay');
    if(overlay) {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

// =====================================================
// 3. MODULES (Horloge, Discord, Cookies)
// =====================================================

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if(currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

function updateDiscordStatus() {
    const userId = "1071461037741723648"; 
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const d = data.data;
            const user = d.discord_user;
            const status = d.discord_status;
            
            // Avatar & Statut
            document.getElementById('discordAvatar').src = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128`;
            document.getElementById('discordStatus').className = 'discord-status-dot ' + status;

            // Texte statut traduit
            let statusKey = `status_${status}`;
            let statusText = currentTranslations[statusKey] || status;
            
            // Construction HTML
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
            } else if (d.activities && d.activities.length > 0) {
                const game = d.activities.find(a => a.type !== 4 && a.name !== "Spotify");
                if (game && game.assets) {
                    let icon = game.assets.large_image.startsWith("mp:") 
                        ? `https://media.discordapp.net/${game.assets.large_image.slice(3)}` 
                        : `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                    html += `<div class="rp-game-row"><img src="${icon}" class="rp-game-icon"><div class="rp-game-info"><div class="rp-game-title">${game.name}</div><div class="rp-game-detail">${game.details || game.state || ""}</div></div></div>`;
                }
            }
            document.getElementById('discordActivity').innerHTML = html;
        })
        .catch(() => {});
}

function updateServerStats() {
    const inviteCode = "7CJbppbFdw"; 
    fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`)
        .then(res => res.json())
        .then(data => {
            const statsEl = document.getElementById('serverStats');
            const green = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
            const grey = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;
            
            if (currentLang === 'fr') statsEl.innerHTML = `${green} ${data.approximate_presence_count} En ligne ${grey} ${data.approximate_member_count} Membres`;
            else statsEl.innerHTML = `${green} ${data.approximate_presence_count} Online ${grey} ${data.approximate_member_count} Members`;
        })
        .catch(() => {});
}

function checkCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => { document.getElementById('cookieBanner').style.transform = 'translateY(0)'; }, 1000);
    }
}
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    document.getElementById('cookieBanner').style.transform = 'translateY(100%)';
}

// =====================================================
// 4. LECTEUR MUSIQUE (INTÉGRÉ & ALÉATOIRE)
// =====================================================
let playlistData = [];
let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();

function loadPlaylist() {
    fetch('json/playlist.json')
        .then(res => res.json())
        .then(data => {
            playlistData = data;
            initPlaylist();
        })
        .catch(err => console.error("Erreur Playlist:", err));
}

function initPlaylist() {
    const playlistEl = document.getElementById("playlist");
    const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
    
    // Génération HTML
    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        html += `<div class="playlist-item" data-i="${i}"><div class="playlist-item-cover">${t.cover ? `<img src="${t.cover}">` : defaultSVG}</div><div class="playlist-item-info"><div class="playlist-item-title">${t.title}</div><div class="playlist-item-artist">${t.artist}</div></div></div>`;
    });
    playlistEl.innerHTML = html;
    
    // Events Clic Playlist
    document.querySelectorAll(".playlist-item").forEach(el => {
        el.onclick = () => { 
            currentTrack = parseInt(el.dataset.i); 
            loadTrack(currentTrack); 
            playTrack(); 
        };
    });

    // --- LANCEMENT ALÉATOIRE ---
    if(playlistData.length > 0) {
        currentTrack = Math.floor(Math.random() * playlistData.length);
        loadTrack(currentTrack);
        
        // --- AUTOPLAY ---
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updatePlayIcons(true);
            }).catch(() => {
                console.log("Autoplay bloqué. Clic requis.");
                // Si bloqué, on attend le premier clic pour lancer
                document.addEventListener('click', function startAudio() {
                    playTrack();
                    document.removeEventListener('click', startAudio);
                }, { once: true });
            });
        }
    }
    
    setupPlayerControls();
}

function setupPlayerControls() {
    document.getElementById("playBtn").onclick = () => isPlaying ? pauseTrack() : playTrack();
    document.getElementById("nextBtn").onclick = nextTrack;
    document.getElementById("prevBtn").onclick = prevTrack;
    document.getElementById("volumeSlider").oninput = (e) => audio.volume = e.target.value / 100;
    
    // Barre de progression
    const progressBar = document.getElementById("progressBar");
    progressBar.onclick = e => { 
        if (audio.duration) { 
            const rect = progressBar.getBoundingClientRect(); 
            const percent = (e.clientX - rect.left) / rect.width; 
            audio.currentTime = percent * audio.duration; 
        } 
    };

    audio.ontimeupdate = updateProgress;
    audio.onended = nextTrack;
}

function loadTrack(i) {
    const t = playlistData[i];
    audio.src = t.file;
    document.getElementById("playerTrack").textContent = t.title;
    document.getElementById("playerTrack").removeAttribute('data-key'); // Stop traduction
    document.getElementById("playerArtist").textContent = t.artist;
    
    document.querySelectorAll(".playlist-item").forEach((el, index) => {
        el.classList.toggle("active", index === i);
        el.querySelector('.playlist-item-title').style.color = (index === i) ? '#1db954' : '#ffffff';
    });
}

function playTrack() { 
    audio.play().then(() => { isPlaying = true; updatePlayIcons(true); })
         .catch(() => { isPlaying = false; updatePlayIcons(false); });
}
function pauseTrack() { audio.pause(); isPlaying = false; updatePlayIcons(false); }
function updatePlayIcons(playing) {
    document.querySelector(".icon-play").style.display = playing ? "none" : "block";
    document.querySelector(".icon-pause").style.display = playing ? "block" : "none";
}
function nextTrack() { currentTrack = (currentTrack + 1) % playlistData.length; loadTrack(currentTrack); playTrack(); }
function prevTrack() { if (audio.currentTime > 3) audio.currentTime = 0; else currentTrack = (currentTrack - 1 + playlistData.length) % playlistData.length; loadTrack(currentTrack); playTrack(); }

function updateProgress() {
    const progressFill = document.getElementById("progressFill");
    if (audio.duration) { 
        progressFill.style.width = (audio.currentTime / audio.duration * 100) + "%"; 
        document.getElementById("timeCurrent").textContent = fmt(audio.currentTime); 
        document.getElementById("timeTotal").textContent = fmt(audio.duration);
    }
}
function fmt(s) { return Math.floor(s/60) + ":" + String(Math.floor(s%60)).padStart(2,"0"); }

// --- EXPORTS ---
window.toggleSettings = toggleSettings;
window.toggleSocials = toggleSocials;
window.toggleMusic = toggleMusic;
window.copyCode = copyCode;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;
window.acceptCookies = acceptCookies;
window.openEmail = openEmail;
window.closeRedirect = closeRedirect;