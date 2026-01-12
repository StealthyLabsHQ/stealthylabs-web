document.addEventListener('DOMContentLoaded', () => {
    loadPlaylist();
    
    // Toggle du lecteur
    window.toggleMusic = function() {
        const wrap = document.getElementById('musicWrapper');
        if(wrap) wrap.classList.toggle('open');
        const toggle = document.querySelector('.music-toggle');
        if(toggle) toggle.classList.toggle('active');
    };
});

let playlistData = [];
let currentTrack = 0;
let isPlaying = false;
const audio = new Audio();

function loadPlaylist() {
    // Si tes json sont à la racine, enlève "json/" ci-dessous :
    fetch('json/playlist.json') 
        .then(response => {
            if(!response.ok) throw new Error("Playlist introuvable");
            return response.json();
        })
        .then(data => {
            playlistData = data; 
            initPlaylistUI();
            
            // --- AUTOPLAY ---
            if(playlistData.length > 0) {
                // Choix aléatoire
                currentTrack = Math.floor(Math.random() * playlistData.length);
                loadTrack(currentTrack);
                
                // On essaie de jouer (peut être bloqué par Chrome/Firefox si pas de clic avant)
                playTrack();
            }
        })
        .catch(err => console.error("Erreur playlist:", err));
}

function initPlaylistUI() {
    const playlistEl = document.getElementById("playlist");
    const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
    
    if (playlistEl) {
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
        
        document.querySelectorAll(".playlist-item").forEach(el => {
            el.onclick = () => { 
                currentTrack = parseInt(el.dataset.i); 
                loadTrack(currentTrack); 
                playTrack(); 
            };
        });
    }

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
    if(!playlistData[i]) return;
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
        else if(el.querySelector('.playlist-item-title')) el.querySelector('.playlist-item-title').style.color = '#ffffff';
    });
}

function playTrack() { 
    // Tentative de lecture (promesse)
    var playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Lecture réussie
            isPlaying = true; 
            updatePlayIcons(true);
        })
        .catch(error => {
            // Bloqué par le navigateur (attente de clic)
            console.log("Autoplay bloqué par le navigateur (sécurité). Clic nécessaire.");
            isPlaying = false;
            updatePlayIcons(false);
        });
    }
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
    playTrack(); 
}

function prevTrack() { 
    if (audio.currentTime > 3) { 
        audio.currentTime = 0; 
    } else { 
        currentTrack = (currentTrack - 1 + playlistData.length) % playlistData.length; 
        loadTrack(currentTrack); 
    } 
    playTrack(); 
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