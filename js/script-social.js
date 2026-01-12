// =====================================================
// SCRIPT SOCIAL INDÉPENDANT (js/script-social.js)
// =====================================================

// CONFIGURATION
const JSON_PATH = 'translations/'; // On garde ça car ton index fonctionne avec
let currentLang = 'fr';
let currentTranslations = {};
let pendingRedirectUrl = ''; 

// VARIABLES MUSIQUE
let playlistData = [];
let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Script Social Démarré");

    // 1. Initialiser Langue & Font
    detectLanguage();
    loadSavedFont();

    // 2. Initialiser Modules
    updateClock();
    updateDiscordStatus();
    updateServerStats();
    
    // 3. Initialiser Musique & Redirections
    loadPlaylist();
    initRedirections();

    // 4. Boucles de mise à jour
    setInterval(updateClock, 1000);
    setInterval(updateServerStats, 60000);
    setInterval(updateDiscordStatus, 30000);

    // 5. Fermeture du menu au clic extérieur
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        // Si le menu est ouvert et qu'on ne clique pas dedans
        if (panel && panel.classList.contains('show') && !panel.contains(event.target)) {
            panel.classList.remove('show');
        }
    });
});

// =====================================================
// PARTIE 1 : INTERFACE & REDIRECTION
// =====================================================

// Fonction appelée par le bouton HTML (Engrenage)
window.toggleSettings = function(event) {
    if (event) event.stopPropagation(); // EMPÊCHE LA FERMETURE IMMÉDIATE
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
};

// Fonction pour les boites déroulantes (Social / Musique)
window.toggleBox = function(id) {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('open');
    // Change la flèche du bouton associé
    const btn = document.querySelector(`[onclick="toggleBox('${id}')"]`);
    if(btn) btn.classList.toggle('active');
};

// Gestion des liens sortants (Pop-up)
function initRedirections() {
    const links = document.querySelectorAll('a[target="_blank"]');
    links.forEach(link => {
        // On ne bloque pas les boutons de musique ni les liens marqués "no-redirect"
        if (!link.classList.contains('no-redirect') && !link.closest('.player-controls')) {
            link.addEventListener('click', (e) => {
                if (link.href.startsWith('http')) {
                    e.preventDefault();
                    pendingRedirectUrl = link.href;
                    // Remplir et afficher la pop-up
                    document.getElementById('redirectUrl').innerText = link.href;
                    document.getElementById('redirectOverlay').classList.add('show');
                }
            });
        }
    });

    // Clic sur "Continuer"
    const confirmBtn = document.getElementById('confirmRedirectBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            window.open(pendingRedirectUrl, '_blank');
            window.closeRedirect();
        };
    }
}

// Fonction pour fermer la pop-up
window.closeRedirect = function() {
    document.getElementById('redirectOverlay').classList.remove('show');
};

// =====================================================
// PARTIE 2 : LANGUE & SYSTEME
// =====================================================

function detectLanguage() {
    const saved = localStorage.getItem('userLang');
    const browser = navigator.language || navigator.userLanguage;
    currentLang = saved ? saved : (browser.startsWith('fr') ? 'fr' : 'en');
    
    const selector = document.getElementById('languageSelector');
    if(selector) selector.value = currentLang;
    
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
            updateClock(); // Mise à jour format heure
            
            // Affichage conditionnel carte Guide (FR seulement)
            const g = document.getElementById('guidesCard');
            if(g) g.style.display = (lang === 'fr') ? 'flex' : 'none';
        })
        .catch(console.error);
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const k = el.getAttribute('data-key');
        if (currentTranslations[k]) {
            if (k === 'location') el.innerHTML = currentTranslations[k];
            else el.innerText = currentTranslations[k];
        }
    });
}

// Fonctions globales exposées
window.changeLanguage = function(lang) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
};

window.changeFont = function(font) {
    document.documentElement.style.setProperty('--main-font', font);
    localStorage.setItem('userFont', font);
};

function loadSavedFont() {
    const f = localStorage.getItem('userFont');
    if(f) {
        document.documentElement.style.setProperty('--main-font', f);
        const s = document.getElementById('fontSelector');
        if(s) s.value = f;
    }
}

function updateClock() {
    const el = document.getElementById('clockDisplay');
    if(!el) return;
    const now = new Date();
    let opt = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let s = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', opt);
    if(currentLang !== 'en') s = s.replace(':', ':');
    el.innerText = s;
}

// =====================================================
// PARTIE 3 : MUSIQUE (Autoplay & Aléatoire)
// =====================================================

function loadPlaylist() {
    // Si tes json sont à la racine, enlève 'json/' ici. Sinon garde 'json/playlist.json'
    fetch('json/playlist.json') 
        .then(res => res.json())
        .then(data => {
            playlistData = data;
            initPlayerUI();
            
            // --- LANCEMENT ALÉATOIRE ---
            if(playlistData.length > 0) {
                currentTrack = Math.floor(Math.random() * playlistData.length);
                loadTrack(currentTrack);
                
                // TENTATIVE AUTOPLAY
                const promise = audio.play();
                if (promise !== undefined) {
                    promise.then(() => {
                        isPlaying = true;
                        updatePlayIcons(true);
                    }).catch(() => {
                        console.log("Autoplay bloqué par le navigateur. Attente clic.");
                        // On attend le premier clic n'importe où pour lancer
                        document.addEventListener('click', forcePlay, { once: true });
                    });
                }
            }
        })
        .catch(console.error);
}

