// =====================================================
// SCRIPT ACCUEIL (Léger : Heure, Langue, Settings)
// =====================================================

const JSON_PATH = 'translations/';
let currentLang = 'fr';
let currentTranslations = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log("📍 Script Accueil Chargé");

    // 1. Initialisation
    detectLanguage();
    loadSavedFont();
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Gestionnaire Menu Settings (Spécifique Accueil)
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

// --- FONCTIONS CORE ---

function toggleSettings(event) {
    if(event) event.stopPropagation();
    document.getElementById('settingsPanel').classList.toggle('show');
}

function detectLanguage() {
    const savedLang = localStorage.getItem('userLang');
    const browserLang = navigator.language || navigator.userLanguage;
    // On garde la mémoire partagée, c'est mieux pour l'utilisateur
    currentLang = savedLang ? savedLang : (browserLang.startsWith('fr') ? 'fr' : 'en');
    
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
            updateClock();
        })
        .catch(console.error);
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (currentTranslations[key]) {
            elem.innerHTML = currentTranslations[key]; // innerHTML pour le gras/liens
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

// Exports
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;