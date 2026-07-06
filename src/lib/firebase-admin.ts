import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    }
    
    // Strip surrounding single quotes if Vercel includes them
    if (serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")) {
      serviceAccountJson = serviceAccountJson.slice(1, -1);
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
