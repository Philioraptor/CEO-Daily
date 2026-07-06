import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

// Get today's date in YYYY-MM-DD format (UTC)
const today = new Date().toISOString().split('T')[0];

const scenarios = [
  {
    category: "Leadership",
    prompt: "Your VP of Sales and VP of Product are in a heated argument over the Q3 roadmap during an executive meeting. The tension is palpable and it's derailing the agenda.",
    option_best: "Pause the meeting, acknowledge the importance of both perspectives, and schedule a dedicated 1-on-1 mediation session to find a compromise.",
    option_better: "Listen to both sides briefly, make an executive decision on the spot to keep things moving.",
    option_good: "Tell them to take it offline and figure it out themselves.",
    option_worst: "Publicly side with the VP of Sales because revenue is the top priority right now.",
    active_date: today,
  },
  {
    category: "Finance",
    prompt: "You've just been informed that a major enterprise client is churning, which will result in missing your quarterly revenue targets by 15%. Board meeting is tomorrow.",
    option_best: "Prepare a transparent report detailing why the client left, the immediate financial impact, and a concrete 30-60-90 day mitigation plan.",
    option_better: "Inform the board of the churn but emphasize the strong pipeline of potential new deals.",
    option_good: "Wait to tell the board until you've officially signed a replacement client.",
    option_worst: "Obscure the churn in the financial projections to buy time.",
    active_date: today,
  },
  {
    category: "Culture",
    prompt: "Employee surveys show a sharp decline in morale following a recent pivot in company strategy. Key engineers are starting to interview elsewhere.",
    option_best: "Host a company-wide Town Hall to transparently address concerns, explain the 'why' behind the pivot, and open an anonymous Q&A.",
    option_better: "Send a company-wide email reaffirming the vision and offering retention bonuses to key engineers.",
    option_good: "Ask managers to handle morale issues within their individual teams.",
    option_worst: "Ignore the survey; true believers will stay and execute the pivot.",
    active_date: today,
  }
];

async function seed() {
  console.log("Seeding today's scenarios into Firestore...");
  let count = 0;

  for (const scenario of scenarios) {
    try {
      const docRef = await db.collection('quizzes').add(scenario);
      console.log(`Successfully inserted scenario ${docRef.id} - ${scenario.category}`);
      count++;
    } catch (error) {
      console.error(`Error inserting scenario:`, error);
    }
  }

  console.log(`\nDone! Seeded ${count} scenarios for ${today}.`);
  process.exit(0);
}

seed();
