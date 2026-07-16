'use client';

import {
    deleteQuickChecks,
    getAllQuickChecks,
    type QuickCheckOverview,
} from '@/lib/supabase/quick_check.supabase';
import { useCallback, useEffect, useState } from 'react';

export interface UseQuickChecksResult {
    data: QuickCheckOverview[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    deleteSelected: (ids: number[]) => Promise<void>;
}

/**
 * @param detailCheck Filters by quick_check.detail_check — false (default)
 *   for the Ersteinschätzungen overview, true for the Detailbewertungen
 *   overview. A row moves from one list to the other the moment its detail
 *   check is started (see markDetailCheck).
 */
export function useQuickChecks(detailCheck = false): UseQuickChecksResult {
    const [data, setData] = useState<QuickCheckOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const rows = await getAllQuickChecks(detailCheck);
            setData(rows);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setIsLoading(false);
        }
    }, [detailCheck]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const deleteSelected = useCallback(async (ids: number[]) => {
        await deleteQuickChecks(ids);
        setData((prev) => prev.filter((row) => !ids.includes(row.quickCheckId)));
    }, []);

    return {
        data,
        isLoading,
        error,
        refetch: fetch,
        deleteSelected,
    };
}
