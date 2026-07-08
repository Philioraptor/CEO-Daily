"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";

type WindowType = 'daily' | 'weekly' | 'monthly';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
}

interface UserStatus {
  rank: number | null;
  score: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [activeWindow, setActiveWindow] = useState<WindowType>('daily');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const freshToken = await user.getIdToken(true);
        const res = await fetch(`/api/leaderboard/${activeWindow}`, {
          headers: { Authorization: `Bearer ${freshToken}` }
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || 'Failed to load leaderboard');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setUserStatus(data.user_status || null);
      } catch (err) {
        console.error('[leaderboard] fetch error:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeWindow, user]);

  const isCurrentUserInTop100 = leaderboard.some(entry => entry.user_id === user?.uid);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-[var(--color-bg-base)]">
      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
      </header>

      {/* Segmented Control */}
      <div className="flex p-1 bg-[var(--color-bg-panel)] rounded-xl border border-white/10">
        {(['daily', 'weekly', 'monthly'] as WindowType[]).map((w) => (
          <button
            key={w}
            onClick={() => setActiveWindow(w)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeWindow === w ? 'bg-[var(--color-accent-primary)] text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="flex-1 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10 text-sm">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-white/50">No scores yet for this period.</p>
            <p className="text-white/30 text-sm">Complete today&apos;s scenarios to appear here!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.user_id === user?.uid;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/50'
                      : 'bg-[var(--color-bg-panel)]/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-7 text-center font-bold text-sm ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-slate-300' :
                      entry.rank === 3 ? 'text-amber-600' :
                      'text-white/40'
                    }`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </span>
                    <span className={`font-medium ${isMe ? 'text-[var(--color-accent-primary)]' : 'text-white'}`}>
                      {entry.display_name} {isMe && <span className="text-xs text-white/40">(you)</span>}
                    </span>
                  </div>
                  <span className="font-bold">
                    {entry.score} <span className="text-[10px] text-white/40 font-normal ml-1">pts</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pinned User Row at Bottom */}
      {!loading && !isCurrentUserInTop100 && userStatus?.rank && (
        <div className="fixed bottom-[80px] left-0 right-0 z-40 px-6">
          <div className="max-w-md mx-auto">
            <GlassCard className="flex items-center justify-between p-4 bg-[var(--color-accent-primary)]/20 border-[var(--color-accent-primary)] shadow-2xl backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <span className="w-7 text-center font-bold text-white/60 text-sm">#{userStatus.rank}</span>
                <span className="font-bold text-white">You</span>
              </div>
              <span className="font-bold">
                {userStatus.score} <span className="text-[10px] text-white/40 font-normal ml-1">pts</span>
              </span>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
