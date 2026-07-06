import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let serviceAccount: {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  try {
    if (base64) {
      // PRIMARY: Use Base64-encoded service account (most reliable on Vercel)
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } else if (raw) {
      // FALLBACK: Try parsing the raw JSON string
      // Handle cases where Vercel wraps in single quotes
      const cleaned = raw.startsWith("'") && raw.endsWith("'")
        ? raw.slice(1, -1)
        : raw;
      serviceAccount = JSON.parse(cleaned);
    } else {
      throw new Error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in Vercel env vars.');
    }

    // Normalize private key newlines (handles \\n escaped strings)
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey,
      }),
    });
  } catch (err) {
    console.error('[firebase-admin] Failed to initialize:', err);
    return null;
  }
}

// Initialize once
const app = getFirebaseAdminApp();

export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;
