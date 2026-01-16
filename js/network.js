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
            // updateDiscordStatus(); // Removed as it is now WebSocket based

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

    // Update particles based on new theme
    if (typeof updateParticlesTheme === 'function') {
        let isDark = false;
        if (theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            isDark = true;
        }
        updateParticlesTheme(isDark);
    }
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

const lanyardUserId = "1071461037741723648";
let lanyardSocket = null;
let heartbeatInterval = null;

function connectLanyard() {
    lanyardSocket = new WebSocket('wss://api.lanyard.rest/socket');

    lanyardSocket.onopen = () => {
        console.log("🟢 Connected to Lanyard WebSocket");
    };

    lanyardSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const op = data.op;
        const d = data.d;

        if (op === 1) { // Hello
            // Send Initialize
            lanyardSocket.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: lanyardUserId }
            }));

            // Start heartbeat
            heartbeatInterval = setInterval(() => {
                lanyardSocket.send(JSON.stringify({ op: 3 }));
            }, d.heartbeat_interval);
        } else if (op === 0) { // Event
            if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                updateDiscordUI(d);
            }
        }
    };

    lanyardSocket.onclose = () => {
        console.log("🔴 Disconnected from Lanyard WebSocket. Reconnecting in 5s...");
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setTimeout(connectLanyard, 5000);
    };

    lanyardSocket.onerror = (error) => {
        console.error("⚠️ Lanyard WebSocket Error:", error);
        lanyardSocket.close();
    };
}

function updateDiscordUI(data) {
    const user = data.discord_user;
    const status = data.discord_status;
    const activities = data.activities;
    const spotify = data.spotify;

    const avatarImg = document.getElementById('discordAvatar');
    const statusDot = document.getElementById('discordStatus');
    const activityEl = document.getElementById('discordActivity');

    if (user.avatar) {
        avatarImg.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    }

    statusDot.className = 'discord-status-dot ' + status;

    const statusText = {
        online: currentTranslations.status_online || "Online",
        idle: currentTranslations.status_idle || "Idle",
        dnd: currentTranslations.status_dnd || "DND",
        offline: currentTranslations.status_offline || "Offline"
    }[status] || status;

    let htmlContent = `<div style="color:#888; font-size:0.8rem; margin-bottom: 5px;">${statusText}</div>`;

    // Prioritize Spotify or Custom Status or Game
    // Filter out internal activities if needed, but keeping logic broad as requested

    // 1. Spotify
    if (data.listening_to_spotify && spotify) {
        let artist = spotify.artist;
        let title = spotify.song;
        let coverUrl = spotify.album_art_url;
        let explicitHtml = spotify.explicit ? `<span class="explicit-badge" title="Explicit">E</span>` : '';

        htmlContent += `
            <div class="rp-game-row">
                <div class="rp-image-container">
                    <img src="${coverUrl}" class="rp-game-icon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" class="rp-small-image" style="padding: 0; background: #000;">
                </div>
                <div class="rp-game-info">
                    <div class="rp-game-title" style="color: #1db954; font-weight: 700;">
                        ${title}${explicitHtml}
                    </div>
                    <div class="rp-game-detail" style="color: #ccc;">by ${artist}</div>
                    
                    <!-- Progress Bar -->
                    <div class="rp-progress-container">
                        <div class="rp-progress-bar">
                            <div class="rp-progress-fill" id="spotify-progress"></div>
                        </div>
                        <div class="rp-time-info">
                            <span id="spotify-curr">0:00</span>
                            <span id="spotify-end">0:00</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (spotify.timestamps) {
            updateSpotifyProgress(spotify.timestamps.start, spotify.timestamps.end);
        }
    }
    // 2. Activities (Games, VScode, etc)
    else if (activities && activities.length > 0) {
        // Filter out status (type 4) if you want, or show it separately
        // Typically type 4 is "Custom Status"
        const game = activities.find(a => a.type !== 4); // Find first non-custom status activity

        if (game) {
            let largeImage = null;
            let smallImage = null;

            // Handle Images
            if (game.assets) {
                if (game.assets.large_image) {
                    if (game.assets.large_image.startsWith("mp:")) {
                        largeImage = `https://media.discordapp.net/${game.assets.large_image.slice(3)}`;
                    } else {
                        largeImage = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                    }
                }
                if (game.assets.small_image) {
                    if (game.assets.small_image.startsWith("mp:")) {
                        smallImage = `https://media.discordapp.net/${game.assets.small_image.slice(3)}`;
                    } else {
                        smallImage = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.small_image}.png`;
                    }
                }
            }

            // Fallback icon if no assets
            const iconUrl = largeImage || "https://d2636k5j18ch80.cloudfront.net/assets/unknown-game.png"; // or a generic gamepad icon

            const details = game.details || "";
            const state = game.state || "";

            htmlContent += `
                <div class="rp-game-row">
                    <div class="rp-image-container">
                        <img src="${iconUrl}" class="rp-game-icon" onerror="this.src='../logos/discord.png'">
                        ${smallImage ? `<img src="${smallImage}" class="rp-small-image" title="${game.assets.small_text || ''}">` : ''}
                    </div>
                    <div class="rp-game-info">
                        <div class="rp-game-title">${game.name}</div>
                        ${details ? `<div class="rp-game-detail">${details}</div>` : ''}
                        ${state ? `<div class="rp-game-detail" style="color:#888;">${state}</div>` : ''}
                        ${game.timestamps && game.timestamps.start ? `<div class="rp-game-detail" id="rp-timer" data-start="${game.timestamps.start}">00:00 elapsed</div>` : ''}
                    </div>
                </div>
            `;

            // Start timer update if needed
            if (game.timestamps && game.timestamps.start) {
                updateRpTimer(game.timestamps.start);
            }
        } else {
            // Check for Custom Status (Type 4)
            // Check for Custom Status (Type 4)
            const custom = activities.find(a => a.type === 4);
            if (custom && custom.state) {
                htmlContent += `<div class="custom-status-text">${custom.emoji ? (custom.emoji.id ? `<img src="https://cdn.discordapp.com/emojis/${custom.emoji.id}.png?size=24" style="width:16px;vertical-align:middle;margin-right:4px;">` : custom.emoji.name + ' ') : ''}${custom.state}</div>`;
            } else {
                htmlContent += `<div class="custom-status-text empty">Pas d'activité</div>`;
            }
        }
    }

    activityEl.innerHTML = htmlContent;
}

