import { createClient } from '@supabase/supabase-js';

// Fetch all property IDs from Supabase at build time for static export.
export async function getPropertyStaticParams(): Promise<{ propertyId: string }[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('property')
        .select('property_id');

    if (error || !data) {
        console.warn('staticParams: failed to fetch property IDs', error?.message);
        return [];
    }

    return data.map((row: { property_id: number }) => ({
        propertyId: String(row.property_id),
    }));
}
