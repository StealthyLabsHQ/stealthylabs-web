let currentLang = 'en';
let currentTranslations = {};

// Security: Escape HTML to prevent XSS from external API data
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Resolve playlist path: skip SITE_ROOT prefix for absolute URLs
function resolvePlaylistPath(path) {
    if (!path) return '';
    if (path.startsWith('https://')) return path;
    return (window.SITE_ROOT || '') + path;
}

// Security: Restrict dynamic URLs to safe protocols and paths
function sanitizeUrl(rawUrl, options = {}) {
    const { allowRelative = true, allowHttp = false, allowHttps = true } = options;
    if (typeof rawUrl !== 'string') return '';

    const input = rawUrl.trim();
    if (!input || input.startsWith('//')) return '';

    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input);

    try {
        const parsed = new URL(input, window.location.origin);
        if (!hasScheme) {
            return allowRelative ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '';
        }
        if (parsed.protocol === 'https:' && allowHttps) return parsed.toString();
        if (parsed.protocol === 'http:' && allowHttp) return parsed.toString();
    } catch (error) {
        return '';
    }

    return '';
}

function sanitizeLanguage(lang) {
    return lang === 'fr' || lang === 'en' ? lang : null;
}

// Typewriter Effect Variables
let phrases = ['Content Creator', 'Streamer'];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function detectLanguage() {
    const path = window.location.pathname;
    if (path.includes('/fr/')) {
        currentLang = 'fr';
        phrases = ['Créateur de Contenu', 'Streamer'];
    } else {
        currentLang = 'en';
        phrases = ['Content Creator', 'Streamer'];
    }
    const langSelect = document.getElementById('languageSelector');
    if (langSelect) langSelect.value = currentLang;
}



function changeLanguage(lang) {
    const safeLang = sanitizeLanguage(lang);
    if (!safeLang) return;

    currentLang = safeLang;
    setCookie('userLang', safeLang);

    let path = window.location.pathname;
    const filename = path.split('/').pop() || '';

    const isEn = path.includes('/en/');
    const isFr = path.includes('/fr/');

    let newUrl = window.location.href;

    if (isEn && safeLang === 'fr') {
        newUrl = newUrl.replace('/en/', '/fr/');
    } else if (isFr && safeLang === 'en') {
        newUrl = newUrl.replace('/fr/', '/en/');
    } else if (!isEn && !isFr) {
        const origin = window.location.origin;
        const page = filename ? filename : '';
        newUrl = `${origin}/${safeLang}/${page}`;
    }

    if (newUrl !== window.location.href) {
        window.location.href = newUrl;
    }
}

function toggleMusic() {
    const wrapper = document.getElementById('musicWrapper');
    const toggle = document.querySelector('.music-toggle');
    if (wrapper.classList.contains('open')) {
        wrapper.style.maxHeight = '0px';
        wrapper.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        wrapper.classList.add('open');
        wrapper.style.maxHeight = (wrapper.scrollHeight + 30) + 'px';
        toggle.classList.add('active');
    }
}

function toggleSocials() {
    const wrapper = document.getElementById('socialsWrapper');
    const toggle = document.querySelector('.socials-toggle');
    if (wrapper.classList.contains('open')) {
        wrapper.style.maxHeight = '0px';
        wrapper.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        wrapper.classList.add('open');
        wrapper.style.maxHeight = (wrapper.scrollHeight + 30) + 'px';
        toggle.classList.add('active');
    }
}

function copyCode() {
    navigator.clipboard.writeText("stealthylabs");
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("show");
    setTimeout(() => tooltip.classList.remove("show"), 2000);
}

// toggleSettings() defined later (line ~500)

function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--main-font', fontFamily);
    setCookie('userFont', fontFamily);
}

