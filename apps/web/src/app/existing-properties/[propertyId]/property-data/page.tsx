import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import PropertyData from './PropertyData';

export const dynamicParams = true;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <PropertyData propertyId={propertyId} />;
}
