import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CATEGORIES = [
  'Crisis Management',
  'Financial Decisions',
  'Team Management',
  'Product Strategy',
  'Marketing',
  'Growth',
  'Sales Strategy',
  'Operations',
  'HR & Culture',
];

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

async function generateScenarioWithGemini(category: string, usedPrompts: string[]): Promise<{
  prompt: string;
  option_best: string;
  option_better: string;
  option_good: string;
  option_worst: string;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const avoidList = usedPrompts.length > 0
    ? `\n\nDo NOT generate scenarios similar to these already used topics:\n${usedPrompts.slice(-10).join('\n')}`
    : '';

  const systemPrompt = `You are generating realistic CEO decision-making scenarios for a daily business strategy game called CEO Daily.

Category: ${category}

Generate ONE realistic, specific scenario that a startup or scale-up CEO would actually face. The scenario must:
- Be specific and detailed (real numbers, real stakes)
- Have 4 ranked response options (best → worst)
- The "best" option should reflect sophisticated business thinking
- The "worst" option should be a plausible but clearly bad choice
- Options should NOT be obviously ranked — make it genuinely challenging${avoidList}

Respond with ONLY valid JSON in this exact format:
{
  "prompt": "The scenario question here (1-3 sentences, specific and detailed)",
  "option_best": "The ideal CEO response (2-4 sentences explaining the strategic reasoning)",
  "option_better": "A good but not perfect response (2-3 sentences)",
  "option_good": "An acceptable response with some downsides (1-2 sentences)",
  "option_worst": "A plausible but clearly bad response (1-2 sentences)"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content in Gemini response');

  const parsed = JSON.parse(text);
  if (!parsed.prompt || !parsed.option_best || !parsed.option_better || !parsed.option_good || !parsed.option_worst) {
    throw new Error('Invalid scenario format from Gemini');
  }

  return parsed;
}

async function seedScenariosForDate(targetDate: string, usedPrompts: string[]): Promise<number> {
  if (!adminDb) throw new Error('Firebase not initialized');

  // Check if scenarios already exist for this date
  const existing = await adminDb.collection('quizzes').where('active_date', '==', targetDate).get();
  if (!existing.empty) {
    console.log(`[cron] Scenarios already exist for ${targetDate}, skipping.`);
    return 0;
  }

  // Pick 3 random categories for today
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  const todayCategories = shuffled.slice(0, 3);

  let written = 0;
  for (const category of todayCategories) {
    try {
      const scenario = await generateScenarioWithGemini(category, usedPrompts);
      if (!scenario) continue;

      await adminDb.collection('quizzes').add({
        ...scenario,
        category,
        active_date: targetDate,
        created_at: new Date().toISOString(),
        generated_by: 'gemini-1.5-flash',
      });

      usedPrompts.push(scenario.prompt.slice(0, 80));
      written++;
      console.log(`[cron] ✅ ${targetDate} — ${category}`);
    } catch (err) {
      console.error(`[cron] ❌ Failed to generate ${category} for ${targetDate}:`, err);
    }
  }

  return written;
}

export async function GET(request: Request) {
  // Verify this is called by Vercel cron or manually with the right secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = request.headers.get('x-vercel-cron-signature') !== null;
  const hasSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usedPrompts: string[] = [];

    // Generate scenarios for tomorrow AND the day after (buffer)
    const results: Record<string, number> = {};
    for (let i = 1; i <= 2; i++) {
      const dateStr = getDateStr(i);
      const written = await seedScenariosForDate(dateStr, usedPrompts);
      results[dateStr] = written;
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`[cron] Done. Generated ${total} new scenarios.`);

    return NextResponse.json({
      success: true,
      generated: total,
      dates: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[cron] Failed:', error);
    return NextResponse.json({
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export const POST = GET;
