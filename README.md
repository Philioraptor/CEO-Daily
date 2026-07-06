<div align="center">
  <h1>CEO Daily</h1>
  <p><strong>A Gamified, Mobile-First Strategic Decision-Making Simulator</strong></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

## Overview

**CEO Daily** puts players directly into the shoes of a Chief Executive Officer. Every day, you face three high-stakes, realistic business scenarios. Your decisions dynamically impact your company's hypothetical valuation, your daily streak, and your global tier ranking—from a struggling **Liquidator** to a visionary **CEO**.

Designed with a sleek, constrained mobile-first interface, the application delivers a premium, native-app feel whether accessed on a smartphone or a desktop browser.

## Key Features

- **Daily Scenarios:** Three unique, time-sensitive business decisions presented every 24 hours.
- **Practice Mode (Archive):** Hone your skills by replaying past scenarios with immediate point feedback without risking your official leaderboard standing.
- **Tiers & Progression:** Rank up through dynamic tiers based on your performance: *Visionary, Operator, Firefighter, and Liquidator*.
- **Global Leaderboard:** Powered by Redis, instantly compare your cumulative score with other CEOs worldwide.
- **Profile Customization:** Personalize your executive presence by editing your display name, bio, and linking your social handles.
- **Mobile-First UX:** A beautifully constrained, dark-mode interface that simulates a native mobile experience on desktop and expands seamlessly on actual mobile devices.

## Tech Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS, Lucide Icons
- **Backend/API:** Next.js Serverless Route Handlers
- **Database & Authentication:** Firebase (Firestore & Firebase Auth)
- **High-Performance Leaderboard:** Upstash Redis (Sorted Sets)

## Getting Started

### Prerequisites
- Node.js (v20 or newer)
- A Firebase Project (with Firestore and Auth enabled)
- An Upstash Redis Database

### 1. Environment Setup
Create a `.env.local` file in the root directory and configure your keys:

```env
# Firebase Client (Public Auth & Setup)
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Firebase Admin (Secret - for secure backend operations)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"..."}'

# Upstash Redis (Secret - for the global leaderboard)
UPSTASH_REDIS_REST_URL="your_upstash_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
```

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/yourusername/ceo-daily.git
cd ceo-daily
npm install
```

### 3. Running Locally

Start the Next.js development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your browser to start making executive decisions.

## Deployment

This project is optimized for deployment on **Vercel**. 

1. Push your code to a GitHub repository.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Add all the environment variables from your `.env.local` file into the Vercel project settings.
5. Click **Deploy**.
