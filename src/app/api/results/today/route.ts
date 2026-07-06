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
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Get today's scores from user_scores collection
    const allScoresSnapshot = await adminDb.collection('user_scores')
      .where('user_id', '==', uid)
      .get();

    const todayStrStart = todayStart.toISOString();
    const tomorrowStr = tomorrowStart.toISOString();
    const scoresToday = allScoresSnapshot.docs.filter(doc => {
      const ca = doc.data().created_at;
      return ca >= todayStrStart && ca < tomorrowStr;
    });

    let pointsToday = 0;
    scoresToday.forEach(doc => {
      pointsToday += doc.data().points_awarded;
    });

    // Get profile for streak and current tier
    const profileDoc = await adminDb.collection('profiles').doc(uid).get();
    
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profileDoc.data();
    const isCompleted = scoresToday.length === 3;
    let computedTier = profile?.company_health_tier || 'Liquidator';

    if (isCompleted) {
      const avg = pointsToday / 3;
      if (avg >= 80) computedTier = 'Visionary';
      else if (avg >= 50) computedTier = 'Operator';
      else if (avg >= 20) computedTier = 'Firefighter';
      else computedTier = 'Liquidator';

      if (profile && profile.company_health_tier !== computedTier) {
        await adminDb.collection('profiles').doc(uid).update({ company_health_tier: computedTier });
      }
    }

    return NextResponse.json({
      day_total: pointsToday,
      tier: computedTier,
      streak_count: profile?.streak_count || 0,
      is_completed: isCompleted
    });

  } catch (error) {
    console.error('Unhandled results error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
