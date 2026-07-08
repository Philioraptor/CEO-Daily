// Seed script - run with: node scripts/seed-scenarios.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    let value = valueParts.join('=').trim();
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key.trim()] = value;
  }
}

// Init Firebase Admin
let serviceAccount;
if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch {
    // Try replacing escaped newlines and parsing again
    try {
      const cleaned = env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');
      serviceAccount = JSON.parse(cleaned);
    } catch {
      // Try parsing as single-quoted string
      let raw = env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (raw.startsWith("'")) raw = raw.slice(1, -1);
      serviceAccount = JSON.parse(raw.replace(/\\n/g, '\n'));
    }
  }
  // Ensure private key has actual newlines
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Helper: get date string N days from today
function getDateStr(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
}

// 90 scenarios: 3 per day for 30 days
const scenarioSets = [
  // Day 0
  [
    {
      category: 'Crisis Management',
      prompt: 'Your company\'s main product has a critical bug that\'s affecting 30% of users. Your team estimates a 48-hour fix. What do you do?',
      option_best: 'Immediately notify all affected users via email and in-app banner, publish a status page with real-time updates, assign a dedicated war room team, and offer a pro-rated refund for downtime.',
      option_better: 'Notify affected users, set up a status page, and put your best engineers on the fix with hourly internal updates.',
      option_good: 'Push a hotfix for the worst-affected users first, then email everyone once the full fix is ready.',
      option_worst: 'Wait for the fix to be ready before communicating anything — no point alarming users unnecessarily.',
    },
    {
      category: 'Financial Decisions',
      prompt: 'Your startup has 6 months of runway left. A VC offers a term sheet at a 20% lower valuation than your last round. Do you take it?',
      option_best: 'Accept the down round with a clean term sheet, use it to extend runway to 18 months, cut non-essential spend, and double down on the core product to prove value before the next raise.',
      option_better: 'Negotiate terms aggressively — push for 10% lower discount, anti-dilution provisions, and milestone-based tranches, then sign if they agree.',
      option_good: 'Take the money but renegotiate the board seat composition to retain control.',
      option_worst: 'Reject it and keep burning runway hoping a better offer comes in the next 2 months.',
    },
    {
      category: 'Team Management',
      prompt: 'Your top engineer wants a 40% salary raise or they\'ll leave. The market rate supports their ask but it would mean laying off a junior hire. What do you do?',
      option_best: 'Meet 80% of the ask immediately, offer equity acceleration as the rest, be transparent about the budget constraint, and plan to close the gap in 6 months tied to a clear milestone.',
      option_better: 'Match the full raise, lay off the junior hire, and backfill with a contractor only when revenue justifies it.',
      option_good: 'Offer a 20% raise now with a written commitment to review again in 3 months based on performance.',
      option_worst: 'Call their bluff. Engineers rarely actually leave and the market isn\'t as hot as they think.',
    },
  ],
  // Day 1
  [
    {
      category: 'Product Strategy',
      prompt: 'Your product analytics show 80% of revenue comes from a feature used by only 15% of users. Do you double down on that feature or broaden the product?',
      option_best: 'Double down on the power users — build them a premium tier, talk to them weekly, and make that feature world-class before expanding. Revenue concentration is a signal, not a problem.',
      option_better: 'Invest 70% of engineering in the core feature while running small experiments to find adjacent use cases.',
      option_good: 'Broaden the product to reduce concentration risk while maintaining what already works.',
      option_worst: 'Sunset the niche feature and focus on features that appeal to the 85% majority of users.',
    },
    {
      category: 'Marketing',
      prompt: 'A viral tweet incorrectly claims your product caused data loss. It has 50K retweets. How do you respond?',
      option_best: 'Respond publicly within the hour with factual evidence (logs, screenshots), acknowledge the user\'s frustration even if the claim is wrong, offer to investigate their specific case privately, and pin your response.',
      option_better: 'Reply publicly with a clear factual rebuttal and offer the user a direct call to resolve their concern.',
      option_good: 'DM the user asking for their account details so you can investigate before responding publicly.',
      option_worst: 'Ignore it — engaging with false accusations only amplifies them.',
    },
    {
      category: 'Operations',
      prompt: 'Your cloud bill doubled last month due to a misconfigured auto-scaling rule. The team is unsure if it will happen again. What\'s your response?',
      option_best: 'Set hard billing alerts and budget caps immediately, run a post-mortem to find root cause, assign ownership of cloud cost to one engineer, and implement a monthly cost review ritual.',
      option_better: 'Fix the misconfiguration, set up billing alerts at 80% of last month\'s spend, and schedule a monthly cloud review.',
      option_good: 'Ask DevOps to review the autoscaling config and set an alert for when the daily bill exceeds $X.',
      option_worst: 'Accept it as a one-time mistake and move on — it won\'t happen again now that the team is aware.',
    },
  ],
  // Day 2
  [
    {
      category: 'HR & Culture',
      prompt: 'Two of your best employees have a serious ongoing conflict that\'s affecting the whole team\'s morale. Neither wants to back down. What do you do?',
      option_best: 'Meet with each separately to understand the root cause, then bring them together with a mediator. Set clear behavioral expectations with consequences, restructure team workflows to reduce friction, and follow up weekly.',
      option_better: 'Have a frank 3-way conversation, document agreed norms, and give a 30-day improvement window with clear consequences.',
      option_good: 'Separate them into different squads with minimal overlap and let the conflict naturally de-escalate.',
      option_worst: 'Let them work it out themselves — adult professionals should be able to handle their own interpersonal issues.',
    },
    {
      category: 'Sales Strategy',
      prompt: 'A Fortune 500 company wants your product but is asking for a 70% discount in exchange for a 3-year contract and public case study rights. Do you take the deal?',
      option_best: 'Negotiate to 40% discount, insist on annual payment upfront, get the case study rights in writing, and make sure the contract has expansion revenue clauses built in.',
      option_better: 'Take the deal at 50% discount — the case study and logo alone will close 10 more enterprise deals at full price.',
      option_good: 'Accept only if they agree to pay annually upfront and you can use them as a reference in sales calls.',
      option_worst: 'Reject it. Discounting 70% destroys your pricing integrity and every future enterprise prospect will ask for the same.',
    },
    {
      category: 'Crisis Management',
      prompt: 'A key vendor who supplies a critical component has gone bankrupt. You have 2 weeks of inventory left. What do you do?',
      option_best: 'Immediately activate emergency procurement from 2-3 backup suppliers even at higher cost, notify customers proactively about potential delays, pause new orders temporarily, and begin qualifying a permanent alternative vendor.',
      option_better: 'Source from a backup vendor at a premium, notify only customers whose orders will be affected, and expedite the contract with a new primary vendor.',
      option_good: 'Buy out remaining inventory from competitors at market rate while negotiating a new supplier contract.',
      option_worst: 'Keep taking new orders and hope the new vendor comes through in time — cancelling orders later is a last resort.',
    },
  ],
  // Day 3
  [
    {
      category: 'Product Strategy',
      prompt: 'Your competitor just launched a feature that 40% of your customers have been requesting for months. Your roadmap doesn\'t include it for another 6 months. What do you do?',
      option_best: 'Ship a v1 of the feature in 3 weeks using the simplest possible implementation, communicate it to customers as "early access," gather feedback, and iterate. Speed beats perfection here.',
      option_better: 'Reprioritize the roadmap, pull it forward to next month with a small dedicated squad, and announce it to customers immediately.',
      option_good: 'Stay the course — react to competitors and you lose strategic focus. Accelerate it to 4 months instead.',
      option_worst: 'Do nothing. Chasing competitors\' features is a race to the bottom.',
    },
    {
      category: 'Financial Decisions',
      prompt: 'You\'re offered a partnership that guarantees $2M in revenue but requires you to white-label your product under their brand for 2 years. Do you take it?',
      option_best: 'Decline or negotiate heavily — white-labeling for 2 years kills brand equity and customer relationships. Counter with co-branding and a 6-month pilot instead.',
      option_better: 'Accept only if the contract includes a "powered by [your brand]" clause, limits exclusivity to their vertical, and has 6-month exit provisions.',
      option_good: 'Take the $2M, use it to fund product development, and rebrand out of their shadow after the contract ends.',
      option_worst: 'Take the deal immediately — $2M guaranteed revenue is rare and the brand concerns can be managed later.',
    },
    {
      category: 'Team Management',
      prompt: 'You\'re hiring for a senior role. One candidate is technically brilliant but was described as "difficult to work with" by references. The other is solid but not exceptional. Who do you hire?',
      option_best: 'Neither until you dig deeper. Call the references back and ask specific behavioral questions. If the brilliant candidate has a pattern of toxicity, the culture damage will cost you far more than the skill gap.',
      option_better: 'Hire the solid candidate. A-players who are team multipliers beat lone geniuses every time at the senior level.',
      option_good: 'Hire the brilliant one with a clear 90-day behavioral plan and expectations set upfront.',
      option_worst: 'Hire the brilliant one — difficult people are often just misunderstood and your culture will absorb them.',
    },
  ],
  // Day 4
  [
    {
      category: 'Growth',
      prompt: 'Your user growth has plateaued for 3 months. Your team is debating between investing in paid acquisition vs. doubling down on product-led growth. Which do you choose?',
      option_best: 'Audit retention first. If your month-1 retention is below 40%, paid acquisition will just pour water into a leaky bucket. Fix retention before buying growth.',
      option_better: 'Run controlled experiments on both channels with equal budgets for 60 days and let data decide.',
      option_good: 'Double down on PLG — paid acquisition is expensive and PLG compounds over time.',
      option_worst: 'Pour budget into paid acquisition immediately — you need to show growth metrics to investors.',
    },
    {
      category: 'Operations',
      prompt: 'Your customer support team is overwhelmed with 3-day response times. Customers are churning. Do you hire more support staff or invest in automation?',
      option_best: 'Both in parallel — hire one senior support person to handle escalations while implementing a chatbot for top 10 repeat questions. Measure which deflects more tickets per dollar within 30 days.',
      option_better: 'Implement a help center and chatbot first (faster and cheaper), then reassess headcount needs after 60 days.',
      option_good: 'Hire 2 support agents now to stop the bleeding, then invest in automation next quarter.',
      option_worst: 'Hire 5 support agents immediately — automation takes too long to implement and customers are leaving now.',
    },
    {
      category: 'Marketing',
      prompt: 'You have $50K to spend on marketing this quarter. A conference sponsorship costs $40K and guarantees 500 leads. Digital ads historically generate 300 leads per $10K. What do you do?',
      option_best: 'Skip the conference — $40K for 500 leads ($80/lead) is worse than digital at $33/lead. Put $40K into digital, $5K on content, and $5K to attend the conference without sponsoring to build relationships.',
      option_better: 'Split $25K digital, $25K conference. Diversification reduces risk and the conference brand association has value beyond raw leads.',
      option_good: 'Take the conference — 500 warm, in-person leads convert at higher rates than cold digital leads.',
      option_worst: 'Put it all into digital ads — conferences are old-school and the lead quality is always terrible.',
    },
  ],
  // Day 5
  [
    {
      category: 'Crisis Management',
      prompt: 'A news outlet is planning to publish a story about a former employee\'s misconduct claim against your company. You have 24 hours. What do you do?',
      option_best: 'Brief your board immediately, engage a PR firm, prepare a factual statement acknowledging your investigation process, reach out to the journalist to provide accurate context (not to suppress the story), and brief your leadership team.',
      option_better: 'Talk to legal counsel, prepare a truthful public statement, and proactively reach out to employees before the story drops.',
      option_good: 'Let legal handle it — issue a statement only if the story publishes and misrepresents facts.',
      option_worst: 'Ask the journalist not to publish and offer them an exclusive interview later as an incentive.',
    },
    {
      category: 'Product Strategy',
      prompt: 'Should you build an API so other companies can integrate your product, or focus on your direct product experience for end users?',
      option_best: 'Build the API only if 3+ customers have asked for integrations and are willing to pay for them. Validate demand before building infrastructure. An API built for theoretical partners rarely gets used.',
      option_better: 'Build the API — it creates a platform moat, generates developer love, and enables an ecosystem you can\'t build yourself.',
      option_good: 'Focus on the direct product first. An API with a mediocre core product is just spreading mediocrity faster.',
      option_worst: 'Build both simultaneously — splitting your team is inefficient but you can\'t afford to delay either.',
    },
    {
      category: 'HR & Culture',
      prompt: 'You discover a high-performing employee has been falsifying their expense reports — $3,000 over 6 months. What do you do?',
      option_best: 'Terminate immediately after proper HR process. Fraud is fraud regardless of performance. Document everything, require repayment, and use it as a moment to reinforce company values with the whole team without naming anyone.',
      option_better: 'Confront them privately, require full repayment, issue a formal written warning, and monitor closely. Termination is last resort for a top performer.',
      option_good: 'Have a frank conversation, require repayment, and give one final chance — people make mistakes.',
      option_worst: 'Handle it informally. Their performance value outweighs the cost and public disciplinary action would hurt morale.',
    },
  ],
  // Day 6
  [
    {
      category: 'Financial Decisions',
      prompt: 'You can either raise a $5M Series A at a $25M valuation now, or wait 6 months to raise at a projected $40M valuation. Market conditions are uncertain. What do you do?',
      option_best: 'Raise now. A bird in hand is worth two in the bush — market conditions can deteriorate fast. $5M at $25M valuation beats running out of runway while waiting for a better deal.',
      option_better: 'Raise now but push the valuation to $30M — you have leverage if multiple VCs are interested.',
      option_good: 'Wait the 6 months — diluting at $25M when you\'re 6 months from $40M is giving away money for free.',
      option_worst: 'Decline the offer entirely and focus on getting to profitability instead of taking more dilution.',
    },
    {
      category: 'Sales Strategy',
      prompt: 'Your sales team is missing quota 3 months in a row. The VP Sales blames the product. Product team blames the sales pitch. Who do you believe and what do you do?',
      option_best: 'Shadow 10 sales calls yourself this week. The data will tell you the truth. Get the two teams in a room together with call recordings — blame disappears when you look at evidence together.',
      option_better: 'Hire an external sales consultant to audit your process — they\'ll give you an unbiased diagnosis within 2 weeks.',
      option_good: 'Trust the VP Sales — they\'re closest to customers and if they say the product needs work, the product team should listen.',
      option_worst: 'Put the VP Sales on a 60-day PIP. Three months of missed quota is long enough to know it\'s a performance issue.',
    },
    {
      category: 'Operations',
      prompt: 'You\'re about to sign a 3-year office lease. Remote-first culture has been working well. Do you still sign it?',
      option_best: 'Don\'t sign a 3-year lease. Negotiate a 12-month flexible space instead. Locking in 3 years of fixed costs when remote is working removes optionality you\'ll need if you need to cut costs.',
      option_better: 'Sign for a smaller space than originally planned — a hub for collaboration, not mandatory full-time presence.',
      option_good: 'Sign the original lease — in-person collaboration will prove its value within a year and you\'ll need the space.',
      option_worst: 'Go fully remote, cancel all office plans, and reinvest the savings into employee home office stipends.',
    },
  ],
  // Day 7
  [
    {
      category: 'Growth',
      prompt: 'An influencer with 2M followers wants to promote your product for free in exchange for equity. Do you give it?',
      option_best: 'Only if they genuinely use and love the product. Offer a small advisor equity stake (0.1-0.25%) vested over 2 years tied to deliverables. No equity without alignment and contractual obligations.',
      option_better: 'Offer a paid partnership first to test the relationship. Equity is forever — a campaign result you can evaluate in 30 days.',
      option_good: 'Give them 0.5% equity — a genuine 2M-follower endorsement is worth more than most Series A investments.',
      option_worst: 'Reject it — influencer marketing is shallow and equity is too precious to give away for social media posts.',
    },
    {
      category: 'Team Management',
      prompt: 'Your company has grown from 5 to 50 people in 18 months. Communication is breaking down and decisions are slow. What do you change?',
      option_best: 'Implement a clear management layer (team leads), create written decision-making frameworks (who decides what), establish async-first communication norms, and run weekly all-hands with a structured format.',
      option_better: 'Hire a COO or Chief of Staff to handle operational coordination so you can stay focused on strategy.',
      option_good: 'Create more meetings — daily standups across teams and weekly cross-functional syncs will fix the communication gaps.',
      option_worst: 'Companies always go through growing pains. Trust that it will self-organize as the team matures.',
    },
    {
      category: 'Product Strategy',
      prompt: 'Customers are asking for a mobile app but your web app is still buggy. Do you build the app or fix the web product first?',
      option_best: 'Fix the web product. Shipping a mobile app with an unstable backend means two unstable products. Retention beats acquisition — fix what you have before expanding surface area.',
      option_better: 'Fix the critical bugs in the web app while having one engineer prototype the mobile app. Parallel progress on both.',
      option_good: 'Build the mobile app — it\'s what customers are asking for and modern users expect mobile-first products.',
      option_worst: 'Build both simultaneously using a React Native approach to share code between web and mobile.',
    },
  ],
  // Day 8-14 (Days 8 through 14 with 3 scenarios each)
  [
    { category: 'Crisis Management', prompt: 'Your SaaS platform goes down for 4 hours during a Monday morning peak. What do you do while the engineers are fixing it?', option_best: 'Post a status update within 15 minutes, give honest ETAs every 30 minutes, have the CEO personally email top 20 accounts, prepare a compensation offer before the outage is even fixed, and hold a public post-mortem within 48 hours.', option_better: 'Update the status page every 30 minutes, have customer success proactively reach out to affected enterprise clients, and offer SLA credits.', option_good: 'Let the engineering team focus on fixing the issue and publish a post-mortem afterward.', option_worst: 'Say nothing until it\'s fixed to avoid further panic.' },
    { category: 'Financial Decisions', prompt: 'You\'re profitable but growing slowly at 15% YoY. You could reinvest all profits to push growth to 40% YoY but risk profitability. What do you do?', option_best: 'Build a model. If your market window is closing or competitors are gaining ground, burn for growth. If the market is stable and you\'re winning, profitable growth compounds more safely. The answer is in the data.', option_better: 'Take a middle path — reinvest 60% of profits, maintain 40% margin of safety. Push growth to 25-30% without existential risk.', option_good: 'Burn for growth. 40% YoY changes your company\'s trajectory and valuation. You can return to profitability later.', option_worst: 'Stay profitable. Profitability is the only honest signal of business health.' },
    { category: 'HR & Culture', prompt: 'Half your engineering team threatens to quit if you mandate returning to the office 3 days a week. What do you do?', option_best: 'Listen first. Run anonymous surveys, hold 1:1s, understand the real concerns. Then make a data-driven policy — perhaps office days for collaboration only, never mandate heads-down work in-office. Co-create the policy with the team.', option_better: 'Keep it remote but create optional in-person "collab days" quarterly. Don\'t mandate what you don\'t need to.', option_good: 'Hold firm on 3 days — culture and collaboration matter and the team will adapt. If some leave, you\'ll hire people who value in-person.', option_worst: 'Cancel the mandate immediately — losing half your engineering team would be catastrophic.' },
  ],
  [
    { category: 'Marketing', prompt: 'Your NPS score drops from 65 to 45 after a pricing change. What\'s your first move?', option_best: 'Don\'t guess — call the 20 most recently churned customers and the 20 who gave you a low NPS score. Understand the exact objection before changing pricing or product strategy.', option_better: 'Send a survey to all customers explaining the pricing rationale and asking for specific feedback on what\'s not working.', option_good: 'Offer a grandfather pricing plan to your existing customers to stop the NPS decline.', option_worst: 'Revert the pricing change — an NPS drop of 20 points is a clear signal it was a mistake.' },
    { category: 'Sales Strategy', prompt: 'You\'re choosing between two distribution models: direct sales with high margins or a channel partner model with 30% revenue share but 5x reach. Which do you pick?', option_best: 'Direct first, always. Understand your customer deeply before intermediating the relationship. Once you have a repeatable playbook, then build a channel program that scales it.', option_better: 'Hybrid — direct sales for your top accounts, channel partners for SMB and geographic markets you can\'t cost-effectively reach.', option_good: 'Channel partners — 5x reach with shared risk is a better ROI than building a costly direct sales team.', option_worst: 'Direct sales only. Channel partners always underperform and damage your brand.' },
    { category: 'Operations', prompt: 'You have the chance to acquire a small competitor for $500K. They have 200 customers and a product feature you\'ve been building for 6 months. Do you buy?', option_best: 'Do deep diligence first. Talk to 10 of their customers, audit their code, review their contracts for surprises. If retention is above 70% and the tech is clean, it\'s probably worth it. But integration always costs 2x what you expect.', option_better: 'Buy it — $500K for 200 customers and a feature you\'re already building is almost certainly cheaper than building and acquiring separately.', option_good: 'Negotiate down to $300K — a small competitor acquisition always has more leverage than they admit.', option_worst: 'Build your own feature and compete directly — acquisitions distract the team and rarely deliver the promised value.' },
  ],
  [
    { category: 'Team Management', prompt: 'Your head of marketing keeps missing deadlines despite multiple conversations. Your CMO says they\'re going through personal issues. How long do you wait?', option_best: 'Set a clear, documented 30-day improvement plan with specific deliverables. Offer support resources (EAP, reduced scope temporarily) and communicate consequences explicitly. Compassion and accountability aren\'t mutually exclusive.', option_better: 'Give them one more month with reduced responsibilities, check in weekly, and make the decision at the 30-day mark.', option_good: 'Give it 3 months — major personal issues take time to work through and a loyal employee deserves patience.', option_worst: 'Let the CMO handle it — you shouldn\'t be managing individual contributors at this company size.' },
    { category: 'Product Strategy', prompt: 'A major enterprise customer is asking for a custom feature that would take 3 months to build. They\'ll pay $300K for it. Your roadmap says no. What do you do?', option_best: 'Build it only if it belongs on your core product roadmap anyway. "Custom for one customer" becomes technical debt that slows you down for years. Take the money only if 10 other customers would use this feature too.', option_better: 'Take the deal with a contractual clause that the feature becomes part of the general product, not proprietary to them.', option_good: 'Reject it — custom work distracts your engineering team from building the product that serves all customers.', option_worst: 'Build it — $300K is hard to turn down and you can always generalize the feature for other customers later.' },
    { category: 'Financial Decisions', prompt: 'Your company needs to cut 20% of costs immediately. Where do you cut?', option_best: 'Start with software subscriptions, contractors, and travel. Then look at headcount — if cuts are unavoidable, do one big reduction rather than multiple small rounds. Survivors need certainty. And communicate everything transparently.', option_better: 'Cut software, contractors, and marketing spend before touching headcount. Preserve the core team at all costs.', option_good: 'Cut headcount first — it\'s the biggest cost lever and makes the financial impact immediately.', option_worst: 'Take an across-the-board 20% budget cut everywhere — it\'s the fairest approach.' },
  ],
  [
    { category: 'Growth', prompt: 'Your app has strong engagement but 60% of users never complete onboarding. What do you prioritize?', option_best: 'Fix onboarding before anything else. A 60% drop-off at onboarding means 60% of your acquisition spend is wasted. Interview 10 users who dropped off and 10 who completed it. The answer is in the gap.', option_better: 'Run A/B tests on the onboarding flow — cut steps by 50% and add a clear value demonstration within the first 60 seconds.', option_good: 'Add in-app tooltips and a guided product tour to help users through the onboarding steps.', option_worst: 'Focus on acquiring more users — the ones who make it through onboarding are your real customers anyway.' },
    { category: 'Crisis Management', prompt: 'A data breach exposes email addresses of 10,000 users. No financial data was taken. What do you do in the first 24 hours?', option_best: 'Notify all affected users within 24 hours (legally required in most jurisdictions), be completely transparent about what was taken and what wasn\'t, outline the steps you\'re taking, offer identity monitoring as a gesture, and publish a public post-mortem.', option_better: 'Notify users immediately, patch the vulnerability, engage a cybersecurity firm, and prepare for regulatory reporting requirements.', option_good: 'Fix the breach first, then notify users once you understand the full scope.', option_worst: 'Email addresses only — no financial data means minimal risk. Disclose only if legally required.' },
    { category: 'HR & Culture', prompt: 'A star employee tells you they\'re interviewing elsewhere because they feel underpaid. What do you do?', option_best: 'Have a direct conversation: understand their market research, benchmark against data you have, make a competitive offer immediately if the gap is real. Don\'t wait for them to have another offer in hand — retention is cheaper than replacement.', option_better: 'Do a market compensation analysis for their role, present the findings together, and adjust their salary to the 75th percentile if the data supports it.', option_good: 'Ask them what offer would make them stay and match it if it\'s within reason.', option_worst: 'If they\'re already interviewing, let them leave. Employees who shop their offers rarely stay loyal long-term.' },
  ],
  [
    { category: 'Marketing', prompt: 'You\'re launching a new product. Do you do a big splashy launch or a quiet beta with select users?', option_best: 'Quiet beta with 50-100 users first. Get real feedback, fix the critical issues, build genuine testimonials, then do the big launch with a product you\'re confident in. Launching broken products creates lasting reputation damage.', option_better: 'Waitlist + exclusive early access for 4 weeks, then a full public launch with real user stories and data from the beta.', option_good: 'Big launch immediately — you\'ve validated it enough internally and momentum matters. You can iterate publicly.', option_worst: 'Skip the launch entirely — let it grow organically through word of mouth.' },
    { category: 'Sales Strategy', prompt: 'A customer wants to cancel their annual contract halfway through, citing a change in their budget. How do you handle it?', option_best: 'Schedule a call within 24 hours. Understand the real reason (budget issues are often proxies for value concerns). Offer to right-size the plan, pause instead of cancel, or connect them with your success team. Save the relationship, not just the revenue.', option_better: 'Offer a plan reduction to retain the customer — half the revenue is better than zero and a cancellation.', option_good: 'Hold firm on the contract terms — annual contracts exist for a reason and exceptions set precedents.', option_worst: 'Let them cancel. If they don\'t value the product enough to fight for the budget, they\'ll churn at renewal anyway.' },
    { category: 'Operations', prompt: 'Your engineering team is shipping slowly due to excessive meetings. What do you change?', option_best: 'Implement a no-meeting core block (e.g., 10am-2pm), audit every recurring meeting (cancel anything without a clear owner and outcome), switch to async-first for status updates, and protect maker time explicitly in company policy.', option_better: 'Institute two "no meeting" days per week and require all meetings to have a written agenda sent 24 hours in advance.', option_good: 'Ask managers to reduce their meeting load by 30% and trust the team to self-organize.', option_worst: 'Cancel all meetings and communicate everything via Slack — engineers will figure out how to coordinate.' },
  ],
  // Days 15-19 more scenarios
  [
    { category: 'Product Strategy', prompt: 'Users love your product but complain it\'s too complex. A competitor just launched a simpler alternative. Do you simplify or add more power features?', option_best: 'Simplify the surface, not the power. Redesign the default experience to be dead simple while keeping advanced features accessible behind progressive disclosure. Don\'t remove capability — hide complexity until users need it.', option_better: 'Run customer interviews to understand exactly what feels complex, then surgically simplify those specific areas.', option_good: 'Add more power features — your users who complain about complexity are not your real power users anyway.', option_worst: 'Rebuild from scratch with a simpler architecture — partial fixes won\'t solve a fundamental design problem.' },
    { category: 'Financial Decisions', prompt: 'You can spend $200K on a PR firm for 6 months or invest the same amount into product improvements. Which drives more growth?', option_best: 'Invest in product. PR without a strong product creates a spike, not sustainable growth. But audit first — if your NPS is above 50 and you have compelling stories, PR can amplify. If NPS is below 40, fix the product first.', option_better: 'Split $150K product, $50K PR. Great PR about a great product compounds. Either alone is less effective.', option_good: 'PR — you have a good product but nobody knows about it. Distribution beats product improvements at your stage.', option_worst: 'Neither. Save the cash and focus on organic channels until you\'ve proven what messaging resonates.' },
    { category: 'Team Management', prompt: 'Your CTO wants to rewrite your entire codebase because it\'s "unmaintainable." It would take 12 months and pause feature development. Do you approve it?', option_best: 'Almost never approve a full rewrite. Instead, identify the top 3 most painful areas and refactor them incrementally while still shipping features. Full rewrites that take 12 months rarely finish in 12 months and the new codebase has its own problems.', option_better: 'Approve a parallel rewrite for the most critical modules only. Run the new and old systems in parallel.', option_good: 'Approve it — technical debt compounds and 12 months of pain is better than 5 years of slow shipping.', option_worst: 'Reject it outright and hire more engineers to work around the bad code.' },
  ],
  [
    { category: 'HR & Culture', prompt: 'You want to build a high-performance culture but your current team is used to a relaxed pace. How do you raise the bar without losing the team?', option_best: 'Be explicit about the shift — share the why, set clear new expectations, model the behavior yourself, and give people 90 days to adapt. Then make the hard calls on those who can\'t. Gradual undeclared cultural shifts create confusion and resentment.', option_better: 'Hire 2-3 high-performers externally who embody the new culture. The existing team adapts to the standard set by peers.', option_good: 'Introduce OKRs and performance reviews — structure creates accountability without a confrontational culture shift.', option_worst: 'Change happens slowly — just set higher targets and let the team naturally rise to meet them over 12-18 months.' },
    { category: 'Growth', prompt: 'You\'re choosing between expanding to a new geography or deepening market share in your existing market. Your current market share is 15%. What do you do?', option_best: 'Deepen first. 15% market share means 85% of your market doesn\'t use you. Expand geographically only when you\'ve hit diminishing returns in your core market or when a specific geography pulls you in with clear demand signals.', option_better: 'Both — open one international market with a lean team while continuing to grow domestically. Portfolio strategy reduces risk.', option_good: 'Expand geographically — new markets unlock new revenue streams and diversify your customer base.', option_worst: 'Focus on international first — domestic competition is too fierce at 15% share.' },
    { category: 'Crisis Management', prompt: 'Your key executive (CFO) is arrested for unrelated personal charges. They maintain innocence. What do you do?', option_best: 'Place them on paid administrative leave immediately pending resolution. Protect the company — you can\'t have an active CFO whose legal situation creates financial reporting uncertainty. Communicate minimally and factually to staff.', option_better: 'Consult with your board and legal counsel within 24 hours, then make a joint decision on administrative leave.', option_good: 'Allow them to continue working remotely while the situation unfolds — innocent until proven guilty.', option_worst: 'Terminate immediately — the optics of keeping them on are too damaging regardless of guilt.' },
  ],
  [
    { category: 'Marketing', prompt: 'Your content marketing brings in 40% of leads but takes 60% of the marketing budget. Paid ads bring 60% of leads at 40% of budget. Do you shift budget to ads?', option_best: 'Analyze lead quality, not just volume. If content leads have higher LTV, lower CAC, and better retention — keep investing in content. If paid leads convert and retain equally well, shift budget to ads. Volume means nothing without quality.', option_better: 'Shift 20% of content budget to ads and measure the quality difference over 90 days before making a bigger decision.', option_good: 'Shift budget to ads immediately — the ROI math is clear and efficiency matters.', option_worst: 'Cut ads entirely — paid growth is rented, content is owned. Always invest in owned channels.' },
    { category: 'Product Strategy', prompt: 'You\'re deciding between building a native iOS/Android app or improving the Progressive Web App (PWA). Development resources are limited.', option_best: 'Depends on your users. Check your analytics — if 70%+ access via mobile browser, improve the PWA first. Native apps are only essential when you need offline functionality, push notifications, or device integrations. Don\'t assume native is better.', option_better: 'Build iOS first (higher monetization rates), then Android. A polished native app on one platform beats a mediocre PWA.', option_good: 'Improve the PWA — it works on all devices and avoids app store dependency and 30% revenue cuts.', option_worst: 'Build both native apps simultaneously using React Native — sharing code makes it almost as fast as one.' },
    { category: 'Financial Decisions', prompt: 'Interest rates are high. You can pay off your $1M venture debt early (saving $150K in interest) or keep the cash as runway. What do you do?', option_best: 'Keep the cash. In an uncertain environment, liquidity is more valuable than interest savings. $150K in interest is cheap insurance against a market downturn, slow fundraising round, or unexpected costs.', option_better: 'Pay off half the debt — reduce interest burden while maintaining meaningful cash reserves.', option_good: 'Pay it all off — interest savings are guaranteed returns. Use the improved balance sheet to negotiate a better next round.', option_worst: 'Take on more debt to fund growth while interest rates are still manageable.' },
  ],
  [
    { category: 'Sales Strategy', prompt: 'Your best salesperson is poaching clients to start their own competing firm. What do you do?', option_best: 'Consult with legal immediately about non-solicitation agreements they may have signed. Assign an account manager to every at-risk client today. Communicate proactively to clients about continuity. Then reflect on what drove them to leave.', option_better: 'Send a personal outreach to all their current accounts from the CEO to retain the relationship. File legal action only if they actually breach the non-solicitation.', option_good: 'Let them go — clients who leave for a competitor weren\'t loyal to you, they were loyal to the person.', option_worst: 'Immediately sue for breach of contract and make an example to deter future defections.' },
    { category: 'Operations', prompt: 'Your startup is considering ISO 27001 certification. It costs $100K and takes 9 months. Is it worth it?', option_best: 'Only if enterprise customers are requiring it for procurement sign-off. If security certification is a blocker on 3+ deals in your pipeline, do it. If not, invest the $100K in actually improving your security posture instead of the paperwork.', option_better: 'Get it — enterprise sales cycles include security reviews and ISO 27001 removes a 6-week obstacle from every deal.', option_good: 'Skip it for now — most customers don\'t require it and SOC 2 Type II is more commonly requested anyway.', option_worst: 'Don\'t bother with certifications — they\'re bureaucratic theater that doesn\'t make you actually more secure.' },
    { category: 'Growth', prompt: 'A viral social media trend is loosely related to your product. Do you jump on it with a campaign?', option_best: 'Only if it\'s authentically connected to your product and brand. Forced trend-jacking looks desperate and can backfire badly. If your team has a genuinely funny or relevant angle that takes under 2 hours to execute — do it. Otherwise, pass.', option_better: 'Move fast but stay on brand — create something in the next 4 hours or the moment will pass.', option_good: 'Trends are for consumer brands. B2B companies that jump on viral trends look unprofessional.', option_worst: 'All-in — social virality is free distribution and you can\'t afford to miss it.' },
  ],
  [
    { category: 'Team Management', prompt: 'You need to lay off 10% of your team. How do you do it?', option_best: 'Do it once, do it cleanly. Prepare generous severance, give personal notice to each person individually (never in a group), be transparent about the reasons without over-explaining, provide references proactively, and give remaining employees a clear picture of the company\'s path forward the same day.', option_better: 'Small group sessions by team, offer 3 months severance, and allow laid-off employees to announce their own departure on their own timeline.', option_good: 'Do an async announcement via email — it\'s less painful for everyone and gives people space to process privately.', option_worst: 'Lay off 10% now, then another 5% in 3 months if needed — small cuts are less disruptive.' },
    { category: 'Product Strategy', prompt: 'Your free tier has 100,000 users but only 2% convert to paid. Industry average is 5%. What do you do?', option_best: 'Interview 20 free users who have been on the plan for 3+ months and never converted. Understand what\'s blocking them — is your paid tier too expensive? Are free features too generous? Is the upgrade value proposition unclear? Fix the specific blocker, not the symptom.', option_better: 'Reduce free tier features to create stronger upgrade motivation while adding more value to paid tiers.', option_good: 'Run email nurture sequences that highlight paid features and create urgency through time-limited upgrade discounts.', option_worst: 'Kill the free tier entirely — 2% conversion means 98% of free users are freeloaders costing you server costs.' },
    { category: 'Financial Decisions', prompt: 'Your company has a chance to go public via SPAC. Your bankers say it\'s now or wait 2 years for a traditional IPO. What do you do?', option_best: 'Avoid SPACs unless your company is ready for public market scrutiny, you have predictable revenue, and the SPAC terms are genuinely favorable. SPACs often signal that a company couldn\'t get traditional IPO terms. Waiting for an IPO preserves credibility.', option_better: 'Evaluate the SPAC terms carefully — if the promote is under 20% and the pipe is clean, it can be a legitimate path.', option_good: 'Take the SPAC — 2 years is too long to wait and market windows close unpredictably.', option_worst: 'Always choose a traditional IPO — SPACs are for companies that can\'t qualify for a real IPO.' },
  ],
  // Days 25-29
  [
    { category: 'Crisis Management', prompt: 'A key customer who represents 35% of your revenue threatens to leave if you don\'t give them exclusive features for 6 months. What do you do?', option_best: 'Never give exclusivity to a customer who represents this much revenue — it\'s a trap. Counter with a dedicated success manager, quarterly business reviews, and a joint roadmap session. Reduce their concentration in your revenue mix by growing others faster.', option_better: 'Negotiate — offer a 90-day exclusivity window on features specifically built for their use case, not your core roadmap.', option_good: 'Give them what they want. 35% of revenue is too important to lose over principle.', option_worst: 'Diversify away from them immediately and let them leave — customer concentration is your fault, not theirs.' },
    { category: 'HR & Culture', prompt: 'You have two candidates for a senior role — an internal promotion vs an external hire with more experience. Which do you choose?', option_best: 'Default to internal promotion if the person is 80% ready. External hires take 6-12 months to ramp, cost more, and signal to your team that growth opportunities don\'t exist internally. Only go external if the skill gap is genuinely unbridgeable.', option_better: 'Promote internally but pair them with an experienced external advisor or fractional executive to fill the gaps.', option_good: 'Hire externally — you\'re paying for experience, and the internal candidate will have another opportunity later.', option_worst: 'Create a dual leadership structure and let both candidates share the role for 90 days before deciding.' },
    { category: 'Growth', prompt: 'Your churn rate is 8% monthly. At what point does it make sense to focus on reducing churn vs acquiring new customers?', option_best: 'At 8% monthly churn, you\'re replacing your entire customer base every 12 months. This is a crisis — stop acquisition spending immediately until you understand why people are leaving. You\'re pouring water into a bucket with a massive hole.', option_better: 'Split focus: 60% on churn reduction, 40% on acquisition. Both matter but churn has a higher ROI to fix.', option_good: 'Keep acquisition going — a bigger top of funnel compensates for churn and gives you more data on what segments retain.', option_worst: 'Focus purely on acquisition. You can fix churn once you\'ve achieved scale.' },
  ],
  [
    { category: 'Marketing', prompt: 'You discover a competitor is spreading misinformation about your product in online forums. You can prove it\'s false. How do you respond?', option_best: 'Respond publicly with evidence — a clear, professional post showing the facts. Don\'t attack the competitor by name. Let the truth speak for itself and let your community defend you. Document everything in case legal action becomes necessary.', option_better: 'Report the posts to the platform moderators, post your own factual content in the same forums, and have customers comment with their real experiences.', option_good: 'Ignore it — engaging amplifies reach and most people know to be skeptical of competitor attacks.', option_worst: 'Have your team upvote your responses and downvote the misinformation across all platforms.' },
    { category: 'Product Strategy', prompt: 'AI is disrupting your category. A startup launched an AI-native competitor 6 months ago and is growing fast. Do you pivot to AI or stay the course?', option_best: 'Neither extreme. Identify the 2-3 highest-value workflows in your product and integrate AI to make them dramatically better. Don\'t rebuild everything — AI-wash selectively and well, then measure if retention and activation improve.', option_better: 'Start a separate AI product as a standalone experiment. Keep the core product stable while testing the new direction.', option_good: 'Full pivot to AI — companies that don\'t lead the transition will be displaced by those who do.', option_worst: 'Stay the course — AI hype cycles always correct and fundamentals win long-term.' },
    { category: 'Operations', prompt: 'You\'re choosing your company\'s first CRM. Salesforce costs $50K/year but scales infinitely. HubSpot costs $12K/year and covers 90% of your needs now. What do you pick?', option_best: 'HubSpot. Don\'t buy infrastructure for the company you want to be — buy for who you are today. The cost difference is $38K/year which is better spent on people or product. Migrate to Salesforce when HubSpot genuinely can\'t serve you.', option_better: 'HubSpot with a clear migration plan documented for when you cross $10M ARR or 25 sales reps.', option_good: 'Salesforce — migrating CRMs is painful and expensive. Pay the premium now and never deal with it again.', option_worst: 'Build your own CRM on top of Airtable or Notion — it\'s more flexible and you control the data.' },
  ],
  [
    { category: 'Team Management', prompt: 'Your remote team across 4 time zones is struggling to collaborate. What structure do you implement?', option_best: 'Establish a 3-4 hour daily overlap window that works across all zones, make all decisions async by default (documented in Notion/Confluence), reserve real-time meetings for high-bandwidth conversations only, and create explicit working hours norms for each region.', option_better: 'Consolidate hiring into 2 overlapping time zones and gradually restructure regional teams around those hubs.', option_good: 'Require all team members to have a minimum 6-hour overlap with US Eastern time, regardless of location.', option_worst: 'Let each region work independently and sync weekly — trying to create overlap just frustrates everyone.' },
    { category: 'Financial Decisions', prompt: 'A strategic acquirer offers to buy your company for $50M. Your last round valued you at $40M. Your investors are excited but you believe you\'re worth $200M in 3 years. What do you do?', option_best: 'Explore it seriously but don\'t decide based on emotion. Model 3 scenarios: acqui-hire terms, strategic vs financial acquirer differences, and your realistic probability of hitting $200M. The question isn\'t "can we be worth $200M" — it\'s "what\'s the expected value of both paths."', option_better: 'Counter at $80M — the first offer is always low and a motivated buyer will negotiate. If they walk, that tells you something.', option_good: 'Reject it and run the company — $200M in 3 years is better than $50M now if you believe the trajectory.', option_worst: 'Accept immediately — $50M is life-changing money and the future is always uncertain.' },
    { category: 'Sales Strategy', prompt: 'Your sales cycle is averaging 6 months for enterprise deals. How do you shorten it?', option_best: 'Map every stage where deals stall. Common culprits: procurement/legal review, unclear champion, no urgency, multiple approvers. Then systematically remove each blocker — offer mutual action plans, engage procurement early, create economic urgency with pricing tiers tied to quarter-end.', option_better: 'Offer a paid proof-of-concept at 50% of contract value that converts to full contract automatically — it bypasses the slow approval process.', option_good: 'Focus sales resources on mid-market instead of enterprise — shorter cycles, faster learning, less dependency on any single deal.', option_worst: 'Give end-of-quarter discounts to create urgency and compress the timeline artificially.' },
  ],
  [
    { category: 'Growth', prompt: 'You\'re entering a market where the #1 player has 60% market share. What\'s your go-to-market strategy?', option_best: 'Don\'t compete with the market leader on their terms. Find the customer segment they underserve (usually SMB, a specific vertical, or a geography), own that niche completely, build a moat there, and expand from a position of strength.', option_better: 'Lead with price — undercut the market leader by 40% to win initial customers and build volume before raising prices.', option_good: 'Compete on product quality — build a demonstrably better product and let word of mouth pull customers away from the incumbent.', option_worst: 'Avoid this market entirely — 60% market share means the winner has already been decided.' },
    { category: 'HR & Culture', prompt: 'Two of your co-founders have an irreconcilable strategic disagreement about the company direction. You\'re the third co-founder and tiebreaker. What do you do?', option_best: 'Don\'t cast the deciding vote without data. Go to customers, go to advisors, build financial models. Make the decision on evidence, document the reasoning, and get both co-founders to commit publicly to the chosen direction even if they disagree. Unresolved founder conflict kills companies.', option_better: 'Call a board meeting and get external input before you vote — this is too important to decide without outside perspective.', option_good: 'Vote with whoever has the stronger business case and move forward quickly. Indecision is worse than a wrong decision.', option_worst: 'Suggest the disagreeing co-founder takes a sabbatical while you test both strategic hypotheses separately.' },
    { category: 'Crisis Management', prompt: 'You learn that one of your engineers has been downloading proprietary code to personal devices in violation of policy. How do you handle it?', option_best: 'Involve HR and legal immediately before confronting the employee. Secure evidence, assess what was taken and what the risk is, then conduct a formal investigation. Do not confront the employee directly until you\'ve secured systems and evidence.', option_better: 'Revoke system access immediately, then have a formal conversation with HR present to understand the intent.', option_good: 'Talk to them directly first — there may be an innocent explanation and formal processes can escalate unnecessarily.', option_worst: 'Terminate immediately for the policy violation and send a company-wide reminder about the policy.' },
  ],
  [
    { category: 'Product Strategy', prompt: 'Your product has accumulated significant technical debt. Engineers say they\'re spending 60% of their time on bug fixes instead of features. How do you address it?', option_best: 'Formalize a "20% time for debt reduction" rule every sprint — don\'t let engineers choose, mandate it. Track debt as a first-class metric alongside features shipped. Don\'t do a big-bang cleanup; make incremental debt reduction part of every engineer\'s daily job.', option_better: 'Declare a "debt sprint" every quarter — 4 weeks where no features are shipped and the entire team focuses on code quality.', option_good: 'Hire more engineers to absorb the bug-fixing load so others can focus on features.', option_worst: 'Accept technical debt as a cost of moving fast — slow down to fix it only when customers are directly impacted.' },
    { category: 'Marketing', prompt: 'You have the chance to be featured in a top-tier tech publication. The journalist wants an exclusive 48 hours before you announce. Do you give it?', option_best: 'Yes — exclusives get better coverage, more prominent placement, and the journalist is invested in making it a good story. Just ensure you have announcement materials ready to go exactly when the embargo lifts so you can amplify across all channels simultaneously.', option_better: 'Yes but get editorial review rights and agree on specific quotes to be used.', option_good: 'Decline the exclusive but offer them the embargo — you want all outlets to publish simultaneously for maximum impact.', option_worst: 'Decline entirely — giving one publication exclusive access is unfair to your other media relationships.' },
    { category: 'Financial Decisions', prompt: 'Your biggest customer wants net-60 payment terms instead of the net-30 you currently offer. They represent 25% of revenue. Do you agree?', option_best: 'Agree only with a cash flow plan. Negotiate: net-60 in exchange for a 2-year contract commitment and a 10% price increase. Then use invoice factoring or a line of credit to bridge the 30-day gap — don\'t let payment terms become a cash crisis.', option_better: 'Agree to net-45 as a compromise and offer a 2% early payment discount as an incentive.', option_good: 'Hold firm on net-30. Extending payment terms for one customer creates precedent and cash flow problems.', option_worst: 'Agree immediately — keeping a customer who represents 25% of revenue is worth any flexibility.' },
  ],
];

async function seed() {
  console.log('Starting scenario seed...');
  let totalWritten = 0;
  
  for (let day = 0; day < scenarioSets.length; day++) {
    const dateStr = getDateStr(day);
    const scenarios = scenarioSets[day];
    
    for (const scenario of scenarios) {
      const docRef = db.collection('quizzes').doc();
      await docRef.set({
        ...scenario,
        active_date: dateStr,
        created_at: new Date().toISOString(),
      });
      totalWritten++;
      console.log(`✅ Day ${day} (${dateStr}) — ${scenario.category}: ${scenario.prompt.slice(0, 50)}...`);
    }
  }

  console.log(`\n🎉 Done! Wrote ${totalWritten} scenarios across ${scenarioSets.length} days.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
