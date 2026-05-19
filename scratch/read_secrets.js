const fs = require('fs');
try {
    const content = fs.readFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\secrets_list.txt', 'utf16le');
    console.log("Secrets File Content:\n", content);
} catch (e) {
    console.error("Error reading file:", e);
}
