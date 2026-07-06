"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Flame, Activity, User } from "lucide-react";

export default function Home() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch('/api/profile/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* Header section */}
      <header className="flex justify-between items-center mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CEO-Daily</h1>
          <p className="text-sm text-white/60">{today}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/profile" className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full">
            <span className="text-sm font-medium">{stats?.display_name || 'CEO'}</span>
            <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center">
              <User size={14} className="text-[var(--color-accent-primary)]" />
            </div>
          </Link>
          <div className="flex items-center space-x-1.5 text-[var(--color-accent-warn)]">
            <Flame size={20} fill="currentColor" />
            <span className="font-bold text-lg">{loading ? '-' : stats?.streak_count || 0}</span>
          </div>
        </div>
      </header>

      {/* Hero Card */}
      <div className="flex-1 flex flex-col justify-center py-10">
        <div className="relative group">
          {/* Pulsing glow effect behind the card */}
          <div className="absolute -inset-1 bg-[var(--color-accent-primary)] rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
          
          <GlassCard className="relative z-10 p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center text-[var(--color-accent-primary)] mb-2">
              <Activity size={32} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Today&apos;s Challenge</h2>
              <p className="text-white/70">Three high-stakes decisions. Will your company thrive or face liquidation?</p>
            </div>

            <div className="w-full mt-4 space-y-3">
              <Link href="/play" className="block w-full">
                <Button size="lg" className="w-full text-lg shadow-[0_0_20px_rgba(91,140,255,0.3)]">
                  Start Scenarios
                </Button>
              </Link>
              <Link href="/practice" className="block w-full">
                <Button variant="secondary" size="lg" className="w-full text-lg">
                  Practice Past Scenarios
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Status */}
      <div className="pb-8">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Current Health</p>
            <p className="text-lg font-bold">
              {loading ? '...' : stats?.current_tier || 'Untested'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total Points</p>
            <p className="text-lg font-bold">{loading ? '...' : stats?.total_points || 0}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
