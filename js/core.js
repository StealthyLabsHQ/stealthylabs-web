// core.js — Shared logic for all StealthyLabs pages

let currentLang = 'en';
const VALID_THEMES = ['dark', 'light', 'system'];
let _systemThemeListener = null;

// --- Security Utilities ---

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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

// --- Language ---

function detectLanguage() {
    const path = window.location.pathname;
    currentLang = path.includes('/fr/') ? 'fr' : 'en';
    const selector = document.getElementById('languageSelector');
    if (selector) selector.value = currentLang;
}

function changeLanguage(lang) {
    const safeLang = sanitizeLanguage(lang);
    if (!safeLang) return;

    currentLang = safeLang;
    setCookie('userLang', safeLang);

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

// --- Font ---

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

// --- Theme ---

function _applySystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

function changeTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    // Remove previous system listener if any
    if (_systemThemeListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', _systemThemeListener);
        _systemThemeListener = null;
    }
    if (theme === 'system') {
        _applySystemTheme();
        _systemThemeListener = _applySystemTheme;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', _systemThemeListener);
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
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

// --- Clock ---

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if (currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

// --- UI ---

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    if (menu.parentElement !== document.body) document.body.appendChild(menu);
    menu.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('mobileMenu');
    if (menu && menu.parentElement !== document.body) document.body.appendChild(menu);
});

function toggleSettings(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

// --- External Link Warning Modal ---

let _modal = null;
let _targetUrlSpan = null;
let _continueBtn = null;
let _pendingUrl = '';

function openWarningModal(e, url) {
    if (!_modal || !_targetUrlSpan) return;
    const safeUrl = sanitizeExternalUrl(url);
    if (!safeUrl) return;
    e.preventDefault();
    _pendingUrl = safeUrl;
    _targetUrlSpan.textContent = safeUrl;
    _modal.classList.add('active');
}

function closeWarningModal() {
    if (!_modal) return;
    _modal.classList.remove('active');
    _pendingUrl = '';
}

function setupExternalLinkWarnings() {
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
            <p class="modal-desc">${isFr ? 'Vous \u00eates sur le point de quitter StealthyLabs pour :' : 'You are about to leave StealthyLabs for:'}</p>
            <div class="url-container">
                <span id="targetUrl">https://...</span>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeWarningModal()">${isFr ? 'Annuler' : 'Cancel'}</button>
                <button class="btn-continue" id="continueBtn">${isFr ? 'Continuer' : 'Continue'}</button>
            </div>
        </div>`;
    document.body.appendChild(div);
    _modal = div;
    _targetUrlSpan = div.querySelector('#targetUrl');
    _continueBtn = div.querySelector('#continueBtn');

    _continueBtn.addEventListener('click', () => {
        if (_pendingUrl) {
            const urlToGo = _pendingUrl;
            closeWarningModal();
            setTimeout(() => {
                window.open(urlToGo, '_blank', 'noopener,noreferrer');
            }, 100);
        }
    });

    div.addEventListener('click', (e) => {
        if (e.target === div) closeWarningModal();
    });

    // Intercept all external target="_blank" links
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        try {
            const linkOrigin = new URL(link.href, window.location.origin).origin;
            if (linkOrigin !== window.location.origin) {
                link.addEventListener('click', (e) => openWarningModal(e, link.href));
            }
        } catch (_) {}
    });
}

// --- Page Transitions ---

function setupPageTransitions() {
    window.addEventListener('pageshow', () => {
        document.body.classList.remove('page-exiting');
        if (_modal) _modal.classList.remove('active');
    });

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

// --- Back to Top ---

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

// --- Active Nav Highlight ---

function highlightActiveNav() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    let page = segments[segments.length - 1] || '';
    page = page.replace('.html', '');
    if (page === '' || page === 'index') page = '';

    document.querySelectorAll('.nav-links a, .mobile-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const hrefClean = href.replace(/\/$/, '').replace('.html', '').split('/').pop() || '';

        let isActive = false;
        if (page === hrefClean) {
            isActive = true;
        } else if (hrefClean === 'games' && path.includes('/games')) {
            isActive = true;
        } else if ((hrefClean === 'docs' || hrefClean === '.') && path.includes('/docs')) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add('nav-active');
        }
    });
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    detectLanguage();
    loadSavedFont();
    loadSavedTheme();
    updateClock();
    setupPageTransitions();
    setupExternalLinkWarnings();
    setupBackToTop();
    highlightActiveNav();

    setInterval(updateClock, 1000);
});

// --- Expose globally for settings-handler.js and inline handlers ---
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;
window.changeTheme = changeTheme;
window.toggleSettings = toggleSettings;
window.toggleMobileMenu = toggleMobileMenu;
window.openWarningModal = openWarningModal;
window.closeWarningModal = closeWarningModal;
