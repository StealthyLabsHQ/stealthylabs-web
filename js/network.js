let currentLang = 'en';
let currentTranslations = {};

function detectLanguage() {
    const savedLang = localStorage.getItem('userLang');

    if (savedLang) {
        currentLang = savedLang;
    } else {
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang.startsWith('fr')) currentLang = 'fr';
        else currentLang = 'en';
    }
    const langSelect = document.getElementById('languageSelector');
    if (langSelect) langSelect.value = currentLang;
    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${window.SITE_ROOT || ''}translations/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            currentTranslations = data;
            applyTranslations();

            updateClock();
            updateServerStats();
            updateDiscordStatus();

            const guidesCard = document.getElementById('guidesCard');
            if (guidesCard) {
                if (lang === 'fr') {
                    guidesCard.style.display = 'flex';
                } else {
                    guidesCard.style.display = 'none';
                }
            }
        })
        .catch(err => console.error("Erreur chargement langue:", err));
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) {
            if (key === 'location') elem.innerHTML = currentTranslations[key];
            else elem.innerText = currentTranslations[key];
        }
        if (currentTranslations[key]) {
            if (key === 'location') elem.innerHTML = currentTranslations[key];
            else elem.innerText = currentTranslations[key];
        }
    });

    // Update phrases if typewriter is active
    if (currentTranslations.typewriter_phrases) {
        phrases = currentTranslations.typewriter_phrases;
        // Reset if index out of bounds
        if (phraseIndex >= phrases.length) phraseIndex = 0;
    }
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
}

function toggleMusic() {
    document.getElementById('musicWrapper').classList.toggle('open');
    document.querySelector('.music-toggle').classList.toggle('active');
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

function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('show');
}

function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--main-font', fontFamily);
    localStorage.setItem('userFont', fontFamily);
}

function loadSavedFont() {
    const savedFont = localStorage.getItem('userFont');
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        document.getElementById('fontSelector').value = savedFont;
    }
}

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clockDisplay');

    let options = { hour: '2-digit', minute: '2-digit' };

    if (currentLang === 'fr') {
        options.hour12 = false;
        clockEl.innerText = now.toLocaleTimeString('fr-FR', options).replace(':', ':');
    } else {
        options.hour12 = true;
        clockEl.innerText = now.toLocaleTimeString('en-US', options);
    }
}

function changeTheme(theme) {
    const body = document.body;
    const selector = document.getElementById('themeSelector');

    localStorage.setItem('userTheme', theme);

    if (theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }
    } else if (theme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }

    if (selector) selector.value = theme;
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        changeTheme(savedTheme);
    } else {
        changeTheme('system');
    }
}

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (localStorage.getItem('userTheme') === 'system') {
            changeTheme('system');
        }
    });
}

// =====================================================
// INTEGRATION DISCORD (LANYARD)
// =====================================================
function updateDiscordStatus() {
    const userId = "1071461037741723648";
    const apiUrl = `https://api.lanyard.rest/v1/users/${userId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const d = data.data;
                const user = d.discord_user;
                const status = d.discord_status;

                const avatarImg = document.getElementById('discordAvatar');
                const statusDot = document.getElementById('discordStatus');
                const activityEl = document.getElementById('discordActivity');

                if (user.avatar) {
                    avatarImg.src = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128`;
                }

                statusDot.className = 'discord-status-dot ' + status;

                const statusText = {
                    online: currentTranslations.status_online || "Online",
                    idle: currentTranslations.status_idle || "Idle",
                    dnd: currentTranslations.status_dnd || "DND",
                    offline: currentTranslations.status_offline || "Offline"
                }[status] || status;

                let game = null;
                let spotify = null;

                if (d.activities && d.activities.length > 0) {
                    game = d.activities.find(a => a.type !== 4 && a.name !== "Spotify" && a.assets && a.assets.large_image);
                }
                if (d.listening_to_spotify && d.spotify) {
                    spotify = d.spotify;
                }

                let htmlContent = `<div style="color:#888; font-size:0.8rem;">${statusText}</div>`;

                if (spotify || (game && (game.name === 'foobar2000' || game.name === 'Music'))) {
                    let artist, album, track, coverUrl;
                    let explicitHtml = '';

                    if (spotify) {
                        artist = spotify.artist;
                        album = spotify.album;
                        track = spotify.song;
                        coverUrl = spotify.album_art_url;
                        if (spotify.explicit === true) {
                            explicitHtml = `<span class="explicit-badge" title="Explicit">E</span>`;
                        }
                    } else {
                        artist = game.state || "Inconnu";
                        album = game.assets.large_text || "";
                        track = game.details || "";
                        let assetId = game.assets.large_image;
                        if (assetId.startsWith("mp:")) {
                            coverUrl = `https://media.discordapp.net/${assetId.slice(3)}`;
                        } else {
                            coverUrl = `https://cdn.discordapp.com/app-assets/${game.application_id}/${assetId}.png`;
                        }
                    }

                    htmlContent += `
                            <div class="rp-game-row" style="align-items: flex-start;">
                                <img src="${coverUrl}" class="rp-game-icon" style="margin-top: 4px;">
                                <div class="rp-game-info">
                                    <div class="rp-game-title" style="color: #fff; font-weight: 700;">
                                        ${track}${explicitHtml}
                                    </div>
                                    <div class="rp-game-detail" style="color: #ccc;">${album}</div>
                                    <div class="rp-game-detail" style="color: #888;">${artist}</div>
                                </div>
                            </div>
                        `;
                }
                else if (game) {
                    let assetId = game.assets.large_image;
                    let gameImgUrl;
                    if (assetId.startsWith("mp:")) {
                        gameImgUrl = `https://media.discordapp.net/${assetId.slice(3)}`;
                    } else {
                        gameImgUrl = `https://cdn.discordapp.com/app-assets/${game.application_id}/${assetId}.png`;
                    }
                    const details = game.details || game.state || "";
                    htmlContent += `
                            <div class="rp-game-row">
                                <img src="${gameImgUrl}" class="rp-game-icon">
                                <div class="rp-game-info">
                                    <div class="rp-game-title">${game.name}</div>
                                    <div class="rp-game-detail">${details}</div>
                                </div>
                            </div>
                        `;
                }
                activityEl.innerHTML = htmlContent;
            }
        })
        .catch(err => console.error("Erreur Lanyard:", err));
}
function openEmail() {
    const user = "contact";
    const domain = "stealthylabs.eu";
    window.location.href = `mailto:${user}@${domain}`;
}