function loadSavedFont() {
    const savedFont = getCookie('userFont');
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
    const nameEl = document.getElementById('discordName');

    // Sync display name from Lanyard
    if (user && nameEl) {
        const displayName = user.display_name || user.global_name || user.username;
        if (displayName) {
            nameEl.textContent = displayName;
        }
    }

    if (user && user.avatar && /^\d+$/.test(String(user.id || '')) && /^[a-zA-Z0-9_]+$/.test(String(user.avatar || ''))) {
        avatarImg.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    }

    const safeStatus = ['online', 'idle', 'dnd', 'offline'].includes(status) ? status : 'offline';
    statusDot.className = 'discord-status-dot ' + safeStatus;

    const statusText = {
        online: (currentLang === 'fr' ? "En ligne" : "Online"),
        idle: (currentLang === 'fr' ? "Inactif" : "Idle"),
        dnd: (currentLang === 'fr' ? "Ne pas déranger" : "DND"),
        offline: (currentLang === 'fr' ? "Hors ligne" : "Offline")
    }[safeStatus] || safeStatus;

    let htmlContent = `<div style="color:#888; font-size:0.8rem; margin-bottom: 5px;">${escapeHTML(statusText)}</div>`;

    // Prioritize Spotify or Custom Status or Game
    // Filter out internal activities if needed, but keeping logic broad as requested

    // 1. Spotify
    if (data.listening_to_spotify && spotify) {
        let artist = escapeHTML(spotify.artist);
        let title = escapeHTML(spotify.song);
        let coverUrl = sanitizeUrl(spotify.album_art_url || '', { allowRelative: false, allowHttps: true, allowHttp: false });
        let trackId = encodeURIComponent(spotify.track_id || '');
        let explicitHtml = spotify.explicit ? `<span class="explicit-badge" title="Explicit">E</span>` : '';

        htmlContent += `
            <div class="rp-game-row">
                <div class="rp-image-container">
                    <img src="${coverUrl || 'logos/discord.png'}" class="rp-game-icon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" class="rp-small-image" style="padding: 0; background: #000;">
                </div>
                <div class="rp-game-info">
                    <div class="rp-game-title" style="color: #1db954; font-weight: 700;">
                        <a href="https://open.spotify.com/track/${trackId}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                            ${title}${explicitHtml}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
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
                    } else if (game.assets.large_image.startsWith("spotify:")) {
                        largeImage = `https://i.scdn.co/image/${game.assets.large_image.slice(8)}`;
                    } else if (game.assets.large_image.startsWith("http")) {
                        largeImage = sanitizeUrl(game.assets.large_image, { allowRelative: false, allowHttps: true, allowHttp: false });
                    } else {
                        largeImage = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
                    }
                }
                if (game.assets.small_image) {
                    if (game.assets.small_image.startsWith("mp:")) {
                        smallImage = `https://media.discordapp.net/${game.assets.small_image.slice(3)}`;
                    } else if (game.assets.small_image.startsWith("spotify:")) {
                        smallImage = `https://i.scdn.co/image/${game.assets.small_image.slice(8)}`;
                    } else if (game.assets.small_image.startsWith("http")) {
                        smallImage = sanitizeUrl(game.assets.small_image, { allowRelative: false, allowHttps: true, allowHttp: false });
                    } else {
                        smallImage = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.small_image}.png`;
                    }
                }
            }

            // Fallback icon: fetch app icon from Discord API when Lanyard doesn't provide assets
            if (!largeImage && game.application_id) {
                const cached = sessionStorage.getItem(`app-icon-${game.application_id}`);
                if (cached) {
                    largeImage = cached;
                }
            }
            const iconUrl = sanitizeUrl(largeImage || "logos/discord.png", { allowRelative: true, allowHttps: true, allowHttp: false }) || "logos/discord.png";
            const safeSmallImage = sanitizeUrl(smallImage || '', { allowRelative: false, allowHttps: true, allowHttp: false });

            const details = escapeHTML(game.details || "");
            const state = escapeHTML(game.state || "");
            const gameName = escapeHTML(game.name);
            const smallText = escapeHTML((game.assets && game.assets.small_text) || '');
            const gameStart = (game.timestamps && Number.isFinite(game.timestamps.start)) ? game.timestamps.start : null;

            htmlContent += `
                <div class="rp-game-row">
                    <div class="rp-image-container">
                        <img src="${iconUrl}" class="rp-game-icon" onerror="this.src='logos/discord.png'">
                        ${safeSmallImage ? `<img src="${safeSmallImage}" class="rp-small-image" title="${smallText}" onerror="this.style.display='none'">` : ''}
                    </div>
                    <div class="rp-game-info">
                        <div class="rp-game-title">${gameName}</div>
                        ${details ? `<div class="rp-game-detail">${details}</div>` : ''}
                        ${state ? `<div class="rp-game-detail" style="color:#888;">${state}</div>` : ''}
                        ${gameStart ? `<div class="rp-game-detail" id="rp-timer" data-start="${gameStart}">00:00 elapsed</div>` : ''}
                    </div>
                </div>
            `;

            // Start timer update if needed
            if (gameStart) {
                updateRpTimer(gameStart);
            }

            // Async fetch app icon from Discord API if not cached
            if (!largeImage && game.application_id && !sessionStorage.getItem(`app-icon-${game.application_id}`)) {
                fetch(`https://discord.com/api/v10/applications/${game.application_id}/rpc`)
                    .then(r => r.ok ? r.json() : null)
                    .then(app => {
                        if (app && app.icon) {
                            const url = `https://cdn.discordapp.com/app-icons/${game.application_id}/${app.icon}.png?size=128`;
                            sessionStorage.setItem(`app-icon-${game.application_id}`, url);
                            const img = document.querySelector('.rp-game-icon');
                            if (img) img.src = url;
                        }
                    }).catch(() => {});
            }
        } else {
            // Check for Custom Status (Type 4)
            // Check for Custom Status (Type 4)
            const custom = activities.find(a => a.type === 4);
            if (custom && custom.state) {
                const emojiId = custom.emoji && custom.emoji.id ? encodeURIComponent(custom.emoji.id) : '';
                const emojiName = custom.emoji ? escapeHTML(custom.emoji.name || '') : '';
                const customState = escapeHTML(custom.state);
                htmlContent += `<div class="custom-status-text">${emojiId ? `<img src="https://cdn.discordapp.com/emojis/${emojiId}.png?size=24" style="width:16px;vertical-align:middle;margin-right:4px;">` : (emojiName ? emojiName + ' ' : '')}${customState}</div>`;
            } else {
                htmlContent += `<div class="custom-status-text empty">${currentLang === 'fr' ? "Pas d'activité" : "No Activity"}</div>`;
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
    const apiUrl = `https://discord.com/api/v9/invites/${encodeURIComponent(inviteCode)}?with_counts=true`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            const guild = data.guild;
            const onlineCount = typeof data.approximate_presence_count === 'number' ? data.approximate_presence_count : '?';
            const totalCount = typeof data.approximate_member_count === 'number' ? data.approximate_member_count : '?';

            if (guild) {
                document.getElementById('serverName').textContent = guild.name || 'StealthyLabs';
                if (guild.icon && /^[a-zA-Z0-9_]+$/.test(guild.icon) && /^\d+$/.test(guild.id)) {
                    const iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
                    document.getElementById('serverIcon').src = iconUrl;
                }
            }

            const statsEl = document.getElementById('serverStats');
            const greenDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#23a559; border-radius:50%; margin-right:4px;"></span>`;
            const greyDot = `<span style="display:inline-block; width:8px; height:8px; background-color:#747f8d; border-radius:50%; margin-left:8px; margin-right:4px;"></span>`;

            if (currentLang === 'fr') {
                statsEl.innerHTML = `${greenDot} ${escapeHTML(String(onlineCount))} En ligne ${greyDot} ${escapeHTML(String(totalCount))} Membres`;
            } else {
                statsEl.innerHTML = `${greenDot} ${escapeHTML(String(onlineCount))} Online ${greyDot} ${escapeHTML(String(totalCount))} Members`;
            }
        })
        .catch(err => {
            console.error("Erreur Stats Discord:", err);
            document.getElementById('serverStats').textContent = (currentLang === 'fr') ? "Rejoindre le serveur" : "Join Server";
        });
}

