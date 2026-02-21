import TenantMoveOut from './TenantMoveOut';
import { generatePropertyStaticParams as generateStaticParams } from '@/lib/staticParams';

export { generateStaticParams };

export default async function Page({ params }: { params: { propertyId: string } }) {
    const { propertyId } = await params;
    return <TenantMoveOut propertyId={propertyId} />;
}
