// =====================================================
// GESTION MUSIQUE & INTERFACE SOCIALE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPlaylist();
    
    // Initialisation des toggles (pour les boites Social & Musique)
    window.toggleMusic = function() {
        document.getElementById('musicWrapper').classList.toggle('open');
        document.querySelector('.music-toggle').classList.toggle('active');
    };

    window.toggleSocials = function() {
        document.getElementById('socialsWrapper').classList.toggle('open');
        document.querySelector('.socials-toggle').classList.toggle('active');
    };

    window.copyCode = function() {
        navigator.clipboard.writeText("stealthylabs");
        const tooltip = document.getElementById("tooltip");
        if(tooltip) {
            tooltip.classList.add("show");
            setTimeout(() => tooltip.classList.remove("show"), 2000);
        }
    };
});

let playlistData = [];
let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();

function loadPlaylist() {
    fetch('json/playlist.json')
        .then(response => response.json())
        .then(data => {
            playlistData = data; 
            initPlaylistUI();  
        })
        .catch(err => console.error("Erreur chargement playlist:", err));
}

function initPlaylistUI() {
    const playlistEl = document.getElementById("playlist");
    const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
    
    if (!playlistEl) return;

    // Création de la liste
    let html = '<div class="playlist-header">Playlist</div>';
    playlistData.forEach((t, i) => {
        html += `<div class="playlist-item" data-i="${i}">
                    <div class="playlist-item-cover">${t.cover ? `<img src="${t.cover}">` : defaultSVG}</div>
                    <div class="playlist-item-info">
                        <div class="playlist-item-title">${t.title}</div>
                        <div class="playlist-item-artist">${t.artist}</div>
                    </div>
                 </div>`;
    });
    playlistEl.innerHTML = html;
    
    // Clics sur la playlist
    document.querySelectorAll(".playlist-item").forEach(el => {
        el.onclick = () => { 
            currentTrack = parseInt(el.dataset.i); 
            loadTrack(currentTrack); 
            playTrack(); 
        };
    });

    // Chargement initial
    loadTrack(Math.floor(Math.random() * playlistData.length));
    
    // Events Player
    setupPlayerControls();
}

function setupPlayerControls() {
    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const progressBar = document.getElementById("progressBar");
    const volumeSlider = document.getElementById("volumeSlider");

    if(playBtn) playBtn.onclick = () => isPlaying ? pauseTrack() : playTrack();
    if(nextBtn) nextBtn.onclick = nextTrack;
    if(prevBtn) prevBtn.onclick = prevTrack;
    
    if(volumeSlider) volumeSlider.oninput = () => audio.volume = volumeSlider.value / 100;
    
    if(progressBar) progressBar.onclick = e => { 
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
    
    const titleEl = document.getElementById("playerTrack");
    const artistEl = document.getElementById("playerArtist");
    const artworkEl = document.getElementById("playerArtwork");
    const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    if(titleEl) {
        titleEl.textContent = t.title;
        titleEl.removeAttribute('data-key'); 
    }
    if(artistEl) artistEl.textContent = t.artist;
    if(artworkEl) artworkEl.innerHTML = t.cover ? `<img src="${t.cover}">` : defaultSVG;
    
    document.querySelectorAll(".playlist-item").forEach((el, index) => {
        el.classList.toggle("active", index === i);
        const tEl = el.querySelector('.playlist-item-title');
        if(tEl) tEl.style.color = (index === i) ? '#1db954' : '#ffffff';
    });
}

function playTrack() { 
    audio.play().then(() => { 
        isPlaying = true; 
        updatePlayIcons(true);
    }).catch(e => {
        // Autoplay bloqué : on attend un clic
        console.log("Autoplay bloqué");
    });
}

function pauseTrack() { 
    audio.pause(); 
    isPlaying = false; 
    updatePlayIcons(false);
}

function updatePlayIcons(playing) {
    const playIcon = document.querySelector(".icon-play");
    const pauseIcon = document.querySelector(".icon-pause");
    if(playIcon) playIcon.style.display = playing ? "none" : "block";
    if(pauseIcon) pauseIcon.style.display = playing ? "block" : "none";
}

function nextTrack() { 
    currentTrack = (currentTrack + 1) % playlistData.length; 
    loadTrack(currentTrack); 
    if (isPlaying) playTrack(); 
}

function prevTrack() { 
    if (audio.currentTime > 3) { 
        audio.currentTime = 0; 
    } else { 
        currentTrack = (currentTrack - 1 + playlistData.length) % playlistData.length; 
        loadTrack(currentTrack); 
    } 
    if (isPlaying) playTrack(); 
}

function updateProgress() {
    const progressFill = document.getElementById("progressFill");
    const timeCurrent = document.getElementById("timeCurrent");
    const timeTotal = document.getElementById("timeTotal");
    
    if (audio.duration && isFinite(audio.duration)) { 
        if(progressFill) progressFill.style.width = (audio.currentTime / audio.duration * 100) + "%"; 
        if(timeCurrent) timeCurrent.textContent = fmt(audio.currentTime); 
        if(timeTotal) timeTotal.textContent = fmt(audio.duration);
    }
}

function fmt(s) { 
    if (!isFinite(s)) return "0:00"; 
    return Math.floor(s/60) + ":" + String(Math.floor(s%60)).padStart(2,"0"); 
}