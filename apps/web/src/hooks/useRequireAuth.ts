'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isSessionExpired, clearLoginTime, msUntilExpiry } from '@/lib/sessionTimeout';
import type { User } from '@supabase/supabase-js';

/**
 * Redirects to /login if no authenticated user is found.
 * Automatically signs out and redirects to / after 2 hours.
 * Use this in any protected page component.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function signOutAndRedirect() {
      clearLoginTime();
      await supabase.auth.signOut();
      router.replace('/');
    }

    // Check session age immediately on mount
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login');
        return;
      }
      if (isSessionExpired()) {
        signOutAndRedirect();
        return;
      }
      setUser(data.user);
      setIsLoading(false);
    });

    // Schedule automatic logout at the exact expiry time
    const ms = msUntilExpiry();
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    if (ms > 0) {
      expiryTimer = setTimeout(() => {
        signOutAndRedirect();
      }, ms);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login');
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (expiryTimer) clearTimeout(expiryTimer);
    };
  }, [router]);

  return { user, isLoading };
}
