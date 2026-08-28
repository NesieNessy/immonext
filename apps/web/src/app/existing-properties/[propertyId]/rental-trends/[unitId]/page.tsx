import TenancyTrends from '../RentalTrends';

export const dynamic = 'force-dynamic';

// Reachable per-unit from the property hub. The page itself doesn't
// differentiate by unit yet — Mietentwicklung has no per-unit content built
// out — but the route exists so the hub can always deep-link into a unit's
// context, consistent with its sibling Miete tiles.
export default async function Page({ params }: { params: Promise<{ propertyId: string; unitId: string }> }) {
    const { propertyId } = await params;
    return <TenancyTrends propertyId={propertyId} />;
}
