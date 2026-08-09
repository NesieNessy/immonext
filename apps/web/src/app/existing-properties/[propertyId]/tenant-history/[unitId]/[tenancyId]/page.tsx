import ArchivedTenantPage from './ArchivedTenantPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string; unitId: string; tenancyId: string }> }) {
    const { propertyId, unitId, tenancyId } = await params;
    return <ArchivedTenantPage propertyId={propertyId} unitId={unitId} tenancyId={tenancyId} />;
}
