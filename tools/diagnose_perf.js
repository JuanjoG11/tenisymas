const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
let m;
const scripts = [];
while ((m = scriptRegex.exec(html)) !== null) scripts.push(m[1]);
console.log('Scripts loaded:', scripts);

const imgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
const imgs = [];
while ((m = imgRegex.exec(html)) !== null) imgs.push(m[1]);
console.log('Total <img> tags:', imgs.length);

const bgRegex = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi;
const bgImages = [];
while ((m = bgRegex.exec(html)) !== null) bgImages.push(m[1]);
console.log('Total background-images in HTML:', bgImages.length);

const sectionRegex = /<section[^>]*class=["']([^"']+)["']/gi;
const sections = [];
while ((m = sectionRegex.exec(html)) !== null) sections.push(m[1]);
console.log('Sections:', sections);

// Check if any script or CSS has infinite loops or massive data
console.log('script.js size:', fs.statSync('script.js').size);
console.log('style.css size:', fs.statSync('style.css').size);
console.log('carousel.css size:', fs.statSync('carousel.css').size);
