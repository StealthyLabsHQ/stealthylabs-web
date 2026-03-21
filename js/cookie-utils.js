// Cookie Utilities — Secure preference storage
// Flags: Secure, SameSite=Strict, Path=/

const ALLOWED_FONTS = [
    "'Inter', sans-serif",
    "'Space Grotesk', 'Inter', sans-serif",
    "'Raleway', sans-serif",
    "'JetBrains Mono', monospace"
];

function isAllowedFont(font) {
    return ALLOWED_FONTS.includes(font);
}

function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(^| )' + escaped + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
}
