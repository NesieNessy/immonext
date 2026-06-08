import { getQuickCheckStaticParamsFromRest } from '@/lib/staticParams';
import { QuickCheckResultView } from './QuickCheckResultView';

export const dynamicParams = false;

export async function generateStaticParams() {
    return getQuickCheckStaticParamsFromRest();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <QuickCheckResultView id={parseInt(id, 10)} />;
}
