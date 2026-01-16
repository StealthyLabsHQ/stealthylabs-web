// Shared Particle System using tsparticles
const particleConfig = {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
        events: {
            onClick: { enable: false, mode: "push" },
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
            opacity: 0.2, // White links for dark mode only
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
    responsive: [
        {
            maxWidth: 768,
            options: {
                particles: {
                    number: { value: 30 },
                    links: { distance: 100 }
                }
            }
        }
    ]
};

// Expose global updater immediately
window.updateGlobalParticles = function (theme) {
    const div = document.getElementById('tsparticles');
    const oldContainer = tsParticles.domItem(0);

    let isDarkTheme = false;
    if (theme === 'dark') isDarkTheme = true;
    else if (theme === 'light') isDarkTheme = false;
    else if (theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDarkTheme = true;
        else isDarkTheme = false;
    }

    if (isDarkTheme) {
        // Dark Mode: Ensure Visible and Loaded
        if (div) {
            div.style.display = 'block';
            div.style.opacity = '1';
            div.style.visibility = 'visible';
        }
        // Load if not already loaded
        if (!oldContainer) {
            tsParticles.load("tsparticles", particleConfig);
        }
    } else {
        // Light Mode: Hide and Destroy
        if (div) {
            div.style.display = 'none';
            div.style.opacity = '0';
            div.style.visibility = 'hidden';
        }
        if (oldContainer) {
            oldContainer.destroy();
        }
    }
};

// Alias for compatibility
window.updateParticlesTheme = function (isDark) {
    const theme = isDark ? 'dark' : 'light';
    window.updateGlobalParticles(theme);
};

document.addEventListener('DOMContentLoaded', () => {
    initTsParticles();
});

function initTsParticles() {
    let isDark = true;
    const savedTheme = localStorage.getItem('userTheme');

    if (savedTheme === 'light') {
        isDark = false;
    } else if (savedTheme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            isDark = false;
        }
    }

    // Pass initial state to the global updater logic
    window.updateParticlesTheme(isDark);
}
