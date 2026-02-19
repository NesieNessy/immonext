import { redirect } from 'next/navigation';
import existingPropertiesData from '@/data/existing_properties.json';
import type { Property } from '@/types/Property';

async function fetchAllProperties(): Promise<Property[]> {
    return existingPropertiesData.existing_properties as Property[];
}

export async function generateStaticParams() {
    const properties = await fetchAllProperties();

    return properties.map((property: Property) => ({
        propertyId: property.id,
    }));
}

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    redirect(`/existing-properties/${propertyId}/property-data`);
}