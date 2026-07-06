import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      console.error('[profile/me] Firebase Admin not initialized');
      return NextResponse.json({ error: 'Server configuration error. Firebase not initialized.' }, { status: 503 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const profileRef = adminDb.collection('profiles').doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      // Auto-create profile if it doesn't exist
      const defaultProfile = {
        display_name: decodedToken.email?.split('@')[0] || 'CEO',
        total_points: 0,
        streak_count: 0,
        best_streak: 0,
        company_health_tier: 'Liquidator',
        last_attempt_date: null,
        bio: '',
        social_handle: '',
        created_at: new Date().toISOString(),
      };
      await profileRef.set(defaultProfile);
      return NextResponse.json({
        display_name: defaultProfile.display_name,
        total_points: 0,
        streak_count: 0,
        best_streak: 0,
        current_tier: 'Liquidator',
        last_attempt_date: null,
        bio: '',
        social_handle: '',
      });
    }

    const profile = profileDoc.data()!;

    return NextResponse.json({
      display_name: profile.display_name || 'CEO',
      total_points: profile.total_points || 0,
      streak_count: profile.streak_count || 0,
      best_streak: profile.best_streak || 0,
      current_tier: profile.company_health_tier || 'Liquidator',
      last_attempt_date: profile.last_attempt_date || null,
      bio: profile.bio || '',
      social_handle: profile.social_handle || '',
    });

  } catch (error) {
    console.error('[profile/me GET] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error. Firebase not initialized.' }, { status: 503 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await request.json();

    const updateData: Record<string, string> = {};
    if (body.display_name !== undefined) updateData.display_name = body.display_name.trim();
    if (body.bio !== undefined) updateData.bio = body.bio.trim();
    if (body.social_handle !== undefined) updateData.social_handle = body.social_handle.trim();

    if (Object.keys(updateData).length > 0) {
      const profileRef = adminDb.collection('profiles').doc(uid);
      await profileRef.set(updateData, { merge: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[profile/me POST] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
