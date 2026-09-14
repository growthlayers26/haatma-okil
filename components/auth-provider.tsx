"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import type { Customer } from "@/lib/auth/session";

/**
 * Who is signed in, for the parts of the UI that need to know.
 *
 * The session is an httpOnly cookie that the browser cannot read, so unlike the
 * Supabase version this provider does not fetch anything. The server has already
 * resolved the customer by the time the page renders and passes it in — which is also
 * why `loading` is now always false. There is no session check to wait for and so no
 * flash of signed-out UI on a signed-in page.
 */

type AuthContextValue = {
  user: Customer | null;
  /** Kept for the components that read it; nothing is ever pending now. */
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
  configured,
}: {
  children: ReactNode;
  initialUser: Customer | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<Customer | null>(initialUser);
  const [prevInitialUser, setPrevInitialUser] = useState<Customer | null>(initialUser);
  const [isPending, startTransition] = useTransition();

  // AuthProvider lives in the root layout and is never remounted across navigation, so
  // the useState initializer above only ever runs once. Sign-in and register both call
  // router.refresh() to get a fresh initialUser from the server, and without re-deriving
  // state here that new value would arrive as a prop but never reach `user` — leaving
  // the header showing signed-out indefinitely after a successful sign-in. Adjusted
  // during render rather than in an effect, per React's guidance for this exact case,
  // to avoid an extra render pass.
  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser);
  }

  const signOut = useCallback(async () => {
    await signOutAction();
    setUser(null);
    startTransition(() => router.refresh());
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading: isPending, configured, signOut }),
    [user, isPending, configured, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
