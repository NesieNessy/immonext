import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import AdjustDistribution from './AdjustDistribution';

export const dynamicParams = false;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function AdjustDistributionPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <AdjustDistribution propertyId={propertyId} />;
}
