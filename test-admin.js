const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
let serviceAccountJson = match[1];

try {
    const projectIdMatch = serviceAccountJson.match(/"project_id"\s*:\s*"([^"]+)"/);
    const clientEmailMatch = serviceAccountJson.match(/"client_email"\s*:\s*"([^"]+)"/);
    let privateKeyMatch = serviceAccountJson.match(/"private_key"\s*:\s*"([^"]+)"/);
    
    let projectId, clientEmail, privateKey;
    
    if (projectIdMatch && clientEmailMatch && privateKeyMatch) {
      projectId = projectIdMatch[1];
      clientEmail = clientEmailMatch[1];
      privateKey = privateKeyMatch[1].replace(/\\+n/g, '\n');
    } else {
      throw new Error("Regex failed");
    }
    
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    
    const db = getFirestore();
    console.log("Firebase initialized successfully! DB is", !!db);
} catch (error) {
    console.error("Firebase admin initialization error:", error);
}