let rpTimerInterval = null;
let spotifyInterval = null;

function updateRpTimer(startTime) {
    if (rpTimerInterval) clearInterval(rpTimerInterval);
    if (spotifyInterval) clearInterval(spotifyInterval); // Clear spotify if switching

    function update() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) return; // Future start time?

        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)));

        const el = document.getElementById('rp-timer');
        if (el) {
            el.innerText = `${hours > 0 ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} elapsed`;
        } else {
            clearInterval(rpTimerInterval);
        }
    }

    update();
    rpTimerInterval = setInterval(update, 1000);
}

function updateSpotifyProgress(start, end) {
    if (spotifyInterval) clearInterval(spotifyInterval);
    if (rpTimerInterval) clearInterval(rpTimerInterval);

    const totalDuration = end - start;

    function update() {
        const now = Date.now();
        const currentCheck = now - start;

        let percent = (currentCheck / totalDuration) * 100;
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;

        const bar = document.getElementById('spotify-progress');
        const currEl = document.getElementById('spotify-curr');
        const endEl = document.getElementById('spotify-end');

        if (bar && currEl && endEl) {
            bar.style.width = `${percent}%`;

            // Format times
            const currSeconds = Math.floor((currentCheck / 1000) % 60);
            const currMinutes = Math.floor((currentCheck / (1000 * 60)));

            const totalSeconds = Math.floor((totalDuration / 1000) % 60);
            const totalMinutes = Math.floor((totalDuration / (1000 * 60)));

            currEl.innerText = `${currMinutes}:${String(currSeconds).padStart(2, '0')}`;
            endEl.innerText = `${totalMinutes}:${String(totalSeconds).padStart(2, '0')}`;
        } else {
            clearInterval(spotifyInterval);
        }
    }

    update();
    spotifyInterval = setInterval(update, 1000);
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
const confirmBtn = document.getElementById('btnConfirmRedirect');
const cancelBtn = document.getElementById('btnCancelRedirect');

function closeRedirect() {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function openModal(url) {
    pendingUrl = url;
    urlDisplay.innerText = url;

    // Ensure handlers are reset to default behavior (in case Context Menu overwrote them)
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            window.open(pendingUrl, '_blank');
            closeRedirect();
        };
    }
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeRedirect();
        };
    }

    overlay.style.display = 'flex';
    setTimeout(() => { overlay.classList.add('show'); }, 10);
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



