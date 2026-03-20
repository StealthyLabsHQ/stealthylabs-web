// Contact Form - Cloudflare Worker AJAX Handler
// Hardened client-side checks. Server-side validation/rate limiting is still required.

const CONTACT_SUBMIT_COOLDOWN_MS = 30000;
const CONTACT_REQUEST_TIMEOUT_MS = 10000;
const CONTACT_LAST_SUBMIT_KEY = 'contactLastSubmitAt';

function detectContactLanguage() {
    const path = window.location.pathname;
    return path.includes('/fr/') ? 'fr' : 'en';
}

function changeLanguage(lang) {
    const safeLang = (lang === 'fr' || lang === 'en') ? lang : null;
    if (!safeLang) return;
    setCookie('userLang', safeLang);
    const path = window.location.pathname;
    let newUrl = window.location.href;
    if (path.includes('/en/') && safeLang === 'fr') newUrl = newUrl.replace('/en/', '/fr/');
    if (path.includes('/fr/') && safeLang === 'en') newUrl = newUrl.replace('/fr/', '/en/');
    if (newUrl !== window.location.href) window.location.href = newUrl;
}

function changeFont(value) {
    if (!isAllowedFont(value)) return;
    document.body.style.fontFamily = value;
    setCookie('userFont', value);
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function updateClock() {
    const el = document.getElementById('clockDisplay');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function i18n(lang, key) {
    const text = {
        fr: {
            success: 'Message envoye. Je repondrai des que possible.',
            genericError: 'Une erreur est survenue. Reessayez plus tard.',
            cooldown: 'Veuillez patienter quelques secondes avant un nouvel envoi.',
            nameRequired: 'Le nom est requis.',
            nameInvalid: 'Le nom doit contenir entre 2 et 100 caracteres.',
            emailInvalid: 'Veuillez entrer une adresse email valide.',
            subjectInvalid: 'Le sujet ne peut pas depasser 150 caracteres.',
            messageInvalid: 'Message invalide (10 a 2000 caracteres).',
            approvalRequired: 'Vous devez accepter la politique de confidentialite.',
        },
        en: {
            success: 'Message sent. I will get back to you as soon as possible.',
            genericError: 'An error occurred. Please try again later.',
            cooldown: 'Please wait a few seconds before sending another message.',
            nameRequired: 'Name is required.',
            nameInvalid: 'Name must be between 2 and 100 characters.',
            emailInvalid: 'Please enter a valid email address.',
            subjectInvalid: 'Subject must not exceed 150 characters.',
            messageInvalid: 'Invalid message (10 to 2000 characters).',
            approvalRequired: 'You must accept the privacy policy.',
        },
    };
    return text[lang]?.[key] || text.en[key];
}

function normalizeSingleLine(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMessage(value) {
    return (value || '').replace(/\r\n/g, '\n').trim();
}

function markError(input, message) {
    if (!input) return;
    input.classList.remove('valid');
    input.classList.add('invalid');
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    const errEl = group.querySelector('.error-message');
    if (errEl) errEl.textContent = message;
}

function markValid(input) {
    if (!input) return;
    input.classList.remove('invalid');
    input.classList.add('valid');
    const group = input.closest('.form-group');
    if (group) group.classList.remove('has-error');
}

function setApprovalError(message) {
    const approvalWrapper = document.getElementById('approvalWrapper');
    const approvalGroup = document.getElementById('approvalGroup');
    const approvalError = document.getElementById('approvalError');
    if (approvalWrapper) approvalWrapper.classList.add('has-error');
    if (approvalGroup) approvalGroup.classList.add('invalid');
    if (approvalError) approvalError.textContent = message;
}

function clearApprovalError() {
    const approvalWrapper = document.getElementById('approvalWrapper');
    const approvalGroup = document.getElementById('approvalGroup');
    const approvalError = document.getElementById('approvalError');
    if (approvalWrapper) approvalWrapper.classList.remove('has-error');
    if (approvalGroup) approvalGroup.classList.remove('invalid');
    if (approvalError) approvalError.textContent = '';
}

function clearValidation() {
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach((el) => {
        el.classList.remove('valid', 'invalid');
    });
    document.querySelectorAll('.form-group').forEach((group) => group.classList.remove('has-error'));
    clearApprovalError();
}

function getLastSubmitAt() {
    return Number(getCookie(CONTACT_LAST_SUBMIT_KEY) || '0');
}

function setLastSubmitAt(ts) {
    setCookie(CONTACT_LAST_SUBMIT_KEY, String(ts), 1);
}

function isCoolingDown() {
    const elapsed = Date.now() - getLastSubmitAt();
    return elapsed >= 0 && elapsed < CONTACT_SUBMIT_COOLDOWN_MS;
}

function validateForm(values, lang) {
    let valid = true;

    const nameEl = document.getElementById('fieldName');
    const emailEl = document.getElementById('fieldEmail');
    const subjectEl = document.getElementById('fieldSubject');
    const messageEl = document.getElementById('fieldMessage');

    const name = normalizeSingleLine(values.name);
    const email = normalizeSingleLine(values.email);
    const subject = normalizeSingleLine(values.subject);
    const message = normalizeMessage(values.message);

    if (!name) {
        markError(nameEl, i18n(lang, 'nameRequired'));
        valid = false;
    } else if (name.length < 2 || name.length > 100) {
        markError(nameEl, i18n(lang, 'nameInvalid'));
        valid = false;
    } else {
        markValid(nameEl);
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 200) {
        markError(emailEl, i18n(lang, 'emailInvalid'));
        valid = false;
    } else {
        markValid(emailEl);
    }

    if (subject.length > 150) {
        markError(subjectEl, i18n(lang, 'subjectInvalid'));
        valid = false;
    } else {
        markValid(subjectEl);
    }

    if (message.length < 10 || message.length > 2000) {
        markError(messageEl, i18n(lang, 'messageInvalid'));
        valid = false;
    } else {
        markValid(messageEl);
    }

    if (!values.approval) {
        setApprovalError(i18n(lang, 'approvalRequired'));
        valid = false;
    } else {
        clearApprovalError();
    }

    return {
        valid,
        cleaned: {
            name,
            email,
            subject,
            message,
        },
    };
}

function showStatus(kind, message) {
    const status = document.getElementById('formStatus');
    const statusMsg = document.getElementById('statusMessage');
    if (!status || !statusMsg) return;
    status.classList.remove('show', 'success', 'error');
    status.classList.add('show', kind);
    statusMsg.textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);

    const lang = detectContactLanguage();
    const langSel = document.getElementById('languageSelector');
    if (langSel) langSel.value = lang;

    const savedFont = getCookie('userFont');
    if (savedFont) {
        document.body.style.fontFamily = savedFont;
        const fontSel = document.getElementById('fontSelector');
        if (fontSel) fontSel.value = savedFont;
    }

    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');

    document.querySelectorAll('.form-input, .form-textarea').forEach((input) => {
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
            const group = input.closest('.form-group');
            if (group) group.classList.remove('has-error');
        });
    });

    const approvalInput = document.getElementById('fieldApproval');
    if (approvalInput) {
        approvalInput.addEventListener('change', () => clearApprovalError());
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearValidation();

        if (isCoolingDown()) {
            showStatus('error', i18n(lang, 'cooldown'));
            return;
        }

        const values = {
            name: document.getElementById('fieldName')?.value || '',
            email: document.getElementById('fieldEmail')?.value || '',
            subject: document.getElementById('fieldSubject')?.value || '',
            message: document.getElementById('fieldMessage')?.value || '',
            approval: Boolean(document.getElementById('fieldApproval')?.checked),
            honeypot: document.querySelector('input[name="_gotcha"]')?.value || '',
        };

        if (values.honeypot) {
            form.reset();
            showStatus('success', i18n(lang, 'success'));
            return;
        }

        const validation = validateForm(values, lang);
        if (!validation.valid) return;

        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONTACT_REQUEST_TIMEOUT_MS);

        try {
            const payload = {
                ...validation.cleaned,
                lang,
                approval: values.approval,
                _gotcha: values.honeypot,
                sentAt: new Date().toISOString(),
            };

            const response = await fetch(form.action, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            let body = {};
            try {
                body = await response.json();
            } catch (_err) {
                body = {};
            }

            if (!response.ok) {
                const errorMessage = typeof body.error === 'string' ? body.error : `Request failed (${response.status})`;
                throw new Error(errorMessage);
            }

            form.reset();
            setLastSubmitAt(Date.now());
            showStatus('success', i18n(lang, 'success'));
        } catch (_err) {
            showStatus('error', i18n(lang, 'genericError'));
        } finally {
            clearTimeout(timeoutId);
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    });
});
