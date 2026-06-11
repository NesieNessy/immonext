import Contractors from './Contractors';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;
    return <Contractors propertyId={propertyId} />;
}
