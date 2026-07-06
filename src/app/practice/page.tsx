"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Practice() {
  const { token } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for immediate feedback
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch('/api/scenarios/archive', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
        } else {
          setError("No practice scenarios available yet. Come back tomorrow!");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load practice scenarios.");
        setLoading(false);
      });
  }, [token]);

  const handleSelect = (optionId: string, points: number) => {
    if (feedbackVisible || isFinished) return;
    
    setSelectedOptionId(optionId);
    setTotalPoints(prev => prev + points);
    setFeedbackVisible(true);
  };

  const nextScenario = () => {
    if (currentIndex === scenarios.length - 1) {
      setIsFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setFeedbackVisible(false);
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

  if (isFinished) {
    let tier = 'Liquidator';
    const avg = totalPoints / scenarios.length;
    if (avg >= 80) tier = 'Visionary';
    else if (avg >= 50) tier = 'Operator';
    else if (avg >= 20) tier = 'Firefighter';

    return (
      <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-700">
        <header className="flex justify-between items-center mt-4">
          <Link href="/" className="text-white/50 hover:text-white"><ArrowLeft size={24} /></Link>
          <span className="font-bold">Practice Run Complete</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-8 text-center">
          <div>
            <p className="text-white/60 uppercase tracking-widest text-sm font-semibold mb-2">Hypothetical Tier</p>
            <div className="inline-block px-6 py-2 border-2 rounded-full font-bold text-xl uppercase tracking-wider text-white border-white/20">
              {tier}
            </div>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" 
                strokeDasharray="552" strokeDashoffset={552 - (552 * (Math.min(totalPoints, scenarios.length * 100) / (scenarios.length * 100)))}
                className="text-[var(--color-accent-primary)] transition-all duration-1500 ease-out" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold">{totalPoints}</span>
              <span className="text-sm text-white/50">/ {scenarios.length * 100} pts</span>
            </div>
          </div>
          
          <p className="text-white/50 text-sm max-w-xs mx-auto">
            This was a practice run. Your official leaderboard score and streak have not been affected.
          </p>

          <div className="w-full space-y-3 pt-6">
            <Button className="w-full" size="lg" onClick={() => window.location.reload()}>
              Practice Again
            </Button>
            <Link href="/" className="block w-full">
              <Button variant="secondary" className="w-full" size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) return null;

  const currentScenario = scenarios[currentIndex];

  const getBorderColor = (option: any) => {
    if (!feedbackVisible) return 'border-white/5 hover:border-[var(--color-accent-primary)]/50 hover:bg-white/5';
    if (option.id === 'best') return 'border-[var(--color-accent-success)] bg-[var(--color-accent-success)]/10';
    if (option.id === selectedOptionId) return 'border-[var(--color-accent-danger)] bg-[var(--color-accent-danger)]/10';
    return 'border-white/5 opacity-50';
  };

  const getPointsText = (option: any) => {
    if (option.id === 'best') return '+100 (Best)';
    if (option.id === 'better') return '+50 (Better)';
    if (option.id === 'good') return '+20 (Good)';
    return '0 (Worst)';
  };

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right-8 duration-300 relative z-10 bg-[var(--color-bg-base)] pb-24">
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
        <div className="w-6 text-[var(--color-accent-primary)] font-bold text-sm">
          {totalPoints}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-[var(--color-accent-primary)] uppercase tracking-wider font-bold">
            {currentScenario.category.replace('_', ' ')} (PRACTICE)
          </p>
        </div>
        
        <h2 className="text-2xl leading-snug font-semibold mb-8">
          {currentScenario.prompt}
        </h2>

        <div className="space-y-3 mt-auto">
          {currentScenario.options.map((option: any, index: number) => (
            <button
              key={index}
              disabled={feedbackVisible}
              onClick={() => handleSelect(option.id, option.points)}
              className={`w-full text-left bg-[var(--color-bg-panel)] border transition-all p-5 rounded-2xl group ${getBorderColor(option)}`}
            >
              <div className="flex justify-between items-center gap-4">
                <p className={`text-sm font-medium leading-relaxed flex-1 ${feedbackVisible && option.id === 'best' ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                  {option.text}
                </p>
                {feedbackVisible && (
                  <span className={`text-xs font-bold whitespace-nowrap ${option.id === 'best' ? 'text-[var(--color-accent-success)]' : option.id === selectedOptionId ? 'text-[var(--color-accent-danger)]' : 'text-white/40'}`}>
                    {getPointsText(option)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {feedbackVisible && (
          <div className="mt-6">
            <Button className="w-full" size="lg" onClick={nextScenario}>
              Next Scenario
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
