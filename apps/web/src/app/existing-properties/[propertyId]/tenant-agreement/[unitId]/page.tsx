import TenantUnitAgreementPage from './TenantUnitAgreementPage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string; unitId: string }> }) {
    const { propertyId, unitId } = await params;
    return <TenantUnitAgreementPage propertyId={propertyId} unitId={unitId} />;
}
