// ==============================================================================
// ImmoNext – Supabase Client: quick_check
//
// Journey:
//   createQuickCheck()   → INSERT — saves form data, status = ACTIVE
//   discardQuickCheck()  → RPC finalize_quick_check(DISCARD)
//                          1. UPSERT kpf_ranges  ← always
//                          2. status = INACTIVE
//   acceptQuickCheck()   → RPC finalize_quick_check(ACCEPT)
//                          1. UPSERT kpf_ranges  ← always
//                          2. status = INACTIVE
//                          3. INSERT property    ← appears in Portfolio
//
// Key invariant: kpf_ranges updated on EVERY finalisation (accept OR discard).
// ==============================================================================

import type { PropertyCondition } from '@immonext/types';
import { isAuthBypassEnabled } from '../authBypass';
import { supabase } from './client.supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuickCheckStatus = 'ACTIVE' | 'INACTIVE';
export type QuickCheckAction = 'ACCEPT' | 'DISCARD';

export interface QuickCheck {
    quickCheckId: number;
    userId: string;
    propertyId: number | null;
    portalId: string | null;
    purchasePrice: number;
    coldRent: number;
    street: string;
    postalCode: string;
    city: string;
    yearOfConstruction: number;
    condition: PropertyCondition;
    kpfMultiplier: number;
    status: QuickCheckStatus;
    finalisedAction: QuickCheckAction | null;
    detailCheck: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface QuickCheckOverview {
    quickCheckId: number;
    userId: string;
    ingestDate: string;
    portalId: string | null;
    kpfMultiplier: number;
    purchasePrice: number;
    coldRent: number;
    street: string;
    postalCode: string;
    city: string;
    yearOfConstruction: number;
    condition: PropertyCondition;
    status: QuickCheckStatus;
    finalisedAction: QuickCheckAction | null;
    detailCheck: boolean;
    propertyId: number | null;
    recommendationScore: number | null;
    recommendationLevel: string | null;
}

export interface CreateQuickCheckInput {
    portalId?: string;
    purchasePrice: number;
    coldRent: number;
    street: string;
    postalCode: string;
    city: string;
    yearOfConstruction: number;
    condition: PropertyCondition;
    kpfMultiplier: number;
}

export interface AcceptPropertyInput {
    street: string;
    houseNumber: string;
    cityName: string;
    federalState: string;
    cityId: number;
    propertyAbbreviation: string;
    squareMeters: number;
    numberOfRooms: number;
    energyEfficient: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapQuickCheck(row: Record<string, unknown>): QuickCheck {
    return {
        quickCheckId: row.quick_check_id as number,
        userId: row.user_id as string,
        propertyId: row.property_id as number | null,
        portalId: row.portal_id as string | null,
        purchasePrice: row.purchase_price as number,
        coldRent: row.cold_rent as number,
        street: (row.street as string | null) ?? '',
        postalCode: row.postal_code as string,
        city: (row.city as string | null) ?? '',
        yearOfConstruction: row.year_of_construction as number,
        condition: row.condition as PropertyCondition,
        kpfMultiplier: row.kpf_multiplier as number,
        status: row.status as QuickCheckStatus,
        finalisedAction: row.finalised_action as QuickCheckAction | null,
        detailCheck: row.detail_check as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

function mapOverview(row: Record<string, unknown>): QuickCheckOverview {
    return {
        quickCheckId:      row.quick_check_id as number,
        userId:            row.user_id as string,
        ingestDate:        row.ingest_date as string,
        portalId:          row.portal_id as string | null,
        // View aliases created_at as ingest_date
        kpfMultiplier:     row.kpf_multiplier as number,
        // View column is kpf_multiplier (matches the table column)
        purchasePrice:     row.purchase_price as number,
        coldRent:          row.cold_rent as number,
        street:            (row.street as string | null) ?? '',
        postalCode:        row.postal_code as string,
        city:              (row.city as string | null) ?? '',
        yearOfConstruction: row.year_of_construction as number,
        condition:         row.condition as PropertyCondition,
        status:            row.status as QuickCheckStatus,
        finalisedAction:   row.finalised_action as QuickCheckAction | null,
        detailCheck:  row.detail_check as boolean,
        propertyId:        row.property_id as number | null,
        recommendationScore: row.recommendation_score == null ? null : Number(row.recommendation_score),
        recommendationLevel: row.recommendation_level as string | null,
    };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get the latest 100 QuickChecks for the current user */
export async function getAllQuickChecks(): Promise<QuickCheckOverview[]> {
    if (isAuthBypassEnabled()) {
        const res = await fetch('/api/quick-checks', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return (data ?? []).map(mapOverview);
    }

    const { data, error } = await supabase
        .from('quick_check_overview')
        .select('*')
        .order('ingest_date', { ascending: false })
        .limit(100);
    if (error) throw error;
    return (data ?? []).map(mapOverview);
}

export async function getQuickCheckById(quickCheckId: number): Promise<QuickCheck | null> {
    const { data, error } = await supabase
        .from('quick_check')
        .select('*')
        .eq('quick_check_id', quickCheckId)
        .single();
    if (error) throw error;
    return data ? mapQuickCheck(data) : null;
}

// ── Create ────────────────────────────────────────────────────────────────────

/** Saves the QuickCheckPage form. Status = ACTIVE. No kpf_ranges write yet. */
export async function createQuickCheck(input: CreateQuickCheckInput): Promise<QuickCheck> {
    if (isAuthBypassEnabled()) {
        const res = await fetch('/api/quick-checks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await res.text());
        return mapQuickCheck(await res.json());
    }

    const { data, error } = await supabase
        .from('quick_check')
        .insert({
            portal_id: input.portalId ?? null,
            purchase_price: input.purchasePrice,
            cold_rent: input.coldRent,
            street: input.street,
            postal_code: input.postalCode,
            city: input.city,
            year_of_construction: input.yearOfConstruction,
            condition: input.condition,
            kpf_multiplier: input.kpfMultiplier,
        })
        .select()
        .single();
    if (error) throw error;
    return mapQuickCheck(data);
}

/** Updates the snapshot fields of an ACTIVE quick-check. Recalculates kpf_multiplier. */
export async function updateQuickCheck(
    quickCheckId: number,
    input: CreateQuickCheckInput,
): Promise<QuickCheck> {
    const { data, error } = await supabase
        .from('quick_check')
        .update({
            portal_id: input.portalId ?? null,
            purchase_price: input.purchasePrice,
            cold_rent: input.coldRent,
            street: input.street,
            postal_code: input.postalCode,
            city: input.city,
            year_of_construction: input.yearOfConstruction,
            condition: input.condition,
            kpf_multiplier: input.kpfMultiplier,
        })
        .eq('quick_check_id', quickCheckId)
        .select()
        .single();
    if (error) throw error;
    return mapQuickCheck(data);
}

// ── Finalise ──────────────────────────────────────────────────────────────────

/**
 * "Verwerfen" button.
 * DB steps (atomic):
 *   1. UPSERT kpf_ranges  ← benchmark updated even on discard
 */
export async function discardQuickCheck(quickCheckId: number, userId: string): Promise<void> {
    const { error } = await supabase.rpc('finalize_quick_check', {
        p_quick_check_id: quickCheckId,
        p_user_id:        userId,
        p_action:         'DISCARD',
    });
    if (error) throw error;
}

/**
 * "Übernehmen" button.
 * DB steps (atomic):
 *   1. UPSERT kpf_ranges  ← benchmark updated
 *   2. finalised_action = 'ACCEPT'
 *   3. INSERT property    ← object appears in Portfolio
 *
 * Returns the new property_id for immediate navigation.
 */
export async function acceptQuickCheck(
    quickCheckId: number,
    userId: string,
    propertyInput: AcceptPropertyInput,
): Promise<number> {
    const { data, error } = await supabase.rpc('finalize_quick_check', {
        p_quick_check_id:        quickCheckId,
        p_user_id:               userId,
        p_action:                'ACCEPT',
        p_street:                propertyInput.street,
        p_house_number:          propertyInput.houseNumber,
        p_city_name:             propertyInput.cityName,
        p_federal_state:         propertyInput.federalState,
        p_city_id:               propertyInput.cityId,
        p_property_abbreviation: propertyInput.propertyAbbreviation,
        p_square_meters:         propertyInput.squareMeters,
        p_number_of_rooms:       propertyInput.numberOfRooms,
        p_energy_efficient:      propertyInput.energyEfficient,
    });
    if (error) throw error;
    return data as number;
}

// ── Updates ───────────────────────────────────────────────────────────────────

/** Called when user starts a detail check from this quick-check */
export async function markDetailCheck(quickCheckId: number): Promise<void> {
    const { error } = await supabase
        .from('quick_check')
        .update({ detail_check: true })
        .eq('quick_check_id', quickCheckId);
    if (error) throw error;
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Hard delete
 */
export async function deleteQuickCheck(quickCheckId: number): Promise<void> {
    const { error } = await supabase
        .from('quick_check')
        .delete()
        .eq('quick_check_id', quickCheckId);
    if (error) throw error;
}

/**
 * Bulk hard delete — used by the overview table action bar.
 */
export async function deleteQuickChecks(quickCheckIds: number[]): Promise<void> {
    if (quickCheckIds.length === 0) return;
    if (isAuthBypassEnabled()) {
        const res = await fetch('/api/quick-checks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: quickCheckIds }),
        });
        if (!res.ok) throw new Error(await res.text());
        return;
    }

    const { error } = await supabase
        .from('quick_check')
        .delete()
        .in('quick_check_id', quickCheckIds);
    if (error) throw error;
}
