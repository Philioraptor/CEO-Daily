import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ratelimit } from '@/lib/redis';

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

    const snapshot = await adminDb.collection('quizzes')
      .where('active_date', '==', today)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ scenarios: [] });
    }

    const scenarios = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const labeledScenarios = scenarios.map((scenario: any) => {
      const options = [
        { id: 'best', text: scenario.option_best },
        { id: 'better', text: scenario.option_better },
        { id: 'good', text: scenario.option_good },
        { id: 'worst', text: scenario.option_worst },
      ];

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

    return NextResponse.json({ scenarios: labeledScenarios });
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
