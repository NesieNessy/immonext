import AdjustDistribution from './AdjustDistribution';

export const dynamic = 'force-dynamic';

export default async function AdjustDistributionPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <AdjustDistribution propertyId={propertyId} />;
}
