"use client";

import { NavigationBar } from '@/components/ui/NavigationBar';
import { authBypassUser, isAuthBypassEnabled } from '@/lib/authBypass';
import { clearLoginTime } from '@/lib/sessionTimeout';
import { supabase } from '@/lib/supabase/client.supabase';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthBypassEnabled()) {
      setUser(authBypassUser);
      return;
    }

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    clearLoginTime();
    if (isAuthBypassEnabled()) {
      router.push('/');
      return;
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Determine which item should be active based on the current path
  const isPropertyValuationActive = pathname?.startsWith('/property-valuation');
  const isExistingPropertiesActive = pathname?.startsWith('/existing-properties');
  const isDocumentsActive = pathname === '/documents';
  const isNetworkActive = pathname === '/network';
  const isUserSettingsActive = pathname === '/user-settings';

  return (
    <NavigationBar 
      logo={{
        iconName: 'home',
        text: 'Startseite',
        href: '/'
      }}
      items={[
        { 
          label: 'Objektbewertung',
          iconName: 'propertyValuation',
          active: isPropertyValuationActive,
          subItems: [
            { label: 'Ersteinschätzung', href: '/property-valuation/quick-check', iconName: 'quickCheck' },
            { label: 'Detailbewertung', href: '/property-valuation/detail-check', iconName: 'detailCheck' },
          ]
        },
        { label: 'Bestandsobjekte', href: '/existing-properties', iconName: 'existingProperties', active: isExistingPropertiesActive },
        { label: 'Dokumente', href: '/documents', iconName: 'documents', active: isDocumentsActive },
        { label: 'Netzwerk', href: '/network', iconName: 'network', active: isNetworkActive },
      ]}
      actions={[
        {
          iconName: 'search', 
          ariaLabel: 'Search'
        },
        {
          iconName: 'user', 
          ariaLabel: 'User settings',
          href: '/user-settings',
          active: isUserSettingsActive
        },
        ...(user ? [{
          iconName: 'logout' as const,
          ariaLabel: 'Abmelden',
          onClick: handleLogout,
        }] : []),
      ]}
    />
  );
}
