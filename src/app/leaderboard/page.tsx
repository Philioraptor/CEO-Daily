"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";

type WindowType = 'daily' | 'weekly' | 'monthly';

export default function Leaderboard() {
  const { token, user } = useAuth();
  const [window, setWindow] = useState<WindowType>('daily');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch(`/api/leaderboard/${window}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setUserStatus(data.user_status || null);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [window, token]);

  // Check if current user is in the top 100 to avoid double-rendering their row at the bottom
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
            onClick={() => setWindow(w)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              window === w ? 'bg-[var(--color-accent-primary)] text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="flex-1 pb-16">
        {loading ? (
          <div className="text-center text-white/50 py-10">Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-white/50 py-10">No scores yet for this window.</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.user_id === user?.uid;
              return (
                <div 
                  key={entry.user_id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isMe ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/50' : 'bg-[var(--color-bg-panel)]/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-6 text-center font-bold ${
                      entry.rank <= 3 ? 'text-[var(--color-accent-warn)]' : 'text-white/40'
                    }`}>{entry.rank}</span>
                    <span className={`font-medium ${isMe ? 'text-[var(--color-accent-primary)]' : 'text-white'}`}>
                      {entry.display_name}
                    </span>
                  </div>
                  <span className="font-bold">{entry.score} <span className="text-[10px] text-white/40 font-normal ml-1">pts</span></span>
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
                <span className="w-6 text-center font-bold text-white/60">{userStatus.rank}</span>
                <span className="font-bold text-white">You</span>
              </div>
              <span className="font-bold">{userStatus.score} <span className="text-[10px] text-white/40 font-normal ml-1">pts</span></span>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
