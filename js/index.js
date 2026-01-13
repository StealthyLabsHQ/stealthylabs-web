// =====================================================
// SCRIPT ACCUEIL
// =====================================================

const JSON_PATH = '';
let currentLang = 'en';
let currentTranslations = {};

document.addEventListener('DOMContentLoaded', () => {

    detectLanguage();
    loadSavedFont();
    updateClock();

    setInterval(updateClock, 1000);

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

const modal = document.getElementById('warningModal');
    const targetUrlSpan = document.getElementById('targetUrl');
    const continueBtn = document.getElementById('continueBtn');
    let pendingUrl = '';

    function openWarningModal(e, url) {
        e.preventDefault();
        pendingUrl = url;
        targetUrlSpan.textContent = url;
        modal.classList.add('active');
    }

    function closeWarningModal() {
        modal.classList.remove('active');
        pendingUrl = '';
    }

    continueBtn.addEventListener('click', () => {
    if (pendingUrl) {
            const urlToGo = pendingUrl;
            closeWarningModal();
            setTimeout(() => {
                if (urlToGo.includes('looky-gta.cc')) {
                    window.open(urlToGo, '_blank');
                } else {
                    window.location.href = urlToGo;
                }
            }, 100);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWarningModal();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {

        const networkLinks = document.querySelectorAll('a[href="network"]');
        networkLinks.forEach(link => {
            link.addEventListener('click', (e) => openWarningModal(e, "https://stealthylabs.eu/network"));
        });

        const lookyLink = document.querySelector('a[href="https://looky-gta.cc"]');
        if (lookyLink) {
            lookyLink.addEventListener('click', (e) => openWarningModal(e, "https://looky-gta.cc"));
        }

        const ctaBtn = document.querySelector('.cta-button');
        if(ctaBtn && ctaBtn.getAttribute('href') === 'network') {
            ctaBtn.addEventListener('click', (e) => openWarningModal(e, "https://stealthylabs.eu/network"));
        }
    });

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

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

window.addEventListener('pageshow', function(event) {
    closeWarningModal();
});

// Exports pour le HTML
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;