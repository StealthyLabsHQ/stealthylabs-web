const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const ASSET_DIRS = ['css', 'js'];
const HTML_EXTENSIONS = ['.html'];

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function findFiles(dir, extensions, results = []) {
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            findFiles(fullPath, extensions, results);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

function buildHashMap() {
    const hashMap = {};

    for (const dir of ASSET_DIRS) {
        const dirPath = path.join(ROOT, dir);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath).filter(f =>
            f.endsWith('.css') || f.endsWith('.js')
        );

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const hash = getFileHash(filePath);
            const key = `${dir}/${file}`;
            hashMap[key] = hash;
        }
    }

    return hashMap;
}

function updateHtmlFile(htmlPath, hashMap) {
    let content = fs.readFileSync(htmlPath, 'utf-8');
    let modified = false;
    const changes = [];

    for (const [assetKey, hash] of Object.entries(hashMap)) {
        const fileName = path.basename(assetKey);
        const escapedName = fileName.replace('.', '\\.');

        // Update existing ?v= parameters
        const updateRegex = new RegExp(
            `((?:(?:\\.\\.\\/)*|)(?:css|js)\\/${escapedName})\\?v=[a-zA-Z0-9]+`,
            'g'
        );

        content = content.replace(updateRegex, (match, prefix) => {
            const oldVersion = match.split('?v=')[1];
            if (oldVersion !== hash) {
                changes.push(`  ${fileName}: v=${oldVersion} -> v=${hash}`);
                modified = true;
            }
            return `${prefix}?v=${hash}`;
        });

        // Add ?v= to references that don't have one yet
        const addRegex = new RegExp(
            `((?:(?:\\.\\.\\/)*|)(?:css|js)\\/${escapedName})(?!\\?v=)(?=["'\\s>])`,
            'g'
        );

        content = content.replace(addRegex, (match, prefix) => {
            changes.push(`  ${fileName}: (none) -> v=${hash}`);
            modified = true;
            return `${prefix}?v=${hash}`;
        });
    }

    if (modified) {
        fs.writeFileSync(htmlPath, content, 'utf-8');
    }

    return changes;
}

function main() {
    console.log('=== Cache Bust - StealthyLabs ===\n');

    console.log('Building asset hash map...');
    const hashMap = buildHashMap();

    console.log('\nAsset hashes:');
    for (const [key, hash] of Object.entries(hashMap)) {
        console.log(`  ${key} -> ${hash}`);
    }

    console.log('\nScanning HTML files...');
    const htmlFiles = findFiles(ROOT, HTML_EXTENSIONS);
    console.log(`Found ${htmlFiles.length} HTML files\n`);

    let totalUpdated = 0;

    for (const htmlPath of htmlFiles) {
        const relativePath = path.relative(ROOT, htmlPath);
        const changes = updateHtmlFile(htmlPath, hashMap);
        if (changes.length > 0) {
            console.log(`Updated: ${relativePath}`);
            changes.forEach(c => console.log(c));
            totalUpdated++;
        }
    }

    if (totalUpdated === 0) {
        console.log('All files are already up to date.');
    } else {
        console.log(`\nDone! Updated ${totalUpdated} HTML file(s).`);
    }
}

main();
