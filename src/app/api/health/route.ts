import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check env vars exist (don't expose values)
  checks['FIREBASE_SERVICE_ACCOUNT_KEY'] = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'MISSING';
  checks['FIREBASE_SERVICE_ACCOUNT_BASE64'] = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'SET' : 'MISSING';
  checks['UPSTASH_REDIS_REST_URL'] = process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'MISSING';
  checks['UPSTASH_REDIS_REST_TOKEN'] = process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'MISSING';
  checks['GEMINI_API_KEY'] = process.env.GEMINI_API_KEY ? 'SET' : 'MISSING';
  checks['CRON_SECRET'] = process.env.CRON_SECRET ? 'SET' : 'MISSING';

  // 2. Try to import firebase-admin and check initialization
  let firebaseStatus = 'NOT_INITIALIZED';
  let firebaseError = null;
  try {
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    firebaseStatus = apps.length > 0 ? 'INITIALIZED' : 'NO_APPS';
  } catch (err: unknown) {
    firebaseStatus = 'IMPORT_ERROR';
    firebaseError = err instanceof Error ? err.message : String(err);
  }

  // 3. Try to get adminDb
  let dbStatus = 'UNKNOWN';
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    dbStatus = adminDb ? 'CONNECTED' : 'NULL';
  } catch (err: unknown) {
    dbStatus = 'ERROR: ' + (err instanceof Error ? err.message : String(err));
  }

  // 4. Test Redis connectivity
  let redisStatus = 'UNKNOWN';
  try {
    const { redis } = await import('@/lib/redis');
    await redis.ping();
    redisStatus = 'CONNECTED';
  } catch (err: unknown) {
    redisStatus = 'ERROR: ' + (err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: checks,
    firebase: { status: firebaseStatus, error: firebaseError },
    db: dbStatus,
    redis: redisStatus,
  });
}
