import TenantCertificatePage from './TenantCertificatePage';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string; unitId: string }> }) {
    const { propertyId, unitId } = await params;
    return <TenantCertificatePage propertyId={propertyId} unitId={unitId} />;
}
