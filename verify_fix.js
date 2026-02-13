// Verification Script for Price Logic

// Mock Data
const cart = [
    { name: "Item String", price: "$50.000", quantity: 1 },
    { name: "Item Number", price: 50000, quantity: 2 },
    { name: "Item Invalid", price: null, quantity: 1 } // Should handle gracefully
];

// Logic from script.js (updateCartUI equivalent calculation)
function calculateTotal(cart) {
    console.log("Testing Calculate Total...");
    try {
        const total = cart.reduce((sum, item) => {
            // Safe price parsing
            let price = 0;
            if (typeof item.price === 'number') {
                price = item.price;
            } else if (typeof item.price === 'string') {
                price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
            }
            console.log(`Item: ${item.name}, Raw: ${item.price}, Parsed: ${price}`);
            return sum + (price * item.quantity);
        }, 0);
        console.log("Total Calculated:", total);
        return total;
    } catch (e) {
        console.error("CRASH IN CALCULATE TOTAL:", e);
        return -1;
    }
}

// Logic from collections-logic.js (parsePrice)
function parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;
    if (typeof priceString === 'string') {
        const clean = priceString.replace(/[^\d]/g, '');
        return parseInt(clean) || 0;
    }
    return 0;
}

// Run Tests
console.log("--- START VERIFICATION ---");

const total = calculateTotal(cart);
if (total === 150000) {
    console.log("✅ Total Calculation Logic: PASSED");
} else {
    console.error("❌ Total Calculation Logic: FAILED (Expected 150000, got " + total + ")");
}

console.log("\nTesting parsePrice...");
const tests = [
    { input: "$100.000", expected: 100000 },
    { input: 200000, expected: 200000 },
    { input: "invalid", expected: 0 },
    { input: null, expected: 0 }
];

let allPassed = true;
tests.forEach(t => {
    const res = parsePrice(t.input);
    if (res === t.expected) {
        console.log(`✅ parsePrice(${t.input}) = ${res}`);
    } else {
        console.error(`❌ parsePrice(${t.input}) = ${res} (Expected ${t.expected})`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("\n🎉 ALL TESTS PASSED");
} else {
    console.log("\n⚠️ SOME TESTS FAILED");
}
