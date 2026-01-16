// Shared Settings Panel Logic - Robust Closing
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settingsPanel');

        if (panel && panel.classList.contains('show')) {
            if (panel.contains(e.target)) {
                return;
            }

            const toggleBtn = e.target.closest('button[onclick*="toggleSettings"]') ||
                e.target.closest('#settingsBtn') ||
                e.target.closest('.settings-btn');

            if (toggleBtn) {
                return;
            }

            panel.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('settingsPanel');
            if (panel && panel.classList.contains('show')) {
                panel.classList.remove('show');
            }
        }
    });
});
