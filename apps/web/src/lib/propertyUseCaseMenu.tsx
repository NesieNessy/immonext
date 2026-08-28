import type { LucideIcon } from 'lucide-react';
import { Icons, type MenuItem } from '@/components/ui';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';

type UseCaseKey = keyof typeof ExistingPropertiesUseCases;

/**
 * Icons are imported by name and referenced directly — never via
 * `import * as LucideIcons` plus a string lookup. A namespace import with a
 * dynamic key is unresolvable at build time, so the bundler has to keep all
 * ~1600 lucide icons; that cost ~185 kB of First Load JS on every page that
 * renders this menu.
 */
const iconMap: Record<UseCaseKey, LucideIcon> = {
    PropertyData: Icons.Database,
    RND: Icons.Clock,
    SplitPurchasePrice: Icons.PieChart,
    TenantData: Icons.Users,
    TenantHistory: Icons.History,
    TenancyTrends: Icons.TrendingUp,
    ServiceChargeSettlement: Icons.Receipt,
    Contractors: Icons.Wrench,
    TaxDocuments: Icons.Landmark,
    KeyMetrics: Icons.BarChart3,
    Sale: Icons.ShoppingCart,
    TenantMoveOut: Icons.DoorOpen,
};

/** Use case key → route segment under `/existing-properties/{id}/`. */
const routeMap: Record<UseCaseKey, string> = {
    PropertyData: 'property-data',
    RND: 'adjust-rnd',
    SplitPurchasePrice: 'adjust-distribution',
    TenantData: 'tenant-data',
    TenantHistory: 'tenant-history',
    // Route segment is `rental-trends` — matches the folder and the hub card
    // in PropertyHub. It read `tenancy-trends` here, which 404'd.
    TenancyTrends: 'rental-trends',
    ServiceChargeSettlement: 'service-charge-settlement',
    Contractors: 'contractors',
    TaxDocuments: 'tax-documents',
    KeyMetrics: 'key-metrics',
    Sale: 'sale',
    TenantMoveOut: 'tenant-move-out',
};

export function createUseCaseMenuItems(
    propertyId: string,
    currentUseCase: UseCaseKey,
    onNavigate: (route: string) => void
): MenuItem[] {
    return (Object.keys(ExistingPropertiesUseCases) as UseCaseKey[]).map((key) => {
        const Icon = iconMap[key];

        return {
            label: ExistingPropertiesUseCases[key],
            icon: <Icon />,
            onClick: () => onNavigate(`/existing-properties/${propertyId}/${routeMap[key]}`),
            disabled: key === currentUseCase, // Disable the current page
        };
    });
}
