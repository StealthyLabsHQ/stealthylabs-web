
// Shared Logic for StealthyLabs Website

let currentLang = 'en';

function sanitizeLanguage(lang) {
    return lang === 'fr' || lang === 'en' ? lang : null;
}

function sanitizeExternalUrl(url) {
    if (typeof url !== 'string') return '';
    const input = url.trim();
    if (!input || input.startsWith('//')) return '';
    try {
        const parsed = new URL(input, window.location.origin);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.toString();
        }
    } catch (error) {
        return '';
    }
    return '';
}

document.addEventListener('DOMContentLoaded', () => {
    detectLanguage();
    loadSavedFont();
    loadSavedTheme();
    updateClock();
    setupPageTransitions();
    setupFooterWarnings();
    setupBackToTop();
    highlightActiveNav();

    // Clock interval
    setInterval(updateClock, 1000);
});

/* --- Language Logic --- */
function detectLanguage() {
    const path = window.location.pathname;
    if (path.includes('/fr/')) {
        currentLang = 'fr';
    } else {
        currentLang = 'en';
    }

    const selector = document.getElementById('languageSelector');
    if (selector) selector.value = currentLang;
}

function changeLanguage(lang) {
    const safeLang = sanitizeLanguage(lang);
    if (!safeLang) return;

    currentLang = safeLang;
    setCookie('userLang', safeLang);

    // Also set a cross-domain cookie for subdomains
    const domain = window.location.hostname.includes('stealthylabs.eu') ? '.stealthylabs.eu' : window.location.hostname;
    document.cookie = `userLang=${safeLang}; path=/; domain=${domain}; max-age=31536000; SameSite=Lax; Secure`;

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

/* --- Font Logic --- */
function changeFont(font) {
    if (!isAllowedFont(font)) return;
    document.documentElement.style.setProperty('--main-font', font);
    setCookie('userFont', font);
}

function loadSavedFont() {
    const saved = getCookie('userFont');
    if (saved && isAllowedFont(saved)) {
        document.documentElement.style.setProperty('--main-font', saved);
        const sel = document.getElementById('fontSelector');
        if (sel) sel.value = saved;
    }
}

/* --- Clock Logic --- */
function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if (currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

/* --- UI Logic --- */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function toggleSettings(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

/* --- External Link Warning --- */
let modal = null;
let targetUrlSpan = null;
let continueBtn = null;
let pendingUrl = '';

function openWarningModal(e, url) {
    if (!modal || !targetUrlSpan) return;
    const safeUrl = sanitizeExternalUrl(url);
    if (!safeUrl) return;
    e.preventDefault();
    pendingUrl = safeUrl;
    targetUrlSpan.textContent = safeUrl;
    modal.classList.add('active');
}

function closeWarningModal() {
    if (!modal) return;
    modal.classList.remove('active');
    pendingUrl = '';
}

function setupFooterWarnings() {
    const footerLinks = document.querySelectorAll('.footer-social-links a[target="_blank"]');
    if (!footerLinks.length) return;

    const isFr = window.location.pathname.includes('/fr/');
    const div = document.createElement('div');
    div.id = 'warningModal';
    div.className = 'modal-overlay';
    div.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon">
                <svg viewBox="0 0 24 24" width="50" height="50">
                    <path fill="#FFC107" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
            </div>
            <h2>${isFr ? 'Redirection en attente' : 'Redirection pending'}</h2>
            <p class="modal-desc">${isFr ? 'Vous êtes sur le point de quitter StealthyLabs pour :' : 'You are about to leave StealthyLabs for:'}</p>
            <div class="url-container">
                <span id="targetUrl">https://...</span>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeWarningModal()">${isFr ? 'Annuler' : 'Cancel'}</button>
                <button class="btn-continue" id="continueBtn">${isFr ? 'Continuer' : 'Continue'}</button>
            </div>
        </div>`;
    document.body.appendChild(div);
    modal = div;
    targetUrlSpan = div.querySelector('#targetUrl');
    continueBtn = div.querySelector('#continueBtn');

    continueBtn.addEventListener('click', () => {
        if (pendingUrl) {
            const urlToGo = pendingUrl;
            closeWarningModal();
            setTimeout(() => {
                window.open(urlToGo, '_blank', 'noopener,noreferrer');
            }, 100);
        }
    });

    div.addEventListener('click', (e) => {
        if (e.target === div) closeWarningModal();
    });

    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => openWarningModal(e, link.href));
    });
}

/* --- Page Transitions --- */
function setupPageTransitions() {
    // Handle bfcache restore
    window.addEventListener('pageshow', () => {
        document.body.classList.remove('page-exiting');
        if (modal) modal.classList.remove('active');
    });

    // Exit animation on internal link click
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        if (!href ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('javascript:') ||
            link.target === '_blank' ||
            link.hasAttribute('onclick')
        ) {
            return;
        }

        e.preventDefault();
        document.body.classList.add('page-exiting');

        setTimeout(() => {
            window.location.href = link.href;
        }, 200);
    });
}

/* --- Theme Logic --- */
const VALID_THEMES = ['dark', 'light'];

function changeTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    document.documentElement.setAttribute('data-theme', theme);
    setCookie('userTheme', theme);
}

function loadSavedTheme() {
    const saved = getCookie('userTheme');
    if (saved && VALID_THEMES.includes(saved)) {
        changeTheme(saved);
        const sel = document.getElementById('themeSelector');
        if (sel) sel.value = saved;
    }
}

/* --- Back to Top Button --- */
function setupBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(btn);

    let isVisible = false;
    window.addEventListener('scroll', () => {
        const shouldShow = window.scrollY > 300;
        if (shouldShow !== isVisible) {
            isVisible = shouldShow;
            btn.classList.toggle('visible', shouldShow);
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* --- Active Nav Link --- */
function highlightActiveNav() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    // Get the page segment (last meaningful part)
    let page = segments[segments.length - 1] || '';
    // Remove .html extension if present
    page = page.replace('.html', '');
    // Handle index pages
    if (page === '' || page === 'index') page = '';

    document.querySelectorAll('.nav-links a, .mobile-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const hrefClean = href.replace(/\/$/, '').replace('.html', '').split('/').pop() || '';

        let isActive = false;
        if (page === hrefClean) {
            isActive = true;
        } else if (hrefClean === 'games' && path.includes('/games')) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add('nav-active');
        }
    });
}

// Expose functions globally
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;
window.changeTheme = changeTheme;
window.toggleSettings = toggleSettings;
window.toggleMobileMenu = toggleMobileMenu;