function forcePlay() {
    if(!isPlaying) {
        audio.play();
        isPlaying = true;
        updatePlayIcons(true);
    }
}

function initPlayerUI() {
    const list = document.getElementById("playlist");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
    
    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        html += `<div class="playlist-item" data-i="${i}">
            <div class="playlist-item-cover">${t.cover ? `<img src="${t.cover}">` : svg}</div>
            <div class="playlist-item-info"><div class="playlist-item-title">${t.title}</div><div class="playlist-item-artist">${t.artist}</div></div>
        </div>`;
    });
    list.innerHTML = html;
    
    document.querySelectorAll(".playlist-item").forEach(e => {
        e.onclick = () => { 
            currentTrack = parseInt(e.dataset.i); 
            loadTrack(currentTrack); 
            audio.play(); isPlaying=true; updatePlayIcons(true); 
        };
    });

    // Contrôles
    document.getElementById("playBtn").onclick = () => isPlaying ? (audio.pause(), isPlaying=false, updatePlayIcons(false)) : (audio.play(), isPlaying=true, updatePlayIcons(true));
    document.getElementById("nextBtn").onclick = () => { currentTrack=(currentTrack+1)%playlistData.length; loadTrack(currentTrack); if(isPlaying) audio.play(); };
    document.getElementById("prevBtn").onclick = () => { if(audio.currentTime>3) audio.currentTime=0; else currentTrack=(currentTrack-1+playlistData.length)%playlistData.length; loadTrack(currentTrack); if(isPlaying) audio.play(); };
    
    const vol = document.getElementById("volumeSlider");
    if(vol) vol.oninput = (e) => audio.volume = e.target.value / 100;
    
    audio.ontimeupdate = updateProgress;
    audio.onended = () => document.getElementById("nextBtn").click();
}

function loadTrack(i) {
    audio.src = playlistData[i].file;
    document.getElementById("playerTrack").innerText = playlistData[i].title;
    document.getElementById("playerArtist").innerText = playlistData[i].artist;
    
    document.querySelectorAll(".playlist-item").forEach((e, idx) => {
        e.classList.toggle("active", idx === i);
        e.querySelector('.playlist-item-title').style.color = (idx === i) ? '#1db954' : '#fff';
    });
}

function updatePlayIcons(play) {
    document.querySelector(".icon-play").style.display = play ? "none" : "block";
    document.querySelector(".icon-pause").style.display = play ? "block" : "none";
}

