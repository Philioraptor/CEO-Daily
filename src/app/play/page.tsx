"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Share, Trophy, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Play() {
  const { token } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the current question
  const [submitting, setSubmitting] = useState(false);
  
  // End of day state
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    // Check results first, maybe they already finished today
    fetch('/api/results/today', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.is_completed) {
          setResults(data);
          setIsFinished(true);
          setLoading(false);
        } else {
          // Fetch scenarios
          fetch('/api/scenarios/today', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => {
              if (data.scenarios && data.scenarios.length > 0) {
                // If they have already completed some, we should ideally skip them. 
                // But /api/scenarios/today doesn't filter out completed ones in the current MVP backend.
                // For simplicity, we assume they start from 0 if they haven't finished all 3.
                // In a robust implementation, the backend would return only uncompleted scenarios, or we fetch their scores.
                setScenarios(data.scenarios);
              } else {
                setError("No scenarios available for today.");
              }
              setLoading(false);
            })
            .catch(err => {
              console.error(err);
              setError("Failed to load scenarios.");
              setLoading(false);
            });
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load state.");
        setLoading(false);
      });
  }, [token]);

  const handleSelect = async (optionId: string) => {
    if (submitting || isFinished) return;
    setSubmitting(true);

    const scenarioId = scenarios[currentIndex].id;

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scenario_id: scenarioId,
          chosen_option: optionId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already submitted, we should just move to the next one
          console.log("Already submitted this one");
        } else {
          throw new Error(data.error || "Failed to submit");
        }
      }

      // Check if this was the last scenario
      if (currentIndex === scenarios.length - 1 || (data.scenarios_completed_today === 3)) {
        // Fetch final results
        const resResults = await fetch('/api/results/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resultsData = await resResults.json();
        setResults(resultsData);
        setIsFinished(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-6"><Zap className="animate-pulse text-[var(--color-accent-primary)]" size={32} /></div>;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/60 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary">Go Home</Button>
      </div>
    );
  }

  if (isFinished && results) {
    // Determine color based on tier
    const getTierColor = (tier: string) => {
      switch (tier) {
        case 'Visionary': return 'text-[var(--color-accent-success)] border-[var(--color-accent-success)]';
        case 'Operator': return 'text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]';
        case 'Firefighter': return 'text-[var(--color-accent-warn)] border-[var(--color-accent-warn)]';
        case 'Liquidator': return 'text-[var(--color-accent-danger)] border-[var(--color-accent-danger)]';
        default: return 'text-white border-white/20';
      }
    };

    const tierColorClass = getTierColor(results.tier);

    return (
      <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-700">
        <header className="flex justify-between items-center mt-4">
          <Link href="/" className="text-white/50 hover:text-white"><ArrowLeft size={24} /></Link>
          <span className="font-bold">Daily Summary</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-8 text-center">
          <div>
            <p className="text-white/60 uppercase tracking-widest text-sm font-semibold mb-2">Company Health</p>
            <div className={`inline-block px-6 py-2 border-2 rounded-full font-bold text-xl uppercase tracking-wider ${tierColorClass}`}>
              {results.tier || 'Unknown'}
            </div>
          </div>

          {/* Simple simulated Gauge using a circle */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" 
                strokeDasharray="552" strokeDashoffset={552 - (552 * (Math.min(results.day_total, 300) / 300))}
                className={`${tierColorClass.split(' ')[0]} transition-all duration-1500 ease-out`} />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold">{results.day_total}</span>
              <span className="text-sm text-white/50">/ 300 pts</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full">
            <span className="text-white/70">Streak</span>
            <span className="font-bold text-[var(--color-accent-warn)]">{results.streak_count}</span>
            <span className="text-xs text-[var(--color-accent-success)] font-bold">+1</span>
          </div>

          <div className="w-full space-y-3 pt-6">
            <Button className="w-full" size="lg" onClick={() => alert("Sharing not implemented in MVP")}>
              <Share className="mr-2" size={18} /> Share Result
            </Button>
            <Link href="/leaderboard" className="block w-full">
              <Button variant="secondary" className="w-full" size="lg">
                <Trophy className="mr-2" size={18} /> See Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) return null;

  const currentScenario = scenarios[currentIndex];

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right-8 duration-300 relative z-10 bg-[var(--color-bg-base)] pb-24">
      {/* Top progress indicator */}
      <header className="flex justify-between items-center mt-4 mb-8">
        <Link href="/" className="text-white/50 hover:text-white"><ArrowLeft size={24} /></Link>
        <div className="flex space-x-2">
          {scenarios.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-8 rounded-full transition-colors ${idx === currentIndex ? 'bg-[var(--color-accent-primary)]' : idx < currentIndex ? 'bg-white/40' : 'bg-white/10'}`} 
            />
          ))}
        </div>
        <div className="w-6" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col">
        <p className="text-xs text-[var(--color-accent-primary)] uppercase tracking-wider font-bold mb-3">
          {currentScenario.category.replace('_', ' ')}
        </p>
        
        <h2 className="text-2xl leading-snug font-semibold mb-8">
          {currentScenario.prompt}
        </h2>

        <div className="space-y-3 mt-auto">
          {currentScenario.options.map((option: any, index: number) => (
            <button
              key={index}
              disabled={submitting}
              onClick={() => handleSelect(option.id)}
              className="w-full text-left bg-[var(--color-bg-panel)] border border-white/5 hover:border-[var(--color-accent-primary)]/50 hover:bg-white/5 transition-all p-5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <p className="text-sm font-medium leading-relaxed group-hover:text-white text-white/90">
                {option.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
