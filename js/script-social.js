// =====================================================
// SCRIPT SOCIAL (Complet : Musique, Discord, Redir)
// =====================================================

const JSON_PATH = ''; // Vide car fr.json est à la racine
let currentLang = 'fr';
let currentTranslations = {};
let pendingRedirectUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation Langue & Font
    detectLanguage();
    loadSavedFont();
    updateClock();
    
    // 2. Modules spécifiques Social
    loadPlaylist();       // Musique
    updateDiscordStatus(); // Discord
    updateServerStats();   // Stats Serveur
    checkCookieConsent();
    initRedirections();    // Pop-up liens

    // 3. Boucles
    setInterval(updateClock, 1000);
    setInterval(updateServerStats, 60000);
    setInterval(updateDiscordStatus, 30000);

    // 4. Gestionnaire Menu Settings
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        const settingsBtn = event.target.closest('button[onclick*="toggleSettings"]');
        if (panel && panel.classList.contains('show') && !panel.contains(event.target) && !settingsBtn) {
            panel.classList.remove('show');
        }
    });
});

// --- UI & CORE ---
function toggleSettings(event) {
    if(event) event.stopPropagation();
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
    const t = document.getElementById("tooltip");
    t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000);
}
function openEmail() { window.location.href = `mailto:contact@stealthylabs.eu`; }

// --- LANGUE ---
function detectLanguage() {
    const saved = localStorage.getItem('userLang');
    currentLang = saved ? saved : (navigator.language.startsWith('fr') ? 'fr' : 'en');
    const sel = document.getElementById('languageSelector');
    if(sel) sel.value = currentLang;
    loadLanguageFile(currentLang);
}
function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(r => r.json())
        .then(d => {
            currentTranslations = d;
            applyTranslations();
            updateClock();
            updateDiscordStatus();
            // Gestion carte guide (FR uniquement)
            const g = document.getElementById('guidesCard');
            if(g) g.style.display = (lang === 'fr') ? 'flex' : 'none';
        })
        .catch(console.error);
}
function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const k = el.getAttribute('data-key');
        if(currentTranslations[k]) {
            if(k === 'location') el.innerHTML = currentTranslations[k];
            else el.innerText = currentTranslations[k];
        }
    });
}
function changeLanguage(l) { currentLang = l; localStorage.setItem('userLang', l); loadLanguageFile(l); }
function changeFont(f) { document.documentElement.style.setProperty('--main-font', f); localStorage.setItem('userFont', f); }
function loadSavedFont() {
    const f = localStorage.getItem('userFont');
    if(f) { document.documentElement.style.setProperty('--main-font', f); 
    const sel = document.getElementById('fontSelector'); if(sel) sel.value = f; }
}
function updateClock() {
    const el = document.getElementById('clockDisplay'); if(!el) return;
    const now = new Date();
    let opt = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let s = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', opt);
    if(currentLang!=='en') s = s.replace(':', ':');
    el.innerText = s;
}

// --- REDIRECTION ---
function initRedirections() {
    document.querySelectorAll('a[target="_blank"]').forEach(l => {
        if(!l.classList.contains('no-redirect') && !l.classList.contains('music-platform-btn')) {
            l.addEventListener('click', e => {
                if(l.href.startsWith('http')) { e.preventDefault(); openModal(l.href); }
            });
        }
    });
    const btn = document.getElementById('confirmRedirectBtn');
    if(btn) btn.onclick = () => { window.open(pendingRedirectUrl, '_blank'); closeRedirect(); };
}
function openModal(url) {
    pendingRedirectUrl = url;
    document.getElementById('redirectUrl').innerText = url;
    const o = document.getElementById('redirectOverlay');
    o.classList.add('show'); o.style.display = 'flex';
}
function closeRedirect() {
    const o = document.getElementById('redirectOverlay');
    o.classList.remove('show'); setTimeout(() => o.style.display = 'none', 300);
}

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