function updateServerStats() {
    const inviteCode = "7CJbppbFdw";
    const apiUrl = `https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const guild = data.guild;
            const onlineCount = data.approximate_presence_count;
            const totalCount = data.approximate_member_count;

            if (guild) {
                document.getElementById('serverName').innerText = guild.name;
                if (guild.icon) {
                    const iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
                    document.getElementById('serverIcon').src = iconUrl;
                }
            }

            const statsEl = document.getElementById('serverStats');
            const greenDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
            const greyDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;

            if (currentLang === 'fr') {
                statsEl.innerHTML = `${greenDot} ${onlineCount} En ligne ${greyDot} ${totalCount} Membres`;
            } else {
                statsEl.innerHTML = `${greenDot} ${onlineCount} Online ${greyDot} ${totalCount} Members`;
            }
        })
        .catch(err => {
            console.error("Erreur Stats Discord:", err);
            document.getElementById('serverStats').innerText = currentTranslations.join_server || "Rejoindre le serveur";
        });
}

function checkCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => {
            document.getElementById('cookieBanner').style.transform = 'translateY(0)';
        }, 1000);
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    document.getElementById('cookieBanner').style.transform = 'translateY(100%)';
}

checkCookieConsent();

let pendingUrl = "";
const overlay = document.getElementById('redirectOverlay');
const urlDisplay = document.getElementById('redirectUrl');
const confirmBtn = document.getElementById('confirmRedirectBtn');

function closeRedirect() {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function openModal(url) {
    pendingUrl = url;
    urlDisplay.innerText = url;

    overlay.style.display = 'flex';
    setTimeout(() => { overlay.classList.add('show'); }, 10);
}

if (confirmBtn) {
    confirmBtn.onclick = () => {
        window.open(pendingUrl, '_blank');
        closeRedirect();
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[target="_blank"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(link.href);
        });
    });
});

document.addEventListener('click', function (event) {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.querySelector('button[onclick="toggleSettings()"]');

    if (settingsPanel && settingsBtn) {
        // Si le menu est ouvert...
        if (settingsPanel.classList.contains('show')) {
            if (!settingsPanel.contains(event.target) && !settingsBtn.contains(event.target)) {
                settingsPanel.classList.remove('show');
            }
        }
    }
});

let playlistData = [];

function loadPlaylist() {
    fetch(`${window.SITE_ROOT || ''}json/playlist.json`)
        .then(response => response.json())
        .then(data => {
            playlistData = data;
            initPlaylist();
        })
        .catch(err => console.error("Erreur chargement playlist:", err));
}

let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const timeCurrent = document.getElementById("timeCurrent");
const timeTotal = document.getElementById("timeTotal");
const playerTrack = document.getElementById("playerTrack");
const playerArtist = document.getElementById("playerArtist");
const playerArtwork = document.getElementById("playerArtwork");
const volumeSlider = document.getElementById("volumeSlider");
const playlistEl = document.getElementById("playlist");
const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

function initPlaylist() {
    currentTrack = Math.floor(Math.random() * playlistData.length);

    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        html += `<div class="playlist-item" data-i="${i}"><div class="playlist-item-cover">${t.cover ? `<img src="${window.SITE_ROOT || ''}${t.cover}">` : defaultSVG}</div><div class="playlist-item-info"><div class="playlist-item-title">${t.title}</div><div class="playlist-item-artist">${t.artist}</div></div></div>`;
    });
    playlistEl.innerHTML = html;

    document.querySelectorAll(".playlist-item").forEach(el => {
        el.onclick = () => {
            currentTrack = parseInt(el.dataset.i);
            loadTrack(currentTrack);
            playTrack();
        };
    });

    loadTrack(currentTrack);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            document.querySelector(".icon-play").style.display = "none";
            document.querySelector(".icon-pause").style.display = "block";
            document.querySelector(".music-player").classList.add("playing");
        })
            .catch(error => {
                console.log("Autoplay bloqué. Attente clic...");
                document.addEventListener('click', function startAudioOnFirstClick() {
                    playTrack();
                    document.removeEventListener('click', startAudioOnFirstClick);
                }, { once: true });
            });
    }
}

function loadTrack(i) {
    const t = playlistData[i];
    audio.src = (window.SITE_ROOT || '') + t.file;

    playerTrack.textContent = t.title;
    playerTrack.removeAttribute('data-key');

    playerArtist.textContent = t.artist;
    playerArtwork.innerHTML = t.cover ? `<img src="${window.SITE_ROOT || ''}${t.cover}">` : defaultSVG;

    document.querySelectorAll(".playlist-item").forEach((el, index) => {
        el.classList.toggle("active", index === i);
        const titleEl = el.querySelector('.playlist-item-title');
        if (index === i) titleEl.style.color = '#1db954'; else titleEl.style.color = '#ffffff';
    });
}

function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        document.querySelector(".icon-play").style.display = "none";
        document.querySelector(".icon-pause").style.display = "block";
        document.querySelector(".music-player").classList.add("playing");
    }).catch(e => {
        document.addEventListener('click', function onFirstClick() { playTrack(); document.removeEventListener('click', onFirstClick); }, { once: true });
    });
}
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    document.querySelector(".icon-play").style.display = "block";
    document.querySelector(".icon-pause").style.display = "none";
    document.querySelector(".music-player").classList.remove("playing");
}
function nextTrack() { currentTrack = (currentTrack + 1) % playlistData.length; loadTrack(currentTrack); if (isPlaying) playTrack(); }
function prevTrack() { if (audio.currentTime > 3) { audio.currentTime = 0; } else { currentTrack = (currentTrack - 1 + playlistData.length) % playlistData.length; loadTrack(currentTrack); } if (isPlaying) playTrack(); }
function fmt(s) { if (!isFinite(s)) return "0:00"; return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"); }

playBtn.onclick = () => isPlaying ? pauseTrack() : playTrack();
nextBtn.onclick = nextTrack;
prevBtn.onclick = prevTrack;
volumeSlider.oninput = () => audio.volume = volumeSlider.value / 100;
audio.ontimeupdate = () => { if (audio.duration && isFinite(audio.duration)) { progressFill.style.width = (audio.currentTime / audio.duration * 100) + "%"; timeCurrent.textContent = fmt(audio.currentTime); } };
audio.onloadedmetadata = () => timeTotal.textContent = fmt(audio.duration);
audio.onended = () => { nextTrack(); };
progressBar.onclick = e => { if (audio.duration && isFinite(audio.duration)) { const rect = progressBar.getBoundingClientRect(); const percent = (e.clientX - rect.left) / rect.width; audio.currentTime = percent * audio.duration; } };

detectLanguage();
loadPlaylist();
updateDiscordStatus();
updateClock();
updateServerStats();
loadSavedFont();
loadSavedTheme();
console.log("Theme loaded:", localStorage.getItem('userTheme'));
setInterval(updateClock, 1000);
setInterval(updateServerStats, 60000);
setInterval(updateDiscordStatus, 30000);

// Spotlight Effect
const spotlightEl = document.getElementById('spotlight');
if (spotlightEl) {
    document.addEventListener('mousemove', (e) => {
        // Activate on first move
        if (!spotlightEl.classList.contains('active')) {
            spotlightEl.classList.add('active');
        }

        spotlightEl.style.setProperty('--btn-x', `${e.clientX}px`);
        spotlightEl.style.setProperty('--btn-y', `${e.clientY}px`);
    });
}

// Typewriter Effect
let phrases = ['Content Creator', 'Streamer'];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function typeWriter() {
    const typewriterEl = document.getElementById('typewriter');
    if (!typewriterEl) return;

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        typewriterEl.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50; // Faster deletion
    } else {
        typewriterEl.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100 + Math.random() * 50; // Random typing variability
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end of phrase
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500; // Pause before new phrase
    }

    setTimeout(typeWriter, typeSpeed);
}

document.addEventListener('DOMContentLoaded', typeWriter);