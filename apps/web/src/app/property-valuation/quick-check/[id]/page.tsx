import { getQuickCheckStaticParamsFromRest } from '@/lib/staticParams';
import { QuickCheckResultView } from './QuickCheckResultView';

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return await getQuickCheckStaticParamsFromRest();
  } catch (error) {
    console.warn('staticParams: failed to fetch quick check IDs', error);
    return [];
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuickCheckResultView id={parseInt(id, 10)} />;
}