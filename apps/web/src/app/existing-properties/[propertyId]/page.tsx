import { redirect } from 'next/navigation';
import existingPropertiesData from '@/data/existing_properties.json';
import type { ExistingProperty } from '@/types/ExistingProperty';

async function fetchAllProperties(): Promise<ExistingProperty[]> {
    return existingPropertiesData.existing_properties as ExistingProperty[];
}

export async function generateStaticParams() {
    const properties = await fetchAllProperties();

    return properties.map((property: ExistingProperty) => ({
        propertyId: property.id,
    }));
}

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    redirect(`/existing-properties/${propertyId}/property-data`);
}