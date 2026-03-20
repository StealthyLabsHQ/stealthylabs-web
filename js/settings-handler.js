// Shared Settings Panel Logic - Robust Closing & Event Bindings
document.addEventListener('DOMContentLoaded', () => {

    // --- Lazy CSS: switch media="print" to "all" for deferred stylesheets ---
    document.querySelectorAll('link[data-lazy-css][media="print"]').forEach(link => {
        link.media = 'all';
    });

    // --- SITE_ROOT: read from <meta name="site-root"> ---
    const siteRootMeta = document.querySelector('meta[name="site-root"]');
    if (siteRootMeta) {
        window.SITE_ROOT = siteRootMeta.content;
    }

    // --- Settings panel: close when clicking outside ---
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settingsPanel');

        if (panel && panel.classList.contains('show')) {
            if (panel.contains(e.target)) {
                return;
            }

            const toggleBtn = e.target.closest('.settings-btn');

            if (toggleBtn) {
                return;
            }

            panel.classList.remove('show');
        }
    });

    // --- Settings button ---
    document.querySelectorAll('.settings-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (typeof toggleSettings === 'function') toggleSettings(e);
        });
    });

    // --- Language selector ---
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.addEventListener('change', () => {
            if (typeof changeLanguage === 'function') changeLanguage(langSelector.value);
        });
    }

    // --- Font selector ---
    const fontSelector = document.getElementById('fontSelector');
    if (fontSelector) {
        fontSelector.addEventListener('change', () => {
            if (typeof changeFont === 'function') changeFont(fontSelector.value);
        });
    }

    // --- Theme selector ---
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.addEventListener('change', () => {
            if (typeof changeTheme === 'function') changeTheme(themeSelector.value);
        });
    }

    // --- Force Refresh button ---
    document.querySelectorAll('[data-action="force-refresh"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof forceRefresh === 'function') forceRefresh();
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255, 60, 60, 0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255, 60, 60, 0.1)';
        });
    });

    // --- Hamburger menu button ---
    document.querySelectorAll('.hamburger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof toggleMobileMenu === 'function') toggleMobileMenu();
        });
    });

    // --- Close menu button ---
    document.querySelectorAll('.close-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof toggleMobileMenu === 'function') toggleMobileMenu();
        });
    });

    // --- Mobile menu links: close menu on click ---
    document.querySelectorAll('.mobile-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof toggleMobileMenu === 'function') toggleMobileMenu();
        });
    });

    // --- forceRefresh function ---
    window.forceRefresh = function () {
        // Cookies persist across refresh by design — just clear sessionStorage and force reload
        sessionStorage.clear();

        const url = new URL(window.location.href);
        url.searchParams.set('nocache', new Date().getTime());
        window.location.href = url.toString();
    };

    // --- set_lang URL param sync (for cross-domain language setting) ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const setLang = urlParams.get('set_lang');
        if (setLang === 'fr' || setLang === 'en') {
            document.cookie = 'userLang=' + encodeURIComponent(setLang) + '; path=/; max-age=31536000; SameSite=Strict; Secure';
        }
    } catch (e) { /* URLSearchParams not supported */ }

    // --- Setup card links: open warning modal on click ---
    document.querySelectorAll('.setup-card').forEach(link => {
        link.addEventListener('click', (e) => {
            if (typeof openWarningModal === 'function') {
                openWarningModal(e, link.href);
            }
        });
    });

    // --- Details/accordion state persistence (Arc Raiders) ---
    const detailsConfig = [
        { id: 'details-bestiary', key: 'arc_bestiary_state' },
        { id: 'details-maps', key: 'arc_maps_state' }
    ];
    detailsConfig.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            const state = getCookie(item.key);
            if (state === 'closed') el.removeAttribute('open');
            else if (state === 'open') el.setAttribute('open', '');
            el.addEventListener('toggle', () => {
                setCookie(item.key, el.open ? 'open' : 'closed');
            });
        }
    });

    // --- Escape key closes settings ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('settingsPanel');
            if (panel && panel.classList.contains('show')) {
                panel.classList.remove('show');
            }
        }
    });
});
