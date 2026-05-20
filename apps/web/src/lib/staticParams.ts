import { createClient } from '@supabase/supabase-js';

function staticParamsHeaders() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) return null;
    return {
        apikey: key,
        Authorization: `Bearer ${key}`,
    };
}

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

export async function getPropertyStaticParamsFromRest(): Promise<{ propertyId: string }[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const headers = staticParamsHeaders();
    if (!supabaseUrl || !headers) return [];

    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/property?select=property_id`, { headers });
        if (!res.ok) return [];
        const data: { property_id: number }[] = await res.json();
        return data.map((row) => ({ propertyId: String(row.property_id) }));
    } catch (error) {
        console.warn('staticParams: failed to fetch property IDs', error);
        return [];
    }
}

export async function getQuickCheckStaticParamsFromRest(): Promise<{ id: string }[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const headers = staticParamsHeaders();
    if (!supabaseUrl || !headers) return [];

    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/quick_check?select=quick_check_id`, { headers });
        if (!res.ok) return [];
        const data: { quick_check_id: number }[] = await res.json();
        return data.map((row) => ({ id: String(row.quick_check_id) }));
    } catch (error) {
        console.warn('staticParams: failed to fetch quick check IDs', error);
        return [];
    }
}
