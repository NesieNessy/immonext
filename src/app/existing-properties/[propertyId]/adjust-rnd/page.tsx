import existingPropertiesData from '@/data/existing_properties.json';
import AdjustRnd from './AdjustRnd';

export function generateStaticParams() {
    return existingPropertiesData.existing_properties.map((property) => ({
        propertyId: property.id,
    }));
}

export default async function AdjustRNDPage({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <AdjustRnd propertyId={propertyId} />;
}
