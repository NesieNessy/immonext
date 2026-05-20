import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import AdjustRnd from './AdjustRnd';

export const dynamicParams = false;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function AdjustRNDPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <AdjustRnd propertyId={propertyId} />;
}
