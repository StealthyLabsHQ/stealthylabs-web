/**
 * UX Enhancements for StealthyLabs
 * Includes: Scroll reveal, Toast notifications, Loading states
 */

// ========== Toast Notification System ==========
class ToastManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        const closeToast = () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', closeToast);

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(closeToast, duration);
        }

        return toast;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Global toast instance
const toast = new ToastManager();

// ========== Scroll Reveal Animation ==========
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.scroll-reveal');
        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: show all elements immediately
            this.elements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        this.elements.forEach(el => {
            this.observer.observe(el);
        });
    }
}

// ========== Smooth Scroll to Anchor ==========
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========== Loading State Helper ==========
function showLoading(element, text = 'Loading...') {
    if (!element) return;

    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.disabled = true;
    element.innerHTML = `<span class="loading-spinner"></span> ${text}`;

    return () => {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// ========== Copy to Clipboard with Feedback ==========
function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(successMessage, 3000);
        }).catch(() => {
            toast.error('Failed to copy', 3000);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            toast.success(successMessage, 3000);
        } catch (err) {
            toast.error('Failed to copy', 3000);
        }
        document.body.removeChild(textArea);
    }
}

// ========== Progress Bar on Scroll ==========
function initProgressBar() {
    // Skip on pages with no scrollable content
    if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar-container';
    progressBar.innerHTML = '<div class="progress-bar-fill"></div>';
    document.body.appendChild(progressBar);

    const progressFill = progressBar.querySelector('.progress-bar-fill');
    let lastScrolled = -1;

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = Math.round((window.scrollY / windowHeight) * 100);
        if (scrolled !== lastScrolled) {
            lastScrolled = scrolled;
            progressFill.style.width = scrolled + '%';
        }
    }, { passive: true });
}

// ========== Ripple Effect Handler ==========
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.ripple, .cta-button, button');
        if (button && !button.disabled) {
            button.classList.add('ripple');
            setTimeout(() => button.classList.remove('ripple'), 600);
        }
    });
}

// ========== Initialize on DOM Ready ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scroll
    initSmoothScroll();

    // Progress bar disabled
    // initProgressBar();

    // Initialize ripple effect
    initRippleEffect();

    // Add scroll reveal classes to cards and sections
    const cards = document.querySelectorAll('.card, .tool-card, .game-card');
    cards.forEach((card, index) => {
        card.classList.add('scroll-reveal');
        if (index % 3 === 1) card.classList.add('scroll-reveal-delay-1');
        if (index % 3 === 2) card.classList.add('scroll-reveal-delay-2');
    });

    // Add scroll reveal to sections
    const sections = document.querySelectorAll('.hero, .tools-section, .community-section, .featured-game');
    sections.forEach(section => {
        section.classList.add('scroll-reveal');
    });

    // Initialize scroll reveal
    new ScrollReveal();

    // Add ripple class to buttons
    document.querySelectorAll('button, .cta-button, .community-cta').forEach(btn => {
        if (!btn.classList.contains('ripple')) {
            btn.classList.add('ripple');
        }
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { toast, ScrollReveal, copyToClipboard, showLoading };
}
