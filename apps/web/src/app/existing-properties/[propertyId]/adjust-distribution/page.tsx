import AdjustDistribution from './AdjustDistribution';
import { generatePropertyStaticParams as generateStaticParams } from '@/lib/staticParams';

export { generateStaticParams };

export default async function AdjustDistributionPage({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <AdjustDistribution propertyId={propertyId} />;
}
