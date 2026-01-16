const fs = require('fs');
const path = require('path');

const musicDir = './music'; // Dossier à scanner
const outputFile = './json/playlist.json'; // Fichier de sortie

// Vérifie si le dossier musique existe
if (!fs.existsSync(musicDir)) {
    console.error(`❌ Erreur : Le dossier '${musicDir}' n'existe pas.`);
    process.exit(1);
}

// Lit le contenu du dossier
fs.readdir(musicDir, (err, files) => {
    if (err) {
        console.error("❌ Erreur de lecture du dossier :", err);
        return;
    }

    // Filtre uniquement les fichiers MP3
    const mp3Files = files.filter(file => path.extname(file).toLowerCase() === '.mp3');

    if (mp3Files.length === 0) {
        console.warn("⚠️ Aucun fichier MP3 trouvé.");
        return;
    }

    const playlist = mp3Files.map(file => {
        const basename = path.basename(file, '.mp3');
        const parts = basename.split(' - ');

        let artist = "Unknown Artist";
        let title = basename;

        // Si le fichier respecte le format "Artiste - Titre"
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim(); // Au cas où il y aurait d'autres tirets dans le titre
        }

        return {
            title: title,
            artist: artist,
            file: `music/${file}`,
            cover: "" // Champ vide comme demandé
        };
    });

    // Écrit le résultat dans playlist.json
    fs.writeFile(outputFile, JSON.stringify(playlist, null, 4), (err) => {
        if (err) {
            console.error("❌ Erreur d'écriture du fichier JSON :", err);
        } else {
            console.log(`✅ Playlist mise à jour avec succès ! (${playlist.length} titres ajoutés)`);
            console.log(`📁 Fichier : ${outputFile}`);
        }
    });
});
