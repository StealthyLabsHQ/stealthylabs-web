// =====================================================
// SCRIPT ACCUEIL (Léger : Langue + Horloge)
// =====================================================

const JSON_PATH = '';
let currentLang = 'fr';
let currentTranslations = {};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation
    detectLanguage();
    loadSavedFont();
    updateClock();
    
    // 2. Boucle horloge uniquement
    setInterval(updateClock, 1000);

    // 3. Gestionnaire Menu Settings (Spécifique Accueil)
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        const settingsBtn = event.target.closest('button[onclick*="toggleSettings"]');
        
        if (panel && panel.classList.contains('show')) {
            if (!panel.contains(event.target) && !settingsBtn) {
                panel.classList.remove('show');
            }
        }
    });
});

// =====================================================
// GESTION MODAL REDIRECTION
// =====================================================
let pendingUrl = "";
const overlay = document.getElementById('redirectOverlay'); 
const urlDisplay = document.getElementById('redirectUrl');
const confirmBtn = document.getElementById('confirmRedirectBtn');

// Fermer la modal
function closeRedirect() {
    if(!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// Ouvrir la modal
function openModal(url) {
    if(!overlay) return;
    pendingUrl = url;
    if(urlDisplay) urlDisplay.innerText = url;
    
    overlay.style.display = 'flex'; 
    setTimeout(() => { overlay.classList.add('show'); }, 10);
}

if(confirmBtn) {
    confirmBtn.onclick = () => {
        window.open(pendingUrl, '_blank');
        closeRedirect();
    };
}

window.closeRedirect = closeRedirect;

// Intercepter les clics sur les liens externes
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[target="_blank"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            openModal(link.href);
        });
    });
});

// --- FONCTIONS CORE ---

function toggleSettings(event) {
    if(event) event.stopPropagation();
    document.getElementById('settingsPanel').classList.toggle('show');
}

function detectLanguage() {
    const savedLang = localStorage.getItem('userLang');
    const browserLang = navigator.language || navigator.userLanguage;
    currentLang = savedLang ? savedLang : (browserLang.startsWith('fr') ? 'fr' : 'en');
    
    const selector = document.getElementById('languageSelector');
    if(selector) selector.value = currentLang;
    
    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(res => res.json())
        .then(data => {
            currentTranslations = data;
            applyTranslations();
            updateClock();
        })
        .catch(console.error);
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) {
            elem.innerHTML = currentTranslations[key];
        }
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    loadLanguageFile(lang);
}

function changeFont(font) {
    document.documentElement.style.setProperty('--main-font', font);
    localStorage.setItem('userFont', font);
}

function loadSavedFont() {
    const saved = localStorage.getItem('userFont');
    if (saved) {
        document.documentElement.style.setProperty('--main-font', saved);
        const sel = document.getElementById('fontSelector');
        if(sel) sel.value = saved;
    }
}

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if(currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

// Exports pour le HTML
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;