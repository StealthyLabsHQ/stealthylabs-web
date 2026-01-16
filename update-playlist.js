const fs = require('fs');
const path = require('path');

const musicDir = './music';
const outputFile = './json/playlist.json';

if (!fs.existsSync(musicDir)) {
    console.error(`❌ Erreur : Le dossier '${musicDir}' n'existe pas.`);
    process.exit(1);
}

fs.readdir(musicDir, (err, files) => {
    if (err) {
        console.error("❌ Erreur de lecture du dossier :", err);
        return;
    }

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

        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
        }

        return {
            title: title,
            artist: artist,
            file: `music/${file}`,
            cover: ""
        };
    });

    fs.writeFile(outputFile, JSON.stringify(playlist, null, 4), (err) => {
        if (err) {
            console.error("❌ Erreur d'écriture du fichier JSON :", err);
        } else {
            console.log(`✅ Playlist mise à jour avec succès ! (${playlist.length} titres ajoutés)`);
            console.log(`📁 Fichier : ${outputFile}`);
        }
    });
});
