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

export function useQuickChecks(): UseQuickChecksResult {
    const [data, setData] = useState<QuickCheckOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const rows = await getAllQuickChecks();
            setData(rows);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const deleteSelected = useCallback(async (ids: number[]) => {
        await deleteQuickChecks(ids);
        await fetch();
    }, [fetch]);

    return {
        data,
        isLoading,
        error,
        refetch: fetch,
        deleteSelected,
    };
}
