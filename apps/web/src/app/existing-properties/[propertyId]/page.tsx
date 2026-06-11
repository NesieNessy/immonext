import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    redirect(`/existing-properties/${propertyId}/property-data`);
}
