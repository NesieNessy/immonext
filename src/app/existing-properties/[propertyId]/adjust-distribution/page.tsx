import existingPropertiesData from '@/data/existing_properties.json';
import AdjustDistribution from './AdjustDistribution';

export function generateStaticParams() {
    return existingPropertiesData.existing_properties.map((property) => ({
        propertyId: property.id,
    }));
}

export default async function AdjustDistributionPage({ params }: { params: { propertyId: string } }) {
     const { propertyId } = await params;
    return <AdjustDistribution propertyId={propertyId} />;
}