function updateProgress() {
    const bar = document.getElementById("progressFill");
    if (audio.duration && bar) { 
        bar.style.width = (audio.currentTime / audio.duration * 100) + "%"; 
        document.getElementById("timeCurrent").innerText = fmt(audio.currentTime); 
        document.getElementById("timeTotal").innerText = fmt(audio.duration);
    }
}
function fmt(s) { return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"); }

// --- DISCORD ---
function updateDiscordStatus() {
    fetch(`https://api.lanyard.rest/v1/users/1071461037741723648`).then(r=>r.json()).then(data=>{
        if(!data.success) return;
        const d = data.data;
        const status = d.discord_status;
        document.getElementById('discordAvatar').src = `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png?size=128`;
        document.getElementById('discordStatus').className = 'discord-status-dot ' + status;
        
        let txt = currentTranslations[`status_${status}`] || status;
        let html = `<div style="color:#888; font-size:0.8rem;">${txt}</div>`;
        
        if(d.listening_to_spotify && d.spotify) {
            html += `<div class="rp-game-row" style="align-items:flex-start;"><img src="${d.spotify.album_art_url}" class="rp-game-icon" style="margin-top:4px;"><div class="rp-game-info"><div class="rp-game-title" style="color:#fff;font-weight:700;">${d.spotify.song}</div><div class="rp-game-detail" style="color:#ccc;">${d.spotify.artist}</div></div></div>`;
        } else if(d.activities.length > 0) {
            const g = d.activities.find(a => a.type !== 4 && a.name !== "Spotify");
            if(g && g.assets) {
                let ico = g.assets.large_image.startsWith("mp:") ? `https://media.discordapp.net/${g.assets.large_image.slice(3)}` : `https://cdn.discordapp.com/app-assets/${g.application_id}/${g.assets.large_image}.png`;
                html += `<div class="rp-game-row"><img src="${ico}" class="rp-game-icon"><div class="rp-game-info"><div class="rp-game-title">${g.name}</div><div class="rp-game-detail">${g.details||g.state||""}</div></div></div>`;
            }
        }
        document.getElementById('discordActivity').innerHTML = html;
        
        const isLive = d.activities.some(a => a.type===1 || (a.name && a.name.toLowerCase()==='twitch'));
        const badge = document.getElementById('liveBadge');
        if(badge) {
            badge.style.display = isLive ? 'block' : 'none';
            if(isLive) badge.innerText = currentLang==='fr' ? "EN LIVE" : "LIVE";
        }
    }).catch(()=>{});
}
function updateServerStats() {
    fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/7CJbppbFdw?with_counts=true`).then(r=>r.json()).then(d=>{
        const el = document.getElementById('serverStats');
        if(el) {
            const g = `<span style="display:inline-block;width:8px;height:8px;background:#23a559;border-radius:50%;margin-right:4px;"></span>`;
            const gr = `<span style="display:inline-block;width:8px;height:8px;background:#747f8d;border-radius:50%;margin-left:8px;margin-right:4px;"></span>`;
            el.innerHTML = currentLang==='fr' ? `${g} ${d.approximate_presence_count} En ligne ${gr} ${d.approximate_member_count} Membres` : `${g} ${d.approximate_presence_count} Online ${gr} ${d.approximate_member_count} Members`;
        }
    }).catch(()=>{});
}
function checkCookieConsent() {
    if(!localStorage.getItem('cookieConsent')) setTimeout(()=>document.getElementById('cookieBanner').style.transform='translateY(0)',1000);
}
function acceptCookies() { localStorage.setItem('cookieConsent','true'); document.getElementById('cookieBanner').style.transform='translateY(100%)'; }

// --- MUSIQUE (AVEC AUTOPLAY) ---
let playlist=[], cur=0, isPlay=false;
const aud = new Audio();
function loadPlaylist() {
    fetch('json/playlist.json').then(r=>r.json()).then(d=>{
        playlist=d;
        initPlayer();
        // Lancement aléatoire
        if(playlist.length>0) {
            cur = Math.floor(Math.random()*playlist.length);
            loadTrack(cur);
            // Autoplay forcé
            aud.play().then(()=>{ isPlay=true; updIcons(true); })
               .catch(()=>{ console.log("Autoplay bloqué"); document.addEventListener('click', ()=>{ aud.play(); isPlay=true; updIcons(true); }, {once:true}); });
        }
    }).catch(console.error);
}
function initPlayer() {
    const el = document.getElementById("playlist");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
    let h = '<div class="playlist-header">Playlist</div>';
    playlist.forEach((t,i) => {
        h += `<div class="playlist-item" data-i="${i}"><div class="playlist-item-cover">${t.cover?`<img src="${t.cover}">`:svg}</div><div class="playlist-item-info"><div class="playlist-item-title">${t.title}</div><div class="playlist-item-artist">${t.artist}</div></div></div>`;
    });
    el.innerHTML = h;
    document.querySelectorAll(".playlist-item").forEach(e=>{
        e.onclick=()=>{ cur=parseInt(e.dataset.i); loadTrack(cur); aud.play().then(()=>{isPlay=true; updIcons(true);}); };
    });
    setupControls();
}
function setupControls() {
    document.getElementById("playBtn").onclick=()=>{ isPlay?pause():play(); };
    document.getElementById("nextBtn").onclick=next;
    document.getElementById("prevBtn").onclick=prev;
    document.getElementById("volumeSlider").oninput=e=>aud.volume=e.target.value/100;
    const bar = document.getElementById("progressBar");
    if(bar) bar.onclick=e=>{ if(aud.duration) aud.currentTime=(e.clientX-bar.getBoundingClientRect().left)/bar.offsetWidth*aud.duration; };
    aud.ontimeupdate=updProg; aud.onended=next;
}
function loadTrack(i) {
    aud.src=playlist[i].file;
    document.getElementById("playerTrack").innerText=playlist[i].title;
    document.getElementById("playerArtist").innerText=playlist[i].artist;
    document.querySelectorAll(".playlist-item").forEach((e,idx)=>{
        e.classList.toggle("active", idx===i);
        e.querySelector('.playlist-item-title').style.color = idx===i ? '#1db954' : '#fff';
    });
}
function play(){ aud.play().then(()=>{isPlay=true; updIcons(true);}); }
function pause(){ aud.pause(); isPlay=false; updIcons(false); }
function updIcons(p){ 
    document.querySelector(".icon-play").style.display=p?"none":"block";
    document.querySelector(".icon-pause").style.display=p?"block":"none";
}
function next(){ cur=(cur+1)%playlist.length; loadTrack(cur); if(isPlay) play(); }
function prev(){ if(aud.currentTime>3) aud.currentTime=0; else cur=(cur-1+playlist.length)%playlist.length; loadTrack(cur); if(isPlay) play(); }
function updProg(){
    if(aud.duration){
        document.getElementById("progressFill").style.width=(aud.currentTime/aud.duration*100)+"%";
        document.getElementById("timeCurrent").innerText=fmt(aud.currentTime);
        document.getElementById("timeTotal").innerText=fmt(aud.duration);
    }
}
function fmt(s){ return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"); }

// EXPORTS
window.toggleSettings = toggleSettings;
window.toggleSocials = toggleSocials;
window.toggleMusic = toggleMusic;
window.copyCode = copyCode;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;
window.closeRedirect = closeRedirect;
window.openEmail = openEmail;
window.acceptCookies = acceptCookies;