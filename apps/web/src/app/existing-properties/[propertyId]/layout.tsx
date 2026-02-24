export const dynamicParams = false;

export async function generateStaticParams() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/property?select=property_id`;
    const res = await fetch(url, {
        headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
    });
    if (!res.ok) return [];
    const data: { property_id: number }[] = await res.json();
    return data.map((r) => ({ propertyId: String(r.property_id) }));
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
