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

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch all scenarios and filter in memory to avoid composite index requirements on active_date
    const snapshot = await adminDb.collection('quizzes').get();

    if (snapshot.empty) {
      return NextResponse.json({ scenarios: [] });
    }

    const allScenarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter out today's and future scenarios
    const pastScenarios = allScenarios.filter((s: any) => s.active_date && s.active_date < today);

    // Randomize the order and pick up to 3 for a practice run
    const shuffled = pastScenarios.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    // Format them for the frontend (including the answer keys so we can evaluate locally!)
    const formattedScenarios = selected.map((scenario: any) => {
      const options = [
        { id: 'best', text: scenario.option_best, points: 100 },
        { id: 'better', text: scenario.option_better, points: 50 },
        { id: 'good', text: scenario.option_good, points: 20 },
        { id: 'worst', text: scenario.option_worst, points: 0 },
      ];

      // Shuffle options randomly
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        id: scenario.id,
        category: scenario.category,
        prompt: scenario.prompt,
        options,
      };
    });

    return NextResponse.json({ scenarios: formattedScenarios });
  } catch (error) {
    console.error('Unhandled error in archive route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
