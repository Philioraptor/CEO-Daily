"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthView = "login" | "signup" | "forgot" | "verify";

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found": return "No account found with this email.";
    case "auth/wrong-password": return "Incorrect password.";
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    case "auth/invalid-credential": return "Invalid email or password.";
    default: return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth UI state
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        // If user just signed up and hasn't verified yet
        if (!currentUser.emailVerified) {
          setView("verify");
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setView("login");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        setView("verify");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      setView("verify");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setAuthLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    try {
      await sendEmailVerification(user);
      setSuccess("Verification email sent! Check your inbox.");
    } catch {
      setError("Failed to send verification email. Try again shortly.");
    }
  };

  const checkVerification = async () => {
    if (!user) return;
    await user.reload();
    if (user.emailVerified) {
      setView("login");
      // Force re-auth check
      const idToken = await user.getIdToken(true);
      setToken(idToken);
    } else {
      setError("Email not verified yet. Please check your inbox.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show app if user is logged in AND verified
  if (user && user.emailVerified) {
    return (
      <AuthContext.Provider value={{ user, signOut, token }}>
        {children}
      </AuthContext.Provider>
    );
  }

  const inputClass = "w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors text-sm placeholder:text-white/30";
  const btnClass = "w-full py-3 bg-[var(--color-accent-primary)] hover:opacity-90 text-white font-semibold rounded-xl transition-all disabled:opacity-40 text-sm";
  const ghostBtn = "text-sm text-white/50 hover:text-white transition-colors";

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--color-bg-base)]">
      <div className="w-full max-w-sm bg-[var(--color-bg-panel)]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">CEO Daily</h1>
          <p className="text-white/40 text-sm mt-1">
            {view === "login" && "Sign in to your account"}
            {view === "signup" && "Create your account"}
            {view === "forgot" && "Reset your password"}
            {view === "verify" && "Verify your email"}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
            <button type="submit" disabled={authLoading} className={btnClass}>
              {authLoading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex justify-between items-center pt-1">
              <button type="button" onClick={() => { setView("forgot"); setError(null); setSuccess(null); }} className={ghostBtn}>
                Forgot password?
              </button>
              <button type="button" onClick={() => { setView("signup"); setError(null); setSuccess(null); }} className={ghostBtn}>
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP */}
        {view === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
            <button type="submit" disabled={authLoading} className={btnClass}>
              {authLoading ? "Creating account..." : "Create Account"}
            </button>
            <div className="text-center pt-1">
              <button type="button" onClick={() => { setView("login"); setError(null); setSuccess(null); }} className={ghostBtn}>
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-white/50 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            <button type="submit" disabled={authLoading} className={btnClass}>
              {authLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center pt-1">
              <button type="button" onClick={() => { setView("login"); setError(null); setSuccess(null); }} className={ghostBtn}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* EMAIL VERIFICATION */}
        {view === "verify" && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-accent-primary)]">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm">We sent a verification link to</p>
              <p className="font-semibold text-sm mt-1">{user?.email}</p>
            </div>
            <p className="text-white/40 text-xs">Check your inbox and click the link to verify your account.</p>
            <button onClick={checkVerification} className={btnClass}>
              I&apos;ve Verified My Email
            </button>
            <div className="space-y-2 pt-1">
              <button onClick={resendVerification} className={ghostBtn + " block w-full"}>
                Resend verification email
              </button>
              <button onClick={() => signOut()} className={ghostBtn + " block w-full"}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
