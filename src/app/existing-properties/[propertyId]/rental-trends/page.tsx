import RentalTrends from './RentalTrends';
import existingPropertiesData from '@/data/existing_properties.json';

interface PropertyDataType {
    id: string;
}

async function fetchAllProperties(): Promise<PropertyDataType[]> {
    return existingPropertiesData.existing_properties as PropertyDataType[];
}

export async function generateStaticParams() {
    const properties = await fetchAllProperties();

    return properties.map((property: PropertyDataType) => ({
        propertyId: property.id,
    }));
}

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <RentalTrends propertyId={propertyId} />;
}
