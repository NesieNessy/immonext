import * as LucideIcons from 'lucide-react';
import type { MenuItem } from '@/components/ui';
import { ExistingPropertiesUseCases, ExistingPropertiesUseCasesIcons } from '@/constants/ExistingPropertiesUseCases';

// Map use case keys to their route paths
const routeMap: Record<string, string> = {
    'PropertyData': 'property-data',
    'RND': 'adjust-rnd',
    'SplitPurchasePrice': 'adjust-distribution',
    'TenantData': 'tenant-data',
    'TenantHistory': 'tenant-history',
    'RentalTrends': 'rental-trends',
    'ServiceChargeSettlement': 'service-charge-settlement',
    'Contractors': 'contractors',
    'TaxDocuments': 'tax-documents',
    'KeyMetrics': 'key-metrics',
    'Sale': 'sale',
    'TenantMoveOut': 'tenant-move-out',
};

export function createUseCaseMenuItems(
    propertyId: string,
    currentUseCase: keyof typeof ExistingPropertiesUseCases,
    onNavigate: (route: string) => void
): MenuItem[] {
    return Object.entries(ExistingPropertiesUseCases).map(([key, useCase]) => {
        const iconName = ExistingPropertiesUseCasesIcons[key as keyof typeof ExistingPropertiesUseCases];
        const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType>)[iconName];
        const isActive = key === currentUseCase;
        
        return {
            label: useCase,
            icon: IconComponent ? <IconComponent /> : undefined,
            onClick: () => {
                const route = routeMap[key];
                if (route) {
                    onNavigate(`/existing-properties/${propertyId}/${route}`);
                }
            },
            disabled: isActive, // Disable the current page
        };
    });
}
