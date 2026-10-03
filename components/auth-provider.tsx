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
  const [isPending, startTransition] = useTransition();

  /*
   * `useState(initialUser)` only reads the prop on the first render. Sign-in and
   * sign-up both resolve by calling router.refresh(), which re-runs the root layout
   * and hands this component a new `initialUser` — but on its own that new value
   * never reaches `user`, so the header keeps showing "Log in" and a page gated on
   * useAuth().user keeps asking the just-signed-in customer to sign in again, until
   * they reload the page by hand.
   *
   * Compared during render rather than synced in an effect: an effect would render
   * the stale value first and only then correct it, and calling setState from one
   * costs an extra render pass for every refresh.
   */
  const [prevInitialUser, setPrevInitialUser] = useState<Customer | null>(initialUser);
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
