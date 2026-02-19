import PropertyData from './PropertyData';
import existingPropertiesData from '@/data/existing_properties.json';

interface PropertyDataType {
    id: string;
    street: string;
    house_number: string;
    postcode: string;
    city: string;
    year_of_construction: number;
    date_of_acquisition: string;
    number_of_parking_spaces: number;
    energy_rating: string;
    net_internal_area_sqm: number;
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
    return <PropertyData propertyId={propertyId} />;
}
