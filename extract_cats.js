
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/Juanjo/Documents/tenisymas/db_products_dump.json', 'utf8'));
const categories = new Set();
data.forEach(p => {
    if (p.category) categories.add(p.category);
    if (p.categoria) categories.add(p.categoria);
});
const petos = data.filter(p => {
    const s = JSON.stringify(p).toLowerCase();
    return s.includes('peto') || s.includes('camiseta');
}).map(p => ({ id: p.id, name: p.name, category: p.category || p.categoria }));

const result = {
    categories: Array.from(categories),
    petosCount: petos.length,
    petos: petos
};

fs.writeFileSync('extract_results.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Results saved to extract_results.json');
