
const fs = require('fs');

function readRawFile() {
    const raw = fs.readFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\temp_data.js');

    // Check for UTF-16LE BOM
    if (raw[0] === 0xFF && raw[1] === 0xFE) {
        return raw.toString('utf16le');
    }

    // Check for UTF-8 BOM
    let content = raw.toString('utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.substring(1);
    }

    return content;
}

const content = readRawFile();
const results = [];
const regex = /name:\s*'([^']+)'[\s\S]*?price:\s*'([^']+)'(?:[\s\S]*?oldPrice:\s*'([^']+)')?/g;

let match;
while ((match = regex.exec(content)) !== null) {
    results.push({
        name: match[1],
        price: match[2],
        oldPrice: match[3] || null
    });
}

// Write as clean UTF-8
fs.writeFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\prices_map_final.json', JSON.stringify(results, null, 2), 'utf8');
console.log(`Successfully extracted ${results.length} products to prices_map_final.json`);
