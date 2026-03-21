// games.js — Games page specific logic (tabs, bestiary, maps, search)
// Shared functions (language, theme, font, clock, etc.) are in core.js

// --- Search Bar ---

function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(this.value);
        }
    });
}

function performSearch(query) {
    if (!query || query.trim() === '') return;
    const searchUrl = `https://www.google.com/search?q=site:stealthylabs.eu+${encodeURIComponent(query.trim())}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
}

// --- Map Tabs ---

window.openMapTab = function (evt, mapName) {
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("map-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    tablinks = document.getElementsByClassName("map-tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    const activeContent = document.getElementById(mapName);
    if (activeContent) {
        activeContent.style.display = "block";
        activeContent.classList.add("active");
    }

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
};

// --- Bestiary Tabs ---

window.openBestiaryTab = function (evt, categoryName) {
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("bestiary-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    tablinks = document.getElementsByClassName("bestiary-tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    const activeContent = document.getElementById(categoryName);
    if (activeContent) {
        activeContent.style.display = "block";
        activeContent.classList.add("active");
    }

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    setupSearchBar();

    document.querySelectorAll('.map-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openMapTab(e, btn.dataset.tab));
    });
    document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openBestiaryTab(e, btn.dataset.tab));
    });
});
