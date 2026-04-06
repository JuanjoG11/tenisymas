
const normalize = (str) => {
    if (!str) return '';
    let result = str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[ -]/g, "");
    if (result === 'teniguayo') result = 'tenisguayos';
    return result;
};

const activeCategory = "petos,camisetas";
const fCat = normalize(activeCategory);
console.log('fCat:', fCat);

const allowedCats = fCat.split(',').map(c => c.trim()).filter(c => c);
console.log('allowedCats:', allowedCats);

const products = [
    { name: 'Colección Los Calidosos', category: 'petos' },
    { name: 'Colección La Pesada', category: 'petos' },
    { name: 'Colección La Grasa', category: 'camisetas' }
];

products.forEach(product => {
    const rawCat = product.category || '';
    const pCat = normalize(rawCat);
    const matches = allowedCats.some(cat => pCat === cat);
    console.log(`Product: ${product.name}, pCat: ${pCat}, Matches: ${matches}`);
});