function checkCookieConsent() {
    if (!getCookie('cookieConsent')) {
        setTimeout(() => {
            document.getElementById('cookieBanner').style.transform = 'translateY(0)';
        }, 1000);
    }
}

function acceptCookies() {
    setCookie('cookieConsent', 'true');
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
    const safeUrl = sanitizeUrl(url, { allowRelative: false, allowHttps: true, allowHttp: false });
    if (!safeUrl) return;

    pendingUrl = safeUrl;
    urlDisplay.innerText = safeUrl;

    // Ensure handlers are reset to default behavior (in case Context Menu overwrote them)
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            window.open(pendingUrl, '_blank', 'noopener,noreferrer');
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
            const href = link.getAttribute('href') || '';
            const parsedUrl = sanitizeUrl(href, { allowRelative: true, allowHttps: true, allowHttp: true });
            if (!parsedUrl) return;

            const absolute = new URL(parsedUrl, window.location.origin);
            if (absolute.origin === window.location.origin) return;

            e.preventDefault();
            openModal(absolute.toString());
        });
    });
});

/* Mobile Menu Logic */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
        if (menu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

/* Settings Logic */
function toggleSettings(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

/* openEmail() already defined above (line 381-385) with obfuscated email */



let playlistData = [];

function loadPlaylist() {
    loadSavedAutoplay(); // Restore setting
    const playlistUrl = 'https://musics.stealthylabs.eu/playlist.json';
    console.log("Loading playlist from:", playlistUrl);

    fetch(playlistUrl)
        .then(response => {
            console.log("Playlist fetch response:", response.status, response.ok);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Playlist data loaded:", data.length, "tracks");
            playlistData = data;
            if (playlistData && playlistData.length > 0) {
                initPlaylist();
            } else {
                console.error("Playlist is empty or invalid");
            }
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
    setCookie('userAutoplay', val);
}

function loadSavedAutoplay() {
    const saved = getCookie('userAutoplay');
    const selector = document.getElementById('autoplaySelector');
    if (selector) {
        selector.value = saved || 'on';
    }
}

function initPlaylist() {
    console.log("initPlaylist called, playlistData length:", playlistData.length);
    currentTrack = Math.floor(Math.random() * playlistData.length);

    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        const safeTitle = escapeHTML(t.title);
        const safeArtist = escapeHTML(t.artist);
        const safeCover = sanitizeUrl(resolvePlaylistPath(t.cover), { allowRelative: true, allowHttps: true, allowHttp: false });
        html += `<div class="playlist-item" data-i="${i}"><div class="playlist-item-cover">${safeCover ? `<img src="${safeCover}">` : defaultSVG}</div><div class="playlist-item-info"><div class="playlist-item-title">${safeTitle}</div><div class="playlist-item-artist">${safeArtist}</div></div></div>`;
    });

    if (playlistEl) {
        playlistEl.innerHTML = html;
        console.log("Playlist rendered successfully");
    } else {
        console.error("playlistEl not found!");
    }

    document.querySelectorAll(".playlist-item").forEach(el => {
        el.onclick = () => {
            currentTrack = parseInt(el.dataset.i);
            loadTrack(currentTrack);
            playTrack();
        };
    });

    loadTrack(currentTrack);

    // CHECK AUTOPLAY
    const autoplay = getCookie('userAutoplay');
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

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', playTrack);
        navigator.mediaSession.setActionHandler('pause', pauseTrack);
        navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    }
}

function loadTrack(i) {
    const t = playlistData[i];
    if (!t) return;

    const safeFile = sanitizeUrl(resolvePlaylistPath(t.file), { allowRelative: true, allowHttps: true, allowHttp: false });
    if (!safeFile) {
        console.error("Invalid audio source URL in playlist:", t.file);
        return;
    }

    audio.src = safeFile;

    const safeTitle = escapeHTML(t.title);
    const safeUrl = sanitizeUrl(t.url || '', { allowRelative: false, allowHttps: true, allowHttp: false });
    playerTrack.innerHTML = safeUrl ?
        `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; display: flex; align-items: center; gap: 6px;">
            ${safeTitle} 
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>`
        : safeTitle;
    playerTrack.removeAttribute('data-key');

    playerArtist.textContent = t.artist || '';
    const safeCover = sanitizeUrl(resolvePlaylistPath(t.cover), { allowRelative: true, allowHttps: true, allowHttp: false });
    playerArtwork.innerHTML = safeCover ? `<img src="${safeCover}">` : defaultSVG;

    document.querySelectorAll(".playlist-item").forEach((el, index) => {
        el.classList.toggle("active", index === i);
        const titleEl = el.querySelector('.playlist-item-title');
        if (index === i) titleEl.style.color = '#1db954'; else titleEl.style.color = '#ffffff';
    });

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: t.title,
            artist: t.artist,
            album: "StealthyLabs Network",
            artwork: safeCover ? [
                { src: safeCover, sizes: '96x96', type: 'image/png' },
                { src: safeCover, sizes: '128x128', type: 'image/png' },
                { src: safeCover, sizes: '192x192', type: 'image/png' },
                { src: safeCover, sizes: '256x256', type: 'image/png' },
                { src: safeCover, sizes: '384x384', type: 'image/png' },
                { src: safeCover, sizes: '512x512', type: 'image/png' },
            ] : []
        });
    }
}

