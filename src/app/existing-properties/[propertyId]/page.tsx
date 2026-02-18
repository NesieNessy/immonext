import PropertyDetail from './PropertyDetail';
import existingPropertiesData from '@/data/existing_properties.json';

interface PropertyData {
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

async function fetchAllProperties(): Promise<PropertyData[]> {
    return existingPropertiesData.existing_properties as PropertyData[];
}

export async function generateStaticParams() {
    const properties = await fetchAllProperties();

    return properties.map((property: PropertyData) => ({
        propertyId: property.id,
    }));
}

export default function Page({ params }: { params: { propertyId: string } }) {
    return <PropertyDetail propertyId={params.propertyId} />;
}