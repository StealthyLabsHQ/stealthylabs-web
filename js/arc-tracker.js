const blueprintsData = [
    // Row 1
    { id: "bettina", name: "Bettina", name_fr: "Bettina", type: "weapon" },
    { id: "blue_light_stick", name: "Blue Light Stick", name_fr: "Bâton lumineux bleu", type: "gadget" },
    { id: "aphelion", name: "Aphelion", name_fr: "Aphelion", type: "weapon" },
    { id: "combat_mk3_flanking", name: "Combat Mk. 3 (Flanking)", name_fr: "Combat 3 (Contournement)", type: "consumable" },
    { id: "combat_mk3_aggressive", name: "Combat Mk. 3 (Aggressive)", name_fr: "Combat 3 (Agression)", type: "consumable" },
    { id: "complex_gun_parts", name: "Complex Gun Parts", name_fr: "Pièce d'armes complexes", type: "material" },
    { id: "fireworks_box", name: "Fireworks Box", name_fr: "Boîte de feux d'artifice", type: "gadget" },
    { id: "gas_mine", name: "Gas Mine", name_fr: "Mine toxique", type: "gadget" },
    { id: "green_light_stick", name: "Green Light Stick", name_fr: "Bâton lumineux vert", type: "gadget" },
    { id: "pulse_mine", name: "Pulse Mine", name_fr: "Mine à impulsion", type: "gadget" },
    // Row 2
    { id: "seeker_grenade", name: "Seeker Grenade", name_fr: "Schéma de grenade traqueuse", type: "gadget" },
    { id: "looting_mk3_survivor", name: "Looting Mk. 3 (Survivor)", name_fr: "Butin 3 (Survie)", type: "consumable" },
    { id: "angled_grip_ii", name: "Angled Grip II", name_fr: "Poignée coudée II", type: "attachment" },
    { id: "angled_grip_iii", name: "Angled Grip III", name_fr: "Poignée coudée III", type: "attachment" },
    { id: "hullcracker", name: "Hullcracker", name_fr: "Brise-fuselage", type: "weapon" },
    { id: "anvil", name: "Anvil", name_fr: "Enclume", type: "weapon" },

    { id: "barricade_kit", name: "Barricade Kit", name_fr: "Kit de barricade", type: "gadget" },
    { id: "blaze_grenade", name: "Blaze Grenade", name_fr: "Grenade flamboyante", type: "gadget" },
    // Row 3
    { id: "bobcat", name: "Bobcat", name_fr: "Lynx", type: "weapon" },
    { id: "osprey", name: "Osprey", name_fr: "Balbuzard", type: "weapon" },
    { id: "burletta", name: "Burletta", name_fr: "Burletta", type: "weapon" },
    { id: "compensator_ii", name: "Compensator II", name_fr: "Compensateur II", type: "attachment" },
    { id: "compensator_iii", name: "Compensator III", name_fr: "Compensateur III", type: "attachment" },
    { id: "defibrillator", name: "Defibrillator", name_fr: "Défibrillateur", type: "gadget" },

    { id: "equalizer", name: "Equalizer", name_fr: "Égaliseur", type: "weapon" },
    { id: "extended_barrel", name: "Extended Barrel", name_fr: "Canon allongé", type: "attachment" },
    { id: "extended_light_magazine_ii", name: "Extended Light Magazine II", name_fr: "Chargeur léger étendu II", type: "attachment" },
    // Row 4
    { id: "extended_light_magazine_iii", name: "Extended Light Magazine III", name_fr: "Chargeur léger étendu III", type: "attachment" },
    { id: "extended_medium_magazine_ii", name: "Extended Medium Magazine II", name_fr: "Chargeur moyen étendu II", type: "attachment" },
    { id: "extended_medium_magazine_iii", name: "Extended Medium Magazine III", name_fr: "Chargeur moyen étendu III", type: "attachment" },
    { id: "extended_shotgun_magazine_ii", name: "Extended Shotgun Magazine II", name_fr: "Chargeur de fusil à pompe étendu II", type: "attachment" },
    { id: "extended_shotgun_magazine_iii", name: "Extended Shotgun Magazine III", name_fr: "Chargeur de fusil à pompe étendu III", type: "attachment" },
    { id: "remote_raider_flare", name: "Remote Raider Flare", name_fr: "Fusée éclairante télécommandée", type: "gadget" },
    { id: "heavy_gun_parts", name: "Heavy Gun Parts", name_fr: "Pièces d'arme lourdes", type: "material" },
    { id: "venator", name: "Venator", name_fr: "Venator", type: "weapon" },
    { id: "il_toro", name: "Il Toro", name_fr: "Il Toro", type: "weapon" },
    { id: "jolt_mine", name: "Jolt Mine", name_fr: "Mine étourdissante", type: "gadget" },
    // Row 5    
    { id: "explosive_mine", name: "Explosive Mine", name_fr: "Mine explosive", type: "gadget" },
    { id: "jupiter", name: "Jupiter", name_fr: "Jupiter", type: "weapon" },
    { id: "light_gun_parts", name: "Light Gun Parts", name_fr: "Pièces d'arme légères", type: "material" },
    { id: "lightweight_stock", name: "Lightweight Stock", name_fr: "Crosse légère", type: "attachment" },
    { id: "looting_mk3_safekeeper", name: "Looting Mk. 3 (Safekeeper)", name_fr: "Butin 3 (préservation)", type: "consumable" },
    { id: "lure_grenade", name: "Lure Grenade", name_fr: "Grenade leurre", type: "gadget" },
    { id: "medium_gun_parts", name: "Medium Gun Parts", name_fr: "Pièces d'arme moyenne", type: "material" },
    { id: "torrente", name: "Torrente", name_fr: "Torrente", type: "weapon" },
    { id: "muzzle_brake_ii", name: "Muzzle Brake II", name_fr: "Frein de bouche II", type: "attachment" },
    { id: "muzzle_brake_iii", name: "Muzzle Brake III", name_fr: "Frein de bouche III", type: "attachment" },
    // Row 6
    { id: "padded_stock", name: "Padded Stock", name_fr: "Crosse rembourrée", type: "attachment" },
    { id: "shotgun_choke_ii", name: "Shotgun Choke II", name_fr: "Étrangleur de fusil à pompe II", type: "attachment" },
    { id: "shotgun_choke_iii", name: "Shotgun Choke III", name_fr: "Étrangleur de fusil à pompe III", type: "attachment" },
    { id: "shotgun_silencer", name: "Shotgun Silencer", name_fr: "Silencieux de fusil à pompe", type: "attachment" },
    { id: "showstopper", name: "Showstopper", name_fr: "Soufflante", type: "weapon" },
    { id: "silencer_i", name: "Silencer I", name_fr: "Silencieux I", type: "attachment" },
    { id: "silencer_ii", name: "Silencer II", name_fr: "Silencieux II", type: "attachment" },
    { id: "snap_hook", name: "Snap Hook", name_fr: "Mousqueton", type: "gadget" },
    { id: "stable_stock_ii", name: "Stable Stock II", name_fr: "Crosse stable II", type: "attachment" },
    { id: "stable_stock_iii", name: "Stable Stock III", name_fr: "Crosse stable III", type: "attachment" },
    // Row 7
    { id: "tagging_grenade", name: "Tagging Grenade", name_fr: "Grenade de marquage", type: "gadget" },
    { id: "tempest", name: "Tempest", name_fr: "Tempête", type: "weapon" },
    { id: "trigger_nade", name: "Trigger 'Nade", name_fr: "Grenade télécommandée", type: "gadget" },
    { id: "vertical_grip_ii", name: "Vertical Grip II", name_fr: "Poignée verticale II", type: "attachment" },
    { id: "vertical_grip_iii", name: "Vertical Grip III", name_fr: "Poignée verticale III", type: "attachment" },
    { id: "vita_shot", name: "Vita Shot", name_fr: "Dose de vita", type: "consumable" },
    { id: "vita_spray", name: "Vita Spray", name_fr: "Spray de vita", type: "consumable" },
    { id: "vulcano", name: "Vulcano", name_fr: "Vulcano", type: "weapon" },
    { id: "wolfpack", name: "Wolfpack", name_fr: "Meute", type: "gadget" },
    { id: "red_light_stick", name: "Red Light Stick", name_fr: "Bâton lumineux rouge", type: "gadget" },
    // Row 8
    { id: "smoke_grenade", name: "Smoke Grenade", name_fr: "Grenade fumigène", type: "gadget" },
    { id: "tactical_mk3_revival", name: "Tactical Mk. 3 (Revival)", name_fr: "Tactique 3 (Renaissance)", type: "consumable" },
    { id: "deadline", name: "Deadline", name_fr: "Mine à retardement", type: "gadget" },
    { id: "trailblazer", name: "Trailblazer", name_fr: "Brûleuse", type: "weapon" },
    { id: "tactical_mk3_defensive", name: "Tactical Mk. 3 (Defensive)", name_fr: "Tactique 3 (Défense)", type: "consumable" },
    { id: "tactical_mk3_healing", name: "Tactical Mk. 3 (Healing)", name_fr: "Tactique 3 (Soins)", type: "consumable" },
    { id: "yellow_light_stick", name: "Yellow Light Stick", name_fr: "Bâton lumineux jaune", type: "gadget" }
];