function playTrack() {
    audio.play().then(() => {
        isPlaying = true;
        document.querySelector(".icon-play").style.display = "none";
        document.querySelector(".icon-pause").style.display = "block";
        document.querySelector(".music-player").classList.add("playing");
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
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
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
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
document.addEventListener('DOMContentLoaded', () => {
    // Ensure SITE_ROOT is set before any fetch (settings-handler.js runs later)
    if (!window.SITE_ROOT) {
        const meta = document.querySelector('meta[name="site-root"]');
        if (meta) window.SITE_ROOT = meta.content;
    }

    detectLanguage();
    loadPlaylist();
    connectLanyard();
    updateClock();
    updateServerStats();
    loadSavedFont();

    // Bind collapsible toggles
    document.querySelectorAll('[data-action="toggle-socials"]').forEach(el => {
        el.addEventListener('click', toggleSocials);
    });
    document.querySelectorAll('[data-action="toggle-music"]').forEach(el => {
        el.addEventListener('click', toggleMusic);
    });

    // Bind autoplay selector
    const autoplaySelector = document.getElementById('autoplaySelector');
    if (autoplaySelector) {
        autoplaySelector.addEventListener('change', () => {
            changeAutoplay(autoplaySelector.value);
        });
    }

    setInterval(updateClock, 1000);
    setInterval(updateServerStats, 60000);
});



// Typewriter Effect
// Typewriter Effect
// Variables moved to top

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
// function runTerminalIntro() {
//     const intro = document.getElementById('terminal-intro');
//     const textEl = document.getElementById('terminal-text');
//     const text = "> Booting StealthyLabs System...\n> Connection established.";
// 
//     // Check session storage
//     // if (sessionStorage.getItem('introShown')) {
//     //     if (intro) intro.style.display = 'none';
//     //     return;
//     // }
// 
//     if (!intro || !textEl) return;
// 
//     let i = 0;
//     const speed = 50; // ms per char
// 
//     function terminalTypeWriter() {
//         if (i < text.length) {
//             textEl.textContent += text.charAt(i);
//             i++;
//             setTimeout(terminalTypeWriter, speed);
//         } else {
//             // Animation finished
//             setTimeout(() => {
//                 intro.classList.add('fade-out');
//                 sessionStorage.setItem('introShown', 'true');
//                 setTimeout(() => {
//                     intro.style.display = 'none';
//                 }, 1000); // Wait for fade out
//             }, 1000); // Pause before fade out
//         }
//     }
// 
//     terminalTypeWriter();
// }
// 
// runTerminalIntro();

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
    if (typeof runTerminalIntro === 'function') {
        runTerminalIntro(); // Start new intro
    }
});

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}


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
