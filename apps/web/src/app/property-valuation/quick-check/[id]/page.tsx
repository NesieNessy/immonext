import { QuickCheckResultView } from './QuickCheckResultView';

export const dynamicParams = false;

export async function generateStaticParams() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quick_check?select=quick_check_id`;
    const res = await fetch(url, {
        headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
    });
    if (!res.ok) return [];
    const data: { quick_check_id: number }[] = await res.json();
    return data.map((r) => ({ id: String(r.quick_check_id) }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <QuickCheckResultView id={parseInt(id, 10)} />;
}
