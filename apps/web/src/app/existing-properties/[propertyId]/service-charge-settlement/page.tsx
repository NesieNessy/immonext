import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import ServiceChargeSettlement from './ServiceChargeSettlement';

export const dynamicParams = false;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <ServiceChargeSettlement propertyId={propertyId} />;
}
