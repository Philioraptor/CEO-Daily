"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { User, LogOut, Award, Flame, Target } from "lucide-react";

export default function Profile() {
  const { token, user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        // Always get a fresh token to avoid expiry errors
        const freshToken = await user.getIdToken(true);

        const res = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${freshToken}` }
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('Profile fetch error:', res.status, errData);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setSocialHandle(data.social_handle || '');
      } catch (err) {
        console.error('Profile fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const freshToken = await user!.getIdToken(true);
      const res = await fetch('/api/profile/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`
        },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          social_handle: socialHandle
        })
      });

      if (!res.ok) throw new Error("Failed to save");
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Update local profile state
      setProfile((prev: any) => ({
        ...prev,
        display_name: displayName,
        bio,
        social_handle: socialHandle
      }));
    } catch (err) {
      console.error(err);
      setSaveError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-[var(--color-bg-base)]">
      <header className="mt-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-white/50 hover:text-white">
          <LogOut size={20} />
        </Button>
      </header>

      {loading ? (
        <div className="text-center text-white/50 py-10">Loading profile...</div>
      ) : !profile ? (
        <div className="text-center text-[var(--color-accent-danger)] py-10">Failed to load profile. Please try refreshing.</div>
      ) : (
        <>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-24 h-24 rounded-full bg-[var(--color-bg-panel)] flex items-center justify-center border-4 border-[var(--color-accent-primary)]/20 mb-4">
                <User size={48} className="text-[var(--color-accent-primary)]" />
              </div>
              <h2 className="text-xl font-bold">{profile.display_name || user?.email?.split('@')[0]}</h2>
              <p className="text-white/50 text-sm mt-1">{user?.email}</p>
              
              {profile.social_handle && (
                <a href={`https://twitter.com/${profile.social_handle}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-primary)] text-sm font-medium mt-2 hover:underline">
                  @{profile.social_handle}
                </a>
              )}
              
              {profile.bio && (
                <p className="mt-4 text-white/80 text-sm max-w-sm italic">
                  &quot;{profile.bio}&quot;
                </p>
              )}
            </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-5 flex flex-col items-center justify-center text-center space-y-2">
              <Award className="text-[var(--color-accent-warn)]" size={28} />
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total Points</p>
              <p className="text-2xl font-bold">{profile.total_points}</p>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col items-center justify-center text-center space-y-2">
              <Flame className="text-[var(--color-accent-danger)]" size={28} />
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Current Streak</p>
              <p className="text-2xl font-bold">{profile.streak_count}</p>
            </GlassCard>
            
            <GlassCard className="p-5 flex flex-col items-center justify-center text-center space-y-2 col-span-2">
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Current Tier</p>
              <div className={`px-3 py-1 border rounded-full text-xs font-bold uppercase ${
                profile.current_tier === 'Visionary' ? 'text-[var(--color-accent-success)] border-[var(--color-accent-success)]' :
                profile.current_tier === 'Operator' ? 'text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]' :
                profile.current_tier === 'Firefighter' ? 'text-[var(--color-accent-warn)] border-[var(--color-accent-warn)]' :
                profile.current_tier === 'Liquidator' ? 'text-[var(--color-accent-danger)] border-[var(--color-accent-danger)]' :
                'text-white border-white/20'
              }`}>
                {profile.current_tier || 'Untested'}
              </div>
            </GlassCard>
          </div>

          <div className="pt-4 border-t border-white/10 mt-6">
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/40 border border-white/10 focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/40 border border-white/10 focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors h-24 resize-none"
                  placeholder="Tell everyone a bit about yourself..."
                  maxLength={160}
                />
                <p className="text-xs text-white/40 mt-1 text-right">{bio.length}/160</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Social Handle (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-white/40">@</span>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value.replace('@', ''))}
                    className="w-full p-3 pl-8 rounded-lg bg-black/40 border border-white/10 focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                    placeholder="twitter_handle"
                  />
                </div>
              </div>

              {saveError && <p className="text-[var(--color-accent-danger)] text-sm">{saveError}</p>}
              {saveSuccess && <p className="text-[var(--color-accent-success)] text-sm">Profile saved successfully!</p>}

              <Button type="submit" disabled={saving} className="w-full" size="lg">
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
