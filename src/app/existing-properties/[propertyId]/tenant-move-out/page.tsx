import TenantMoveOut from './TenantMoveOut';
import existingPropertiesData from '@/data/existing_properties.json';

export async function generateStaticParams() {
    return existingPropertiesData.existing_properties.map(property => ({ propertyId: property.id }));
}

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <TenantMoveOut propertyId={propertyId} />;
}
