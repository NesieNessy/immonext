"use client";

import { usePathname } from 'next/navigation';
import { NavigationBar } from './real-estate';

export function AppNavigation() {
  const pathname = usePathname();

  // Determine which item should be active based on the current path
  const isPropertyValuationActive = pathname?.startsWith('/property-valuation');
  const isExistingPropertiesActive = pathname === '/existing-properties';
  const isDocumentsActive = pathname === '/documents';
  const isNetworkActive = pathname === '/network';
  const isSettingsActive = pathname === '/settings';

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
            { label: 'QuickCheck', href: '/property-valuation/quick-check', iconName: 'quickCheck' },
            { label: 'Detailbewertung', href: '/property-valuation/detail-check', iconName: 'detailCheck' },
          ]
        },
        { label: 'Bestandsobjekte', href: '/existing-properties', iconName: 'existingProperties', active: isExistingPropertiesActive },
        { label: 'Dokumente', href: '/documents', iconName: 'documents', active: isDocumentsActive },
        { label: 'Netzwerk', href: '/network', iconName: 'network', active: isNetworkActive },
        { label: 'Einstellungen', href: '/settings', iconName: 'settings', active: isSettingsActive },
      ]}
      actions={[
        {
          iconName: 'search', 
          ariaLabel: 'Search'
        },
        {
          iconName: 'user', 
          ariaLabel: 'User profile'
        }
      ]}
    />
  );
}
