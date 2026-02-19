import AdjustRnd from './AdjustRnd';
import { generatePropertyStaticParams as generateStaticParams } from '@/lib/staticParams';

export { generateStaticParams };

export default async function AdjustRNDPage({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <AdjustRnd propertyId={propertyId} />;
}
