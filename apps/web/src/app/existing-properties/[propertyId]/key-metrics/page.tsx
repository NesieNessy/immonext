import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import KeyMetrics from './KeyMetrics';

export const dynamicParams = false;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <KeyMetrics propertyId={propertyId} />;
}
