// Language redirection for root-level pages
// Reads <meta name="lang-redirect" content="target-path"> to determine where to redirect
(function () {
    var path = window.location.pathname;
    if (path.includes('/fr/') || path.includes('/en/')) return;

    var lang = null;

    // Priority 0: URL parameter (cross-domain method)
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var urlLang = urlParams.get('lang');
        if (urlLang === 'fr' || urlLang === 'en') lang = urlLang;
    } catch (e) { /* URLSearchParams not supported */ }

    // Priority 1: Cookie
    if (!lang) {
        var cookieMatch = document.cookie.match(/(^| )userLang=([^;]+)/);
        if (cookieMatch) {
            var decoded = decodeURIComponent(cookieMatch[2]);
            if (decoded === 'fr' || decoded === 'en') lang = decoded;
        }
    }

    // Priority 2: Browser language
    if (!lang) {
        var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        lang = browserLang.startsWith('fr') ? 'fr' : 'en';
    }

    // Safety check
    if (lang !== 'fr' && lang !== 'en') lang = 'en';

    // Read target from meta tag
    var meta = document.querySelector('meta[name="lang-redirect"]');
    var target = meta ? meta.getAttribute('content') : null;

    if (!target) {
        // Fallback: derive from current page name
        var pageName = path.split('/').pop() || '';
        target = pageName.replace(/\.html$/, '') || 'network';
    }

    window.location.replace('/' + lang + '/' + target);
})();
