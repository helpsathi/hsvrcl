"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  profileComplete?: boolean;
  adminSubRole?: string | null;
  mentorStatus?: string | null;
  freeTrialChatsUsed?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (credential: string) => {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      
      if (!data.user.profileComplete) {
        window.location.href = "/profile-setup";
      } else if (data.user.role === "ADMIN" || data.user.adminSubRole) {
        window.location.href = "/admin";
      } else if (data.user.role === "MENTOR" && data.user.mentorStatus === "APPROVED") {
        window.location.href = "/mentor-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      let errorMessage = "Login failed";
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Ignore JSON parse error if response is not JSON
      }
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (newData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...newData } : null));
  };

  const refetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Refetch user failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refetchUser }}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
