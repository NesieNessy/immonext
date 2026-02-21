import existingPropertiesData from '@/data/existing_properties.json';

export function generatePropertyStaticParams() {
    return existingPropertiesData.existing_properties.map(property => ({ 
        propertyId: property.id 
    }));
}
