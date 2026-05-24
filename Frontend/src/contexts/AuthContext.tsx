import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Role, User } from '@/types';
import { api, getStoredToken, setStoredToken } from '@/lib/api';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  city?: string;
  neighborhood?: string;
};

export type CompleteProfilePayload = {
  city: string;
  neighborhood?: string;
  name?: string;
};

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  signInWithEmailPassword: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  applyOAuthSession: (accessToken: string) => Promise<User>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  bootstrapping: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(u: Record<string, unknown>): User {
  return {
    id: String(u.id),
    name: String(u.name),
    email: u.email ? String(u.email) : undefined,
    city: String(u.city ?? ''),
    role: u.role as User['role'],
    rank: u.rank as User['rank'],
    xp: Number(u.xp ?? 0),
    karmaPoints: Number(u.karmaPoints ?? 0),
    badges: (u.badges as User['badges']) ?? [],
    issuesPosted: Number(u.issuesPosted ?? 0),
    solutionsImplemented: Number(u.solutionsImplemented ?? 0),
    volunteerHours: Number(u.volunteerHours ?? 0),
    avatarUrl: u.avatarUrl ? String(u.avatarUrl) : undefined,
    redeemedCoupons: (u.redeemedCoupons as User['redeemedCoupons']) ?? [],
    contractorCategory: u.contractorCategory ? String(u.contractorCategory) : undefined,
    contractorLabel: u.contractorLabel ? String(u.contractorLabel) : undefined,
    profileComplete: u.profileComplete !== false,
    authProvider: (u.authProvider as User['authProvider']) ?? 'local',
    phone: u.phone ? String(u.phone) : undefined,
    phoneVerified: Boolean(u.phoneVerified),
  };
}

function applySession(accessToken: string, rawUser: Record<string, unknown>): User {
  setStoredToken(accessToken);
  const user = mapUser(rawUser);
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get<Record<string, unknown>>('/api/auth/me');
    setUser(mapUser(data));
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      setBootstrapping(false);
      return;
    }
    refreshProfile()
      .catch(() => setStoredToken(null))
      .finally(() => setBootstrapping(false));
  }, [refreshProfile]);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; user: Record<string, unknown> }>('/api/auth/login', {
      email: email.trim(),
      password,
    });
    const u = applySession(data.accessToken, data.user);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post<{ accessToken: string; user: Record<string, unknown> }>('/api/auth/register', {
      name: payload.name,
      email: payload.email.trim(),
      password: payload.password,
      city: payload.city ?? '',
      neighborhood: payload.neighborhood ?? '',
    });
    const u = applySession(data.accessToken, data.user);
    setUser(u);
    return u;
  }, []);

  const applyOAuthSession = useCallback(async (accessToken: string) => {
    setStoredToken(accessToken);
    const { data } = await api.get<Record<string, unknown>>('/api/auth/me');
    const u = mapUser(data);
    setUser(u);
    return u;
  }, []);

  const completeProfile = useCallback(async (payload: CompleteProfilePayload) => {
    const { data } = await api.patch<{ accessToken: string; user: Record<string, unknown> }>(
      '/api/auth/complete-profile',
      payload
    );
    const u = applySession(data.accessToken, data.user);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        signInWithEmailPassword,
        register,
        applyOAuthSession,
        completeProfile,
        logout,
        refreshProfile,
        bootstrapping,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
