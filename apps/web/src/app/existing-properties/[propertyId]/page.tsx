import { getPropertyStaticParamsFromRest } from '@/lib/staticParams';
import { redirect } from 'next/navigation';

export const dynamicParams = true;

export async function generateStaticParams() {
    return getPropertyStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    redirect(`/existing-properties/${propertyId}/property-data`);
}