function getSlug(name) {
    return name.toLowerCase()
        .replace(/mk\. \d/g, match => match.replace('. ', '')) // Handle "Mk. 3" -> "mk3"
        .replace(/\./g, '') // Remove remaining dots
        .replace(/\(/g, '') // Remove parentheses
        .replace(/\)/g, '')
        .replace(/'/g, '') // Remove apostrophes
        .trim()
        .replace(/[^a-z0-9]+/g, '-'); // Replace spaces/symbols with hyphen
}

// Load owned status from cookie - using IDs (with corruption protection)
let ownedBlueprints = [];
try {
    const raw = getCookie('arc_owned_blueprints_ids');
    ownedBlueprints = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ownedBlueprints)) ownedBlueprints = [];
} catch (e) {
    console.warn('Corrupted blueprint data in cookie, resetting.');
    ownedBlueprints = [];
    deleteCookie('arc_owned_blueprints_ids');
}

document.addEventListener('DOMContentLoaded', () => {
    initTracker();

    const selectAllBtn = document.querySelector('[data-action="select-all"]');
    const deselectAllBtn = document.querySelector('[data-action="deselect-all"]');
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAll);
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAll);
});

function initTracker() {
    const grid = document.getElementById('blueprints-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Determine current language
    const isFrench = document.documentElement.lang === 'fr' || window.location.pathname.includes('/fr/');

    blueprintsData.forEach(item => {
        const card = document.createElement('div');

        if (item.type === 'gap') {
            card.className = 'blueprint-card gap';
            grid.appendChild(card);
            return;
        }

        // Use ID for checking ownership
        const isOwned = ownedBlueprints.includes(item.id);

        // Slug generation still works for images
        const slug = getSlug(item.name);
        // Note: In a localized environment, item.name would be the translated name.
        // However, the images are file-based and likely english-named.
        // Ideally we would use item.id or a fixed identifier for images too.
        // For now, assuming image filenames match the English slug generated from item.name (or ID).
        // BETTER: Use item.id for image path if possible, but IDs use underscores/snake_case and slugs use hyphens.
        // Let's stick to getSlug BUT use a new property 'imgName' if we translate names?
        // OR: Use English names in the data structure for image generation, and translate display names only.

        // CURRENT FIX: We are editing the JS file which is SHARED. 
        // If we translate 'name' in this file for French, it will break English page.
        // So we need to keep 'name' as English (for ID/Slug generation) and add a 'name_fr' property etc?
        // The user copied the page index.html to FR. The script arc-tracker.js is shared.
        // So this script runs on both pages. 
        // We need a way to display the translated name if on FR page.

        // Let's assume for now the names in this array are ENGLISH default.
        // We can add a simple translation dictionary or logic here.

        const imgPath = `../../../../img/blueprint/${slug}.png`;

        card.className = `blueprint-card ${isOwned ? 'owned' : ''}`;
        card.dataset.id = item.id;
        card.onclick = () => toggleBlueprint(item.id, card);

        // Simple localization for display name
        let displayName = (isFrench && item.name_fr) ? item.name_fr : item.name;
        // In a real app we'd pull from a translation file. 
        // For this quick fix, we'll leave display name as English in the JS and assume user accepts English names 
        // OR we'd need to inject translations. 
        // Given the requirement is SYNC, the priority is the ID based storage.

        // If we want to support translated names in the future, we should add them to the object above.

        card.innerHTML = `
            <div class="blueprint-icon">
                <img src="${imgPath}" alt="${displayName}" loading="lazy" onerror="this.src='../../../../img/blueprint/unknown.png'">
            </div>
            <div class="blueprint-name">${displayName}</div>
            <div class="blueprint-check"><i class="fas fa-check-circle"></i></div>
        `;

        grid.appendChild(card);
    });

    updateProgress();
}

function toggleBlueprint(id, cardElement) {
    const index = ownedBlueprints.indexOf(id);

    if (index === -1) {
        // Not owned, add it
        ownedBlueprints.push(id);
        cardElement.classList.add('owned');
    } else {
        // Owned, remove it
        ownedBlueprints.splice(index, 1);
        cardElement.classList.remove('owned');
    }

    // Save to cookie using ID based key
    setCookie('arc_owned_blueprints_ids', JSON.stringify(ownedBlueprints));

    updateProgress();
}

function selectAll() {
    // Add all IDs to ownedBlueprints if not already present
    blueprintsData.forEach(item => {
        if (item.type !== 'gap' && !ownedBlueprints.includes(item.id)) {
            ownedBlueprints.push(item.id);
        }
    });

    // Update UI
    const cards = document.querySelectorAll('.blueprint-card:not(.gap)');
    cards.forEach(card => card.classList.add('owned'));

    // Save and update progress
    setCookie('arc_owned_blueprints_ids', JSON.stringify(ownedBlueprints));
    updateProgress();
}

function deselectAll() {
    // Clear owned blueprints
    ownedBlueprints = [];

    // Update UI
    const cards = document.querySelectorAll('.blueprint-card');
    cards.forEach(card => card.classList.remove('owned'));

    // Save and update progress
    setCookie('arc_owned_blueprints_ids', JSON.stringify(ownedBlueprints));
    updateProgress();
}

// Expose to window for button onclick
window.selectAll = selectAll;
window.deselectAll = deselectAll;

function updateProgress() {
    const total = blueprintsData.filter(i => i.type !== 'gap').length;
    const owned = ownedBlueprints.length;
    const progressText = document.getElementById('collection-progress');

    if (progressText) {
        progressText.textContent = `${owned} / ${total}`;
    }
}