let playlistData = [];

function loadPlaylist() {
    loadSavedAutoplay(); // Restore setting
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

// --- AUTOPLAY SETTINGS ---
function changeAutoplay(val) {
    localStorage.setItem('userAutoplay', val);
}

function loadSavedAutoplay() {
    const saved = localStorage.getItem('userAutoplay');
    const selector = document.getElementById('autoplaySelector');
    if (selector) {
        selector.value = saved || 'on';
    }
}

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

    // CHECK AUTOPLAY
    const autoplay = localStorage.getItem('userAutoplay');
    console.log("Autoplay setting:", autoplay);

    if (autoplay !== 'off') {
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
    } else {
        console.log("Autoplay désactivé par l'utilisateur.");
        isPlaying = false;
        document.querySelector(".icon-play").style.display = "block";
        document.querySelector(".icon-pause").style.display = "none";
        document.querySelector(".music-player").classList.remove("playing");
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

// detectLanguage(); // Already called above
// loadPlaylist(); // Already called above
// updateClock(); // Already called above
// updateServerStats(); // Already called above
// loadSavedFont(); // Already called above
// loadSavedTheme(); // Already called above

detectLanguage();
loadPlaylist();
connectLanyard(); // Changed from updateDiscordStatus
updateClock();
updateServerStats();
loadSavedFont();
loadSavedTheme();
console.log("Theme loaded:", localStorage.getItem('userTheme'));
setInterval(updateClock, 1000);
setInterval(updateServerStats, 60000);
// setInterval(updateDiscordStatus, 30000); // Removed polling

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

    // Mirror to document title
    document.title = typewriterEl.textContent + " | StealthyLabs";

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

// --- TERMINAL INTRO ANIMATION ---
function runTerminalIntro() {
    const intro = document.getElementById('terminal-intro');
    const textEl = document.getElementById('terminal-text');
    const text = "> Booting StealthyLabs System...\n> Connection established.";

    // Check session storage
    if (sessionStorage.getItem('introShown')) {
        if (intro) intro.style.display = 'none';
        return;
    }

    if (!intro || !textEl) return;

    let i = 0;
    const speed = 50; // ms per char

    function terminalTypeWriter() {
        if (i < text.length) {
            textEl.textContent += text.charAt(i);
            i++;
            setTimeout(terminalTypeWriter, speed);
        } else {
            // Animation finished
            setTimeout(() => {
                intro.classList.add('fade-out');
                sessionStorage.setItem('introShown', 'true');
                setTimeout(() => {
                    intro.style.display = 'none';
                }, 1000); // Wait for fade out
            }, 1000); // Pause before fade out
        }
    }

    terminalTypeWriter();
}

document.addEventListener('DOMContentLoaded', () => {
    // Smooth Fade-In
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 50); // Small delay to ensure render

    // Smooth Fade-Out on Navigation
    const internalLinks = document.querySelectorAll('a[href^="./"], a[href^="index"], a[href^="about"], a[href^="legal"], a[href^="network"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Only process if it's not a new tab link
            if (link.target !== '_blank') {
                e.preventDefault();
                document.body.classList.remove('fade-in');
                document.body.classList.add('fade-out');

                setTimeout(() => {
                    window.location.href = href;
                }, 500); // Wait for CSS transition (0.5s)
            }
        });
    });

    typeWriter(); // Start existing typewriter
    runTerminalIntro(); // Start new intro
});


// --- TSPARTICLES BACKGROUND ---
// --- GLOBAL MUSIC CONTROL (For Context Menu) ---
window.toggleGlobalMusic = function () {
    if (typeof isPlaying !== 'undefined' && typeof playTrack === 'function' && typeof pauseTrack === 'function') {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    } else {
        console.log("Music player not active on this page.");
    }
};