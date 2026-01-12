// =====================================================
// SCRIPT ACCUEIL (index.html uniquement)
// =====================================================

// --- CONFIGURATION ---
// Si tes fichiers .json sont dans un dossier "translations", garde "translations/"
// S'ils sont à côté de index.html, mets juste ""
const JSON_PATH = 'translations/'; 

let currentLang = 'fr';
let currentTranslations = {};

// --- INITIALISATION IMMÉDIATE ---
(function init() {
    // 1. Lancer l'horloge tout de suite (évite le --:--)
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Détecter la langue
    detectAndApplyLanguage();

    // 3. Charger la police
    loadSavedFont();

    // 4. Lancer l'effet machine à écrire (Titre)
    initTypewriter();

    // 5. Gestionnaire pour fermer le menu si on clique ailleurs
    document.addEventListener('click', (event) => {
        const panel = document.getElementById('settingsPanel');
        const btn = document.querySelector('.settings-btn'); // Bouton spécifique à l'accueil
        
        if (panel && btn && panel.classList.contains('show')) {
            if (!panel.contains(event.target) && !btn.contains(event.target)) {
                panel.classList.remove('show');
            }
        }
    });
})();

// --- GESTION LANGUE ---
function detectAndApplyLanguage() {
    const savedLang = localStorage.getItem('userLang');
    const browserLang = navigator.language || navigator.userLanguage;

    // Priorité : Sauvegarde > Navigateur > Français
    if (savedLang) {
        currentLang = savedLang;
    } else {
        currentLang = browserLang.startsWith('fr') ? 'fr' : 'en';
    }

    // Mettre à jour le menu déroulant
    const langSelect = document.getElementById('languageSelector');
    if(langSelect) langSelect.value = currentLang;

    loadLanguageFile(currentLang);
}

function loadLanguageFile(lang) {
    fetch(`${JSON_PATH}${lang}.json`)
        .then(response => {
            if (!response.ok) throw new Error(`Traduction introuvable: ${lang}`);
            return response.json();
        })
        .then(data => {
            currentTranslations = data; 
            applyTranslations();
            updateClock(); // Met à jour le format (12h/24h)
        })
        .catch(err => {
            console.error("Erreur chargement langue:", err);
            // Si ça plante (ex: fichier introuvable), on force le sélecteur sur FR pour être cohérent
            if(document.getElementById('languageSelector')) {
                document.getElementById('languageSelector').value = 'fr';
            }
        });
}

function applyTranslations() {
    if (!currentTranslations) return;
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

// --- FONCTIONS UI ---
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--main-font', fontFamily);
    localStorage.setItem('userFont', fontFamily);
}

function loadSavedFont() {
    const savedFont = localStorage.getItem('userFont');
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        const fontSel = document.getElementById('fontSelector');
        if (fontSel) fontSel.value = savedFont;
    }
}

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;

    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit' };
    
    // Anglais = AM/PM, Français = 24h
    if (currentLang === 'en') {
        options.hour12 = true;
        clockEl.innerText = now.toLocaleTimeString('en-US', options);
    } else {
        options.hour12 = false;
        clockEl.innerText = now.toLocaleTimeString('fr-FR', options).replace(':', ':'); 
    }
}

function initTypewriter() {
    const targetTitle = "StealthyLabs | Content Creator"; 
    let index = 0;
    document.title = "_";

    function type() {
        if (index < targetTitle.length) {
            document.title = targetTitle.substring(0, index + 1) + "_";
            index++;
            setTimeout(type, 200);
        } else {
            setTimeout(() => { document.title = targetTitle + " "; }, 500);
            setTimeout(() => { document.title = targetTitle + "_"; }, 1000);
            setTimeout(() => { document.title = targetTitle; }, 1500);
        }
    }
    setTimeout(type, 500);
}

// Exports pour le HTML
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;