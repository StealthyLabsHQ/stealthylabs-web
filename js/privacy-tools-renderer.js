/**
 * Privacy Tools Renderer
 * Dynamically generates tool cards from data loaded via
 * privacy-tools-data-en.js or privacy-tools-data-fr.js.
 * The data script must be loaded BEFORE this renderer.
 */
(function () {
    // Security: Escape HTML to prevent XSS from data fields
    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str == null ? '' : str);
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Security: Allow only http(s) external URLs
    function sanitizeExternalUrl(url) {
        if (typeof url !== 'string') return '';
        var input = url.trim();
        if (!input || input.indexOf('//') === 0) return '';
        try {
            var parsed = new URL(input);
            if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                return parsed.toString();
            }
        } catch (e) {
            return '';
        }
        return '';
    }

    // Security: Block traversal / unsafe chars in icon filenames
    function sanitizeIconFileName(file) {
        if (typeof file !== 'string') return '';
        var cleaned = file.trim();
        if (!cleaned) return '';
        if (!/^[a-zA-Z0-9 _.\-()]+$/.test(cleaned)) return '';
        return cleaned;
    }

    var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
    var replaceLabel = lang === 'fr' ? 'Remplace :' : 'Replaces:';
    var diffLabels = lang === 'fr'
        ? ['Facile', 'Moyen', 'Expert']
        : ['Easy', 'Medium', 'Expert'];
    var diffClasses = ['badge-easy', 'badge-medium', 'badge-expert'];

    var grid = document.getElementById('tools-grid');
    if (!grid) return;

    var tools = window.PRIVACY_TOOLS_DATA;
    if (!tools || !Array.isArray(tools)) {
        console.error('Privacy tools data not found.');
        grid.innerHTML = '<p style="color:#ff6b6b; text-align:center;">Failed to load tools data.</p>';
        return;
    }

    var root = window.SITE_ROOT || '../../../';

    function buildCard(t) {
        var card = document.createElement('div');
        card.className = 'tool-card-privacy';
        card.dataset.category = escapeHTML(t.cat);
        card.dataset.title = escapeHTML((t.title || '').toLowerCase());
        card.dataset.replaces = escapeHTML((t.replaces || '').toLowerCase());

        var regionClass = t.region === 'eu' ? 'badge-eu' : 'badge-us';
        var regionFlag = t.region === 'eu' ? '&#x1F1EA;&#x1F1FA;' : (t.regionIcon || '&#x1F1FA;&#x1F1F8;');

        var iconHTML;
        if (t.icon) {
            var safeIcon = sanitizeIconFileName(t.icon);
            if (safeIcon) {
                iconHTML = '<img src="' + root + 'img/privacy/' + encodeURI(safeIcon) + '" alt="' + escapeHTML(t.title) + '" class="tool-icon">';
            } else {
                iconHTML = '<span class="acc-summary-icon">' + escapeHTML(t.iconEmoji || '&#x1F527;') + '</span>';
            }
        } else {
            iconHTML = '<span class="acc-summary-icon">' + escapeHTML(t.iconEmoji || '&#x1F527;') + '</span>';
        }

        var diffHTML = '';
        if (t.difficulty >= 1 && t.difficulty <= 3) {
            var idx = t.difficulty - 1;
            diffHTML = '<span class="badge-difficulty ' + diffClasses[idx] + '">' + diffLabels[idx] + '</span>';
        }

        var warningHTML = '';
        if (t.warning) {
            warningHTML = '<p class="tool-card-warning">' + escapeHTML(t.warning) + '</p>';
        }

        var extraHTML = '';
        if (t.extraInfo) {
            extraHTML = '<p class="tool-card-extra">' + escapeHTML(t.extraInfo) + '</p>';
        }

        var replacesHTML = '';
        if (t.replaces) {
            replacesHTML = '<p class="tool-card-replaces">' + replaceLabel + ' <span class="strike">' + escapeHTML(t.replaces) + '</span></p>';
        }

        var safeToolUrl = sanitizeExternalUrl(t.url || '');
        var linkHTML = safeToolUrl
            ? '<a href="' + safeToolUrl + '" target="_blank" rel="noopener noreferrer" class="tool-ext-link">&#x1F517; ' + escapeHTML(t.urlLabel || 'Open') + '</a>'
            : '<span class="tool-ext-link" aria-disabled="true">&#x1F517; ' + escapeHTML(t.urlLabel || 'Unavailable') + '</span>';

        card.innerHTML =
            '<div class="tool-card-header">' +
            '  <div class="tool-card-name">' + iconHTML +
            '    <h3 class="tool-title">' + escapeHTML(t.title) + '</h3>' +
            '  </div>' +
            '  <div class="tool-badges">' +
            '    <span class="badge-region ' + regionClass + '">' + regionFlag + ' ' + escapeHTML(t.country) + '</span>' +
            '    ' + diffHTML +
            '  </div>' +
            '</div>' +
            '<p class="tool-card-desc">' + escapeHTML(t.desc) + '</p>' +
            '<div class="tool-card-details">' +
            '  <p class="tool-card-pros">' + escapeHTML(t.pros) + '</p>' +
            '  <p class="tool-card-cons">' + escapeHTML(t.cons) + '</p>' +
            '</div>' +
            warningHTML +
            extraHTML +
            replacesHTML +
            linkHTML;

        return card;
    }

    var fragment = document.createDocumentFragment();
    tools.forEach(function (t) {
        fragment.appendChild(buildCard(t));
    });
    grid.appendChild(fragment);

    var searchInput = document.getElementById('tools-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var query = this.value.toLowerCase().trim();
            var cards = document.querySelectorAll('.tool-card-privacy');
            cards.forEach(function (card) {
                if (!query) {
                    card.style.display = '';
                    return;
                }
                var title = card.dataset.title || '';
                var replaces = card.dataset.replaces || '';
                var desc = (card.querySelector('.tool-card-desc') || {}).textContent || '';
                if (title.indexOf(query) !== -1 || replaces.indexOf(query) !== -1 || desc.toLowerCase().indexOf(query) !== -1) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
            document.querySelectorAll('.filter-btn').forEach(function (b) {
                b.classList.remove('active');
            });
        });
    }
})();
