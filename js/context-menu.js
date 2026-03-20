// Enhanced Context Menu - Full Logic (Redirect, Tooltip, Visibility)
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Check
    if (window.innerWidth < 768 || 'ontouchstart' in window) return;

    // --- 0. Detect Language ---
    const isFrench = window.location.pathname.includes('/fr/');
    const t = {
        redirect_title:  isFrench ? 'Attente de redirection' : 'Redirection pending',
        redirect_text:   isFrench ? 'Vous êtes sur le point de quitter StealthyLabs vers :' : 'You are about to leave StealthyLabs for:',
        btn_cancel:      isFrench ? 'Annuler' : 'Cancel',
        btn_continue:    isFrench ? 'Continuer' : 'Continue',
        tooltip:         isFrench ? 'Code copié !' : 'Copied!',
        ctx_home:        isFrench ? 'Retour Accueil' : 'Back to Home',
        ctx_music:       isFrench ? 'Play/Pause Musique' : 'Play/Pause Music',
        ctx_copy:        isFrench ? "Copier l'URL" : 'Copy URL',
        ctx_source:      isFrench ? 'Voir le Code Source' : 'View Source Code'
    };

    // --- 1. Inject UI Elements if missing ---
    if (!document.getElementById('redirectOverlay')) {
        const modalHTML = `
            <div id="redirectOverlay" class="redirect-overlay">
                <div class="redirect-box">
                    <div class="redirect-icon">⚠️</div>
                    <h2 data-key="redirect_title">${t.redirect_title}</h2>
                    <p class="modal-desc" data-key="redirect_text">${t.redirect_text}</p>
                    <p id="redirectUrl" class="redirect-url">...</p>
                    <div class="redirect-buttons">
                        <button id="btnCancelRedirect" data-key="btn_cancel">${t.btn_cancel}</button>
                        <button id="btnConfirmRedirect" data-key="btn_continue">${t.btn_continue}</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    if (!document.getElementById('tooltip')) {
        document.body.insertAdjacentHTML('beforeend', `<div class="tooltip" id="tooltip" data-key="tooltip">${t.tooltip}</div>`);
    }

    // --- 2. Create Context Menu ---
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'custom-context-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
        <ul class="ctx-menu-list">
            <li class="ctx-item" id="ctx-home"><span class="ctx-icon">🏠</span> <span data-key="ctx_home">${t.ctx_home}</span></li>
            <li class="ctx-item" id="ctx-music"><span class="ctx-icon">⏯️</span> <span data-key="ctx_music">${t.ctx_music}</span></li>
            <div class="ctx-separator"></div>
            <li class="ctx-item" id="ctx-copy"><span class="ctx-icon">📋</span> <span data-key="ctx_copy">${t.ctx_copy}</span></li>
            <li class="ctx-item" id="ctx-source"><span class="ctx-icon">💻</span> <span data-key="ctx_source">${t.ctx_source}</span></li>
        </ul>
    `;
    document.body.appendChild(menu);

    // --- 3. Actions ---
    document.getElementById('ctx-home').addEventListener('click', () => {
        window.location.href = './';
    });

    document.getElementById('ctx-music').addEventListener('click', () => {
        if (window.toggleGlobalMusic) {
            window.toggleGlobalMusic();
        }
    });

    document.getElementById('ctx-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.classList.add('show');
                setTimeout(() => tooltip.classList.remove('show'), 2000);
            }
        });
    });

    document.getElementById('ctx-source').addEventListener('click', () => {
        const url = 'https://github.com/StealthyLabsHQ';
        const overlay = document.getElementById('redirectOverlay');
        const urlDisplay = document.getElementById('redirectUrl');
        const confirmBtn = document.getElementById('btnConfirmRedirect');
        const cancelBtn = document.getElementById('btnCancelRedirect');

        const closeCtxModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 400); // 400ms buffer for 300ms transition
        };

        if (overlay && urlDisplay && confirmBtn) {
            urlDisplay.textContent = url;

            // Force flex display before adding show class for animation
            overlay.style.display = 'flex';
            // Force Reflow
            void overlay.offsetWidth;
            overlay.classList.add('show');

            confirmBtn.onclick = () => {
                window.open(url, '_blank', 'noopener,noreferrer');
                closeCtxModal();
            };

            if (cancelBtn) cancelBtn.onclick = closeCtxModal;
            overlay.onclick = (e) => { if (e.target === overlay) closeCtxModal(); };
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    });

    // --- 4. Events (Open/Close + Visibility Logic) ---
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        // Check Logic
        const path = window.location.href.toLowerCase();
        const itemHome = document.getElementById('ctx-home');
        const itemMusic = document.getElementById('ctx-music');
        const separator = document.querySelector('.ctx-separator');

        // Reset
        if (itemHome) itemHome.style.display = 'flex';
        if (itemMusic) itemMusic.style.display = 'flex';
        if (separator) separator.style.display = 'block';

        // Filter Logic
        if (path.includes('index.html') || path.endsWith('/')) {
            // Index: Hide Home, Music, Separator
            if (itemHome) itemHome.style.display = 'none';
            if (itemMusic) itemMusic.style.display = 'none';
            if (separator) separator.style.display = 'none';
        }
        else if (path.includes('about') || path.includes('legal')) {
            // About/Legal: Hide Music
            if (itemMusic) itemMusic.style.display = 'none';
            // Home and Separator remain visible
        }

        // Positioning
        const menuWidth = 250; // Approximate width
        const menuHeight = menu.offsetHeight || 200; // Get actual height if possible

        let x = e.pageX;
        let y = e.pageY;

        // Check horizontal overflow (viewport)
        if (e.clientX + menuWidth > window.innerWidth) {
            x -= menuWidth;
        }

        // Check vertical overflow (viewport)
        if (e.clientY + menuHeight > window.innerHeight) {
            y -= menuHeight;
        }

        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    });

    document.addEventListener('click', () => menu.style.display = 'none');
    window.addEventListener('scroll', () => menu.style.display = 'none');
});
