import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    }

    if (!serviceAccountJson) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable');
    }
    
    // Bulletproof extraction using Regex to bypass any Vercel JSON escaping/quote mangling
    const projectIdMatch = serviceAccountJson.match(/"project_id"\s*:\s*"([^"]+)"/);
    const clientEmailMatch = serviceAccountJson.match(/"client_email"\s*:\s*"([^"]+)"/);
    let privateKeyMatch = serviceAccountJson.match(/"private_key"\s*:\s*"([^"]+)"/);
    
    let projectId, clientEmail, privateKey;
    
    if (projectIdMatch && clientEmailMatch && privateKeyMatch) {
      projectId = projectIdMatch[1];
      clientEmail = clientEmailMatch[1];
      privateKey = privateKeyMatch[1].replace(/\\+n/g, '\n');
    } else {
      // Fallback if Regex fails
      if (serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")) {
        serviceAccountJson = serviceAccountJson.slice(1, -1);
      }
      const parsed = JSON.parse(serviceAccountJson);
      projectId = parsed.project_id;
      clientEmail = parsed.client_email;
      privateKey = parsed.private_key.replace(/\\+n/g, '\n');
    }
    
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Ensure these don't throw at the module level if app failed to initialize
export const adminDb = getApps().length > 0 ? getFirestore() : null as any;
export const adminAuth = getApps().length > 0 ? getAuth() : null as any;
