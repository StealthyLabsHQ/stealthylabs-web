const fs = require('fs');
const path = require('path');

// Try to require music-metadata
let mm;
try {
    mm = require('music-metadata');
} catch (e) {
    console.error("❌ La librairie 'music-metadata' n'est pas installée.");
    console.error("👉 Veuillez lancer la commande : npm install music-metadata");
    process.exit(1);
}

const musicDir = './music';
const coversDir = './music/covers';
const outputFile = './json/playlist.json';

// Ensure directories exist
if (!fs.existsSync(musicDir)) {
    console.error(`❌ Erreur : Le dossier '${musicDir}' n'existe pas.`);
    process.exit(1);
}

if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
    console.log(`📁 Dossier créé : ${coversDir}`);
}

async function generatePlaylist() {
    try {
        const files = fs.readdirSync(musicDir);
        const audioFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.mp3' || ext === '.flac';
        });

        if (audioFiles.length === 0) {
            console.warn("⚠️ Aucun fichier audio (MP3/FLAC) trouvé.");
            return;
        }

        console.log(`🎵 Traitement de ${audioFiles.length} fichiers...`);

        const playlist = [];

        for (const file of audioFiles) {
            const filePath = path.join(musicDir, file);
            const ext = path.extname(file).toLowerCase();
            const basename = path.basename(file, ext);

            let title = basename;
            let artist = "Unknown Artist";
            let coverPath = ""; // Default empty

            try {
                // Read metadata
                const metadata = await mm.parseFile(filePath);

                // Get common tags if available
                if (metadata.common.title) title = metadata.common.title;
                if (metadata.common.artist) artist = metadata.common.artist;

                // Handle Cover Art
                if (metadata.common.picture && metadata.common.picture.length > 0) {
                    const picture = metadata.common.picture[0];
                    const extension = picture.format.split('/')[1] || 'jpg';
                    const coverFilename = `${basename}.${extension}`;
                    const coverAbsolutePath = path.join(coversDir, coverFilename);

                    // Write the image file
                    fs.writeFileSync(coverAbsolutePath, picture.data);

                    // Path relative to index.html (assuming web root)
                    coverPath = `music/covers/${coverFilename}`;
                }

            } catch (error) {
                console.warn(`⚠️ Impossible de lire les métadonnées pour '${file}'. Utilisation du nom de fichier.`);
                // Fallback logic for title/artist from filename if metadata fails entirely
                const parts = basename.split(' - ');
                if (parts.length >= 2) {
                    artist = parts[0].trim();
                    title = parts.slice(1).join(' - ').trim();
                }
            }

            // Fallback logic if metadata was read but empty title/artist
            if (title === basename || artist === "Unknown Artist") {
                const parts = basename.split(' - ');
                if (parts.length >= 2) {
                    if (artist === "Unknown Artist") artist = parts[0].trim();
                    if (title === basename) title = parts.slice(1).join(' - ').trim();
                }
            }

            playlist.push({
                title: title,
                artist: artist,
                file: `music/${file}`,
                cover: coverPath
            });
        }

        fs.writeFileSync(outputFile, JSON.stringify(playlist, null, 4));
        console.log(`✅ Playlist mise à jour avec succès ! (${playlist.length} titres ajoutés)`);
        console.log(`📁 Fichier : ${outputFile}`);

    } catch (err) {
        console.error("❌ Une erreur est survenue :", err);
    }
}

generatePlaylist();
