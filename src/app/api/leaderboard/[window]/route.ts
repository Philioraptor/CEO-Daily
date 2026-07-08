import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ window: string }> }
) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const { window } = await params;

    if (!['daily', 'weekly', 'monthly'].includes(window)) {
      return NextResponse.json({ error: 'Invalid window' }, { status: 400 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // Determine the current Redis key based on the window
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let redisKey = '';

    if (window === 'daily') {
      redisKey = `lb:daily:${todayStr}`;
    } else if (window === 'weekly') {
      const [year, week] = getYearAndWeek(now);
      redisKey = `lb:weekly:${year}-W${week}`;
    } else if (window === 'monthly') {
      redisKey = `lb:monthly:${now.getFullYear()}-${now.getMonth() + 1}`;
    }

    // 1. Fetch top 100 — Upstash returns a flat array [member1, score1, member2, score2] when withScores: true
    const rawResults = await redis.zrange<string[]>(redisKey, 0, 99, { rev: true, withScores: true });

    const top100 = [];
    for (let i = 0; i < rawResults.length; i += 2) {
      top100.push({
        user_id: rawResults[i],
        score: Number(rawResults[i + 1]),
      });
    }

    // 2. Fetch current user's rank and score
    const userRankRaw = await redis.zrevrank(redisKey, uid);
    const userScoreRaw = await redis.zscore(redisKey, uid);

    const userRank = userRankRaw !== null ? userRankRaw + 1 : null;
    const userScore = userScoreRaw !== null ? Number(userScoreRaw) : 0;

    // 3. Resolve display names from Firestore
    let leaderboard: { rank: number; user_id: string; display_name: string; score: number }[] = [];

    if (top100.length > 0) {
      const userIds = top100.map((t) => t.user_id);
      const docRefs = userIds.map((id) => adminDb!.collection('profiles').doc(id));
      const profiles = await adminDb!.getAll(...docRefs);

      const profileMap = new Map<string, string>();
      profiles.forEach((doc: FirebaseFirestore.DocumentSnapshot) => {
        if (doc.exists) {
          profileMap.set(doc.id, doc.data()?.display_name || 'Anonymous CEO');
        }
      });

      leaderboard = top100.map((entry, idx) => ({
        rank: idx + 1,
        user_id: entry.user_id,
        display_name: profileMap.get(entry.user_id) || 'Anonymous CEO',
        score: entry.score,
      }));
    }

    return NextResponse.json({
      leaderboard,
      user_status: {
        rank: userRank,
        score: userScore,
      },
    });

  } catch (error) {
    console.error('[leaderboard] Unhandled error:', error);
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
