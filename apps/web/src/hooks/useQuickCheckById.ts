import { getQuickCheckById, QuickCheck } from '@/lib/supabase/quick_check.supabase';
import { useEffect, useState } from 'react';

interface UseQuickCheckByIdResult {
    data: QuickCheck | null;
    isLoading: boolean;
    error: string | null;
}

export function useQuickCheckById(id: number): UseQuickCheckByIdResult {
    const [data, setData] = useState<QuickCheck | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);

        getQuickCheckById(id)
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                    setIsLoading(false);
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
                    setIsLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [id]);

    return { data, isLoading, error };
}
