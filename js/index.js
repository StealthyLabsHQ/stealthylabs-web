let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    detectLanguage();
    loadSavedFont();
    updateClock();
    setupSearchBar();

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

let modal = document.getElementById('warningModal');
let targetUrlSpan = document.getElementById('targetUrl');
let continueBtn = document.getElementById('continueBtn');
let pendingUrl = '';

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

if (continueBtn) {
    continueBtn.addEventListener('click', () => {
        if (pendingUrl) {
            const urlToGo = pendingUrl;
            closeWarningModal();
            setTimeout(() => {
                window.open(urlToGo, '_blank', 'noopener,noreferrer');
            }, 100);
        }
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWarningModal();
        }
    });
}

function setupLinkListeners() {


    const lookyLink = document.querySelector('a[href="https://looky-gta.cc"]');
    if (lookyLink) {
        lookyLink.addEventListener('click', (e) => openWarningModal(e, "https://looky-gta.cc"));
    }

    const githubLink = document.querySelector('a[href="https://github.com/StealthyLabsHQ"]');
    if (githubLink) {
        githubLink.addEventListener('click', (e) => openWarningModal(e, "https://github.com/StealthyLabsHQ"));
    }

    const discordLink = document.querySelector('a[href="https://discord.gg/7CJbppbFdw"]');
    if (discordLink) {
        discordLink.addEventListener('click', (e) => openWarningModal(e, "https://discord.gg/7CJbppbFdw"));
    }

    const oxydmodLink = document.querySelector('a[href="https://oxydmod.com/store/looky-system"]');
    if (oxydmodLink) {
        oxydmodLink.addEventListener('click', (e) => openWarningModal(e, "https://oxydmod.com/store/looky-system"));
    }

    const lookyPricingLink = document.querySelector('a[href="https://looky-gta.cc/pricing"]');
    if (lookyPricingLink) {
        lookyPricingLink.addEventListener('click', (e) => openWarningModal(e, "https://looky-gta.cc/pricing"));
    }

}

document.addEventListener('DOMContentLoaded', setupLinkListeners);

function setupFooterWarnings() {
    const footerLinks = document.querySelectorAll('.footer-social-links a[target="_blank"]');
    if (!footerLinks.length) return;

    if (!modal) {
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
        targetUrlSpan = document.getElementById('targetUrl');
        continueBtn = document.getElementById('continueBtn');

        continueBtn.addEventListener('click', () => {
            if (pendingUrl) {
                const urlToGo = pendingUrl;
                closeWarningModal();
                setTimeout(() => {
                    window.open(urlToGo, '_blank', 'noopener,noreferrer');
                }, 100);
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeWarningModal();
        });
    }

    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => openWarningModal(e, link.href));
    });
}

document.addEventListener('DOMContentLoaded', setupFooterWarnings);

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
}

function toggleSettings(event) {
    if (event) event.stopPropagation();
    document.getElementById('settingsPanel').classList.toggle('show');
}

function detectLanguage() {
    const path = window.location.pathname;
    if (path.includes('/fr/')) {
        currentLang = 'fr';
    } else {
        currentLang = 'en';
    }

    // Only set the selector to match current page, do NOT overwrite cookie/localStorage
    // Cookie/localStorage should only be set by changeLanguage() when user explicitly changes

    const selector = document.getElementById('languageSelector');
    if (selector) selector.value = currentLang;
}

function changeLanguage(lang) {
    const safeLang = sanitizeLanguage(lang);
    if (!safeLang) return;

    currentLang = safeLang;
    setCookie('userLang', safeLang);

    // Also set a cross-domain cookie for subdomains (e.g. arcraiders.stealthylabs.eu)
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

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if (!clockEl) return;
    const now = new Date();
    let options = { hour: '2-digit', minute: '2-digit', hour12: (currentLang === 'en') };
    let timeStr = now.toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'fr-FR', options);
    if (currentLang !== 'en') timeStr = timeStr.replace(':', ':');
    clockEl.innerText = timeStr;
}

window.addEventListener('pageshow', function (event) {
    document.body.classList.remove('page-exiting');
    closeWarningModal();
});

// Export HTML
window.toggleSettings = toggleSettings;
window.changeLanguage = changeLanguage;
window.changeFont = changeFont;

// Search Bar Functionality
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(this.value);
        }
    });
}

function performSearch(query) {
    if (!query || query.trim() === '') return;

    // Use Google site search for stealthylabs.eu
    const searchUrl = `https://www.google.com/search?q=site:stealthylabs.eu+${encodeURIComponent(query.trim())}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
}

// Wire up tab buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.map-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openMapTab(e, btn.dataset.tab));
    });
    document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openBestiaryTab(e, btn.dataset.tab));
    });
});

// Map Tabs Logic
window.openMapTab = function (evt, mapName) {
    let i, tabcontent, tablinks;

    // Hide all tab contents
    tabcontent = document.getElementsByClassName("map-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    // Remove active class from all buttons
    tablinks = document.getElementsByClassName("map-tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the current tab and add active class to button
    const activeContent = document.getElementById(mapName);
    if (activeContent) {
        activeContent.style.display = "block";
        activeContent.classList.add("active");
    }

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
};

// Bestiary Tabs Logic
window.openBestiaryTab = function (evt, categoryName) {
    let i, tabcontent, tablinks;

    // Hide all tab contents
    tabcontent = document.getElementsByClassName("bestiary-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    // Remove active class from all buttons
    tablinks = document.getElementsByClassName("bestiary-tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the current tab and add active class to button
    const activeContent = document.getElementById(categoryName);
    if (activeContent) {
        activeContent.style.display = "block";
        activeContent.classList.add("active");
    }

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
};

function setupPageTransitions() {
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
            href.includes('looky-gta.cc') ||
            href.includes('github.com') ||
            href.includes('discord.gg') ||
            href.includes('discord.stealthylabs.eu') ||
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

document.addEventListener('DOMContentLoaded', setupPageTransitions);
