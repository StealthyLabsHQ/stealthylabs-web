// Shared Particle System using tsparticles
document.addEventListener('DOMContentLoaded', () => {
    initTsParticles();
});

function initTsParticles() {
    const particlesDiv = document.getElementById('tsparticles');
    if (!particlesDiv) return;

    // Check configuration (Dark/Light)
    const savedTheme = localStorage.getItem('userTheme');
    let isDarkMode = false;

    // Default to dark if no theme saved, or if system is dark
    if (savedTheme === 'dark') {
        isDarkMode = true;
    } else if (savedTheme === 'system' || !savedTheme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            isDarkMode = true;
        } else {
            // Default fallback is dark for this site, unless system is explicitly light?
            // Actually site seems to default to dark.
            isDarkMode = true;
        }
        // If system is explicitly light -> isDarkMode = false.
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            if (savedTheme === 'system') isDarkMode = false;
        }
    } else if (savedTheme === 'light') {
        isDarkMode = false;
    }

    // Load tsparticles
    tsParticles.load("tsparticles", {
        fullScreen: { enable: false },
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        interactivity: {
            events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: true, mode: "repulse" },
                resize: true,
            },
            modes: {
                push: { quantity: 4 },
                repulse: { distance: 100, duration: 0.4 },
            },
        },
        particles: {
            color: { value: "#ffffff" },
            links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
            },
            move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                random: false,
                straight: false,
                outModes: "bounce",
            },
            number: {
                density: { enable: true, area: 800 },
                value: 80,
            },
            opacity: { value: 0.3 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
    }).then(container => {
        if (!isDarkMode && container) {
            container.pause();
            particlesDiv.style.display = 'none';
        } else if (isDarkMode && container) {
            particlesDiv.style.display = 'block';
            // container.play() is default
        }
    });

    // Listen for custom theme change events if any, or just poll/hook?
    // Since changeTheme is in index.js or network.js, we might not have a global event.
    // We can rely on a shared function or add an event listener if we emit one.
    // For now, let's expose a global function that the other scripts can call.
    window.updateGlobalParticles = function (theme) {
        const container = tsParticles.domItem(0);
        const div = document.getElementById('tsparticles');
        if (!container || !div) return;

        let isDark = false;
        if (theme === 'dark') isDark = true;
        else if (theme === 'light') isDark = false;
        else if (theme === 'system') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDark = true;
        }

        if (isDark) {
            div.style.display = 'block';
            container.play();
        } else {
            container.pause();
            div.style.display = 'none';
        }
    };
}
