
const { execSync } = require('child_process');

try {
    const output = execSync('git log --name-only --pretty=format:').toString();
    const files = new Set();
    output.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('commit') && !trimmed.startsWith('Author:') && !trimmed.startsWith('Date:')) {
            files.add(trimmed);
        }
    });
    console.log("ALL FILES EVER IN REPO:");
    Array.from(files).sort().forEach(f => console.log(f));
} catch (e) {
    console.error(e);
}
