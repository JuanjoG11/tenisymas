const cp = require('child_process');
try {
    const out = cp.execSync('git log -S "lamine yamal" --name-status');
    console.log(out.toString());
} catch (e) {
    console.error("Error", e);
}
