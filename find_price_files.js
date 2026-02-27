const cp = require('child_process');
const out = cp.execSync('git log --all --name-status --oneline').toString();
const lines = out.split('\n');
let currentCommit = '';
lines.forEach(l => {
    if (l.match(/^[a-f0-9]{7,}/)) {
        currentCommit = l;
    } else if (l.toLowerCase().includes('price') || l.toLowerCase().includes('product')) {
        console.log(currentCommit, '->', l);
    }
});
