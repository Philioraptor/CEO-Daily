import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const profileRef = adminDb.collection('profiles').doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profileDoc.data();

    return NextResponse.json({
      display_name: profile?.display_name || 'CEO',
      total_points: profile?.total_points || 0,
      streak_count: profile?.streak_count || 0,
      best_streak: profile?.best_streak || 0,
      current_tier: profile?.company_health_tier || 'Liquidator',
      last_attempt_date: profile?.last_attempt_date || null,
      bio: profile?.bio || '',
      social_handle: profile?.social_handle || '',
    });

  } catch (error) {
    console.error('Unhandled profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await request.json();

    const updateData: any = {};
    if (body.display_name !== undefined) updateData.display_name = body.display_name.trim();
    if (body.bio !== undefined) updateData.bio = body.bio.trim();
    if (body.social_handle !== undefined) updateData.social_handle = body.social_handle.trim();

    if (Object.keys(updateData).length > 0) {
      const profileRef = adminDb.collection('profiles').doc(uid);
      await profileRef.set(updateData, { merge: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unhandled profile POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
