import TenantUnitHistoryPage from './TenantUnitHistoryPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string; unitId: string }> }) {
    const { propertyId, unitId } = await params;
    return <TenantUnitHistoryPage propertyId={propertyId} unitId={unitId} />;
}
