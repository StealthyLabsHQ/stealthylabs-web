// network.js — Network page specific logic (Discord, Music, Socials)
// Shared functions (language, theme, font, clock, etc.) are in core.js

let currentTranslations = {};

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

// --- Typewriter Effect ---
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
        typeSpeed = 50;
    } else {
        typewriterEl.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100 + Math.random() * 50;
    }

    document.title = typewriterEl.textContent + " | StealthyLabs";

    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }

    setTimeout(typeWriter, typeSpeed);
}

// --- Collapsible Toggles ---

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

// --- Email ---

function openEmail() {
    const user = "contact";
    const domain = "stealthylabs.eu";
    window.location.href = `mailto:${user}@${domain}`;
}

// --- Discord Lanyard WebSocket ---

const lanyardUserId = "1071461037741723648";
let lanyardSocket = null;
let heartbeatInterval = null;

function connectLanyard() {
    lanyardSocket = new WebSocket('wss://api.lanyard.rest/socket');

    lanyardSocket.onopen = () => {
        console.log("Connected to Lanyard WebSocket");
    };

    lanyardSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const op = data.op;
        const d = data.d;

        if (op === 1) {
            lanyardSocket.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: lanyardUserId }
            }));

            heartbeatInterval = setInterval(() => {
                lanyardSocket.send(JSON.stringify({ op: 3 }));
            }, d.heartbeat_interval);
        } else if (op === 0) {
            if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                updateDiscordUI(d);
            }
        }
    };

    lanyardSocket.onclose = () => {
        console.log("Disconnected from Lanyard. Reconnecting in 5s...");
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setTimeout(connectLanyard, 5000);
    };

    lanyardSocket.onerror = (error) => {
        console.error("Lanyard WebSocket Error:", error);
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

    if (user && nameEl) {
        const displayName = user.display_name || user.global_name || user.username;
        if (displayName) nameEl.textContent = displayName;
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
    // 2. Activities (Games, VSCode, etc.)
    else if (activities && activities.length > 0) {
        const game = activities.find(a => a.type !== 4);

        if (game) {
            let largeImage = null;
            let smallImage = null;

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

            if (!largeImage && game.application_id) {
                const cached = sessionStorage.getItem(`app-icon-${game.application_id}`);
                if (cached) largeImage = cached;
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

            if (gameStart) updateRpTimer(gameStart);

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

// --- Rich Presence Timer ---

let rpTimerInterval = null;
let spotifyInterval = null;

function updateRpTimer(startTime) {
    if (rpTimerInterval) clearInterval(rpTimerInterval);
    if (spotifyInterval) clearInterval(spotifyInterval);

    function update() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) return;

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

    function update() {
        const now = Date.now();
        const totalDuration = end - start;
        const currentCheck = now - start;
        const percent = Math.min((currentCheck / totalDuration) * 100, 100);

        const bar = document.getElementById('spotify-progress');
        const currEl = document.getElementById('spotify-curr');
        const endEl = document.getElementById('spotify-end');

        if (bar && currEl && endEl) {
            bar.style.width = `${percent}%`;

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

// --- Discord Server Stats ---

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
            console.error("Discord Stats Error:", err);
            document.getElementById('serverStats').textContent = (currentLang === 'fr') ? "Rejoindre le serveur" : "Join Server";
        });
}

// --- Cookie Banner ---

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

// --- Music Player ---

let playlistData = [];

function loadPlaylist() {
    loadSavedAutoplay();
    const playlistUrl = 'https://musics.stealthylabs.eu/playlist.json';

    fetch(playlistUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            playlistData = data;
            if (playlistData && playlistData.length > 0) {
                initPlaylist();
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
    currentTrack = Math.floor(Math.random() * playlistData.length);

    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        const safeTitle = escapeHTML(t.title);
        const safeArtist = escapeHTML(t.artist);
        const safeCover = sanitizeUrl(resolvePlaylistPath(t.cover), { allowRelative: true, allowHttps: true, allowHttp: false });
        html += `<div class="playlist-item" data-i="${i}"><div class="playlist-item-cover">${safeCover ? `<img src="${safeCover}">` : defaultSVG}</div><div class="playlist-item-info"><div class="playlist-item-title">${safeTitle}</div><div class="playlist-item-artist">${safeArtist}</div></div></div>`;
    });

    if (playlistEl) playlistEl.innerHTML = html;

    document.querySelectorAll(".playlist-item").forEach(el => {
        el.onclick = () => {
            currentTrack = parseInt(el.dataset.i);
            loadTrack(currentTrack);
            playTrack();
        };
    });

    loadTrack(currentTrack);

    const autoplay = getCookie('userAutoplay');
    if (autoplay !== 'off') {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                document.querySelector(".icon-play").style.display = "none";
                document.querySelector(".icon-pause").style.display = "block";
                document.querySelector(".music-player").classList.add("playing");
            }).catch(() => {
                document.addEventListener('click', function startAudioOnFirstClick() {
                    playTrack();
                    document.removeEventListener('click', startAudioOnFirstClick);
                }, { once: true });
            });
        }
    } else {
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
    if (!safeFile) return;

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
    }).catch(() => {
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

// --- Network Page Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    if (!window.SITE_ROOT) {
        const meta = document.querySelector('meta[name="site-root"]');
        if (meta) window.SITE_ROOT = meta.content;
    }

    // Set typewriter phrases based on language
    if (currentLang === 'fr') {
        phrases = ['Créateur de Contenu', 'Streamer'];
    } else {
        phrases = ['Content Creator', 'Streamer'];
    }

    loadPlaylist();
    connectLanyard();
    updateServerStats();

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

    setInterval(updateServerStats, 60000);

    // Smooth fade-in
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 50);

    typeWriter();
});

// --- Global Music Control (for Context Menu) ---
window.toggleGlobalMusic = function () {
    if (typeof isPlaying !== 'undefined' && typeof playTrack === 'function' && typeof pauseTrack === 'function') {
        if (isPlaying) { pauseTrack(); } else { playTrack(); }
    }
};
