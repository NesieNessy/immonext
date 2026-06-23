import AdjustRnd from './AdjustRnd';

export const dynamic = 'force-dynamic';

export default async function AdjustRNDPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <AdjustRnd propertyId={propertyId} />;
}
