const fs = require('fs');

// Credenciales hardcodeadas en el código actual
const CLIENT_ID = "p5iZ61w2OCNQlT7qFAlmiakSsXnI9yOk";
const CLIENT_SECRET = "NY1kdeqqk1fZ_nMn4kQjtYM9MYnDPB7dKRC8HmlTpQryCxqRhuYcXCnCCfZfyOY4";
// Cambiar a false si quieres probar producción
const IS_SANDBOX = true;
const BASE_AUTH = IS_SANDBOX ? "https://auth.addi-staging.com" : "https://auth.addi.com";
const AUDIENCE = IS_SANDBOX ? "https://api.staging.addi.com" : "https://api.addi.com";

async function testAuth() {
    const log = {};
    log.testing = "Produccion auth: https://auth.addi.com/oauth/token";
    
    try {
        const res = await fetch(`${BASE_AUTH}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                audience: AUDIENCE,
                grant_type: "client_credentials"
            })
        });
        
        log.authStatus = res.status;
        const body = await res.text();
        try {
            log.authBody = JSON.parse(body);
        } catch(e) {
            log.authBodyRaw = body;
        }
        
        if (res.ok && log.authBody && log.authBody.access_token) {
            log.result = "AUTH OK - token obtained";
        } else {
            log.result = "AUTH FAILED";
        }
        
    } catch(err) {
        log.networkError = err.message;
    }
    
    fs.writeFileSync('addi_auth_test.json', JSON.stringify(log, null, 2), 'ascii');
    console.log('Done. Check addi_auth_test.json');
}

testAuth();
