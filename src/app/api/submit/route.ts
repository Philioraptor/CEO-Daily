import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ratelimit, redis } from '@/lib/redis';

export const runtime = 'nodejs';

const POINT_VALUES: Record<string, number> = {
  best: 100,
  better: 50,
  good: 20,
  worst: 0,
};

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
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

    // Rate Limiting per User IP
    const { success } = await ratelimit.limit(`submit_${uid}_${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { scenario_id, chosen_option } = body;

    if (!scenario_id || !chosen_option || (POINT_VALUES[chosen_option] === undefined)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Check if scenario exists and is active today
    const scenarioDoc = await adminDb.collection('quizzes').doc(scenario_id).get();
    if (!scenarioDoc.exists || scenarioDoc.data()?.active_date !== today) {
      return NextResponse.json({ error: 'Scenario not found or not active today' }, { status: 404 });
    }

    const pointsToAward = POINT_VALUES[chosen_option];

    // 2. Insert the score. Use a predictable document ID to prevent duplicate submissions: `uid_scenarioId`
    const scoreDocId = `${uid}_${scenario_id}`;
    const scoreRef = adminDb.collection('user_scores').doc(scoreDocId);
    
    const scoreDoc = await scoreRef.get();
    if (scoreDoc.exists) {
      return NextResponse.json({ error: 'Already submitted today' }, { status: 409 });
    }

    await scoreRef.set({
      user_id: uid,
      quiz_id: scenario_id,
      chosen_option: chosen_option,
      points_awarded: pointsToAward,
      created_at: new Date().toISOString()
    });

    // 3. Update the Profile total points and check for daily completion
    const profileRef = adminDb.collection('profiles').doc(uid);
    let profileDoc = await profileRef.get();
    
    // Auto-create profile if it doesn't exist
    if (!profileDoc.exists) {
      await profileRef.set({
        display_name: 'CEO',
        total_points: 0,
        streak_count: 0,
        best_streak: 0,
        company_health_tier: 'Liquidator',
        last_attempt_date: null
      });
      profileDoc = await profileRef.get();
    }

    const profile = profileDoc.data()!;
    let newTotalPoints = (profile.total_points || 0) + pointsToAward;

    // Check how many scenarios completed today
    const todayStart = new Date(today);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const allScoresSnapshot = await adminDb.collection('user_scores')
      .where('user_id', '==', uid)
      .get();

    const todayStrStart = todayStart.toISOString();
    const tomorrowStr = tomorrowStart.toISOString();
    const scoresToday = allScoresSnapshot.docs.filter(doc => {
      const ca = doc.data().created_at;
      return ca >= todayStrStart && ca < tomorrowStr;
    });

    const completedTodayCount = scoresToday.length;
    
    let newStreak = profile.streak_count || 0;
    let newTier = profile.company_health_tier || 'Liquidator';
    let isDayComplete = completedTodayCount === 3;

    if (isDayComplete) {
      // Calculate average score for the day
      let daySum = 0;
      scoresToday.forEach(doc => { daySum += doc.data().points_awarded; });
      const avg = daySum / 3;

      if (avg >= 80) newTier = 'Visionary';
      else if (avg >= 50) newTier = 'Operator';
      else if (avg >= 20) newTier = 'Firefighter';
      else newTier = 'Liquidator';

      // Check streak continuity
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (profile.last_attempt_date === yesterdayStr) {
        newStreak += 1; // Kept the streak alive
      } else if (profile.last_attempt_date === today) {
        // Already incremented today
      } else {
        newStreak = 1; // Streak broken, restart
      }

      const bestStreak = Math.max(newStreak, profile.best_streak || 0);

      await profileRef.update({
        total_points: newTotalPoints,
        streak_count: newStreak,
        best_streak: bestStreak,
        last_attempt_date: today,
        company_health_tier: newTier
      });
    } else {
      await profileRef.update({
        total_points: newTotalPoints
      });
    }

    // 4. Update Redis Leaderboards (Fire and forget, or await)
    try {
      const dailyKey = `lb:daily:${today}`;
      const [year, week] = getYearAndWeek(todayStart);
      const weeklyKey = `lb:weekly:${year}-W${week}`;
      const monthlyKey = `lb:monthly:${todayStart.getFullYear()}-${todayStart.getMonth() + 1}`;

      await Promise.all([
        redis.zincrby(dailyKey, pointsToAward, uid),
        redis.zincrby(weeklyKey, pointsToAward, uid),
        redis.zincrby(monthlyKey, pointsToAward, uid),
      ]);
    } catch (redisError) {
      console.error('Redis leaderboard update error:', redisError);
    }

    return NextResponse.json({
      points_awarded: pointsToAward,
      running_total: newTotalPoints,
      scenarios_completed_today: completedTodayCount,
      tier_if_day_ended_now: newTier
    });

  } catch (error) {
    console.error('Unhandled submit error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getYearAndWeek(date: Date): [number, number] {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}
