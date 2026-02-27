
const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('git show 507fd89:final_data.json', { encoding: 'utf-8' });
    fs.writeFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\extracted_final_data.json', output, 'utf-8');

    const output2 = execSync('git show 507fd89:product_data.json', { encoding: 'utf-8' });
    fs.writeFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\extracted_product_data.json', output2, 'utf-8');

    console.log("Extraction successful.");
} catch (e) {
    console.error("Error:", e.message);
}
