import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import Sale from './Sale';

export const dynamicParams = true;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <Sale propertyId={propertyId} />;
}
