import PropertyData from './PropertyData';
import { generatePropertyStaticParams as generateStaticParams } from '@/lib/staticParams';

export { generateStaticParams };

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <PropertyData propertyId={propertyId} />;
}
