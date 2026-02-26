import { supabase } from '@/lib/supabase/client';
import type {
    Tenancy,
    TenancyInsert,
    TenancyTypeValues,
    TenancyUpdate,
} from '@immonext/types';

function toTenancy(row: Record<string, unknown>): Tenancy {
    return {
        tenancyId: row.tenancy_id as number,
        maintenanceCostsId: row.maintenance_costs_id as number,
        parkingSpaceId: row.parking_space_id as number,
        propertyId: row.property_id as number,
        isRented: row.is_rented as boolean | null,
        tenancyStartDate: row.tenancy_start_date as string | null,
        tenancyEndDate: row.tenancy_end_date as string | null,
        tenancyType: row.tenancy_type as TenancyTypeValues | null,
        tenancyUnits: row.tenancy_units as number | null,
        tenancyUnitsPrice: row.tenancy_units_price as number | null,
        parkingSpaceRent: row.parking_space_rent as number | null,
        miscRent: row.misc_rent as number | null,
        warmRent: row.warm_rent as number | null,
        coldRent: row.cold_rent as number | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        tenantFirstName: row.updated_at as string,
        tenantLastName: row.updated_at as string,
        deposit: row.updated_at as number,
    };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getTenanciesByProperty(propertyId: number): Promise<Tenancy[]> {
    const { data, error } = await supabase
        .from('tenancy')
        .select('*')
        .eq('property_id', propertyId)
        .order('tenancy_id', { ascending: true });

    if (error || !data) return [];
    return data.map(toTenancy);
}

export async function getTenancyById(tenancyId: number): Promise<Tenancy | null> {
    const { data, error } = await supabase
        .from('tenancy')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .single();

    if (error || !data) return null;
    return toTenancy(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createTenancy(payload: TenancyInsert): Promise<Tenancy | null> {
    const { data, error } = await supabase
        .from('tenancy')
        .insert({
            maintenance_costs_id: payload.maintenanceCostsId,
            parking_space_id: payload.parkingSpaceId,
            property_id: payload.propertyId,
            is_rented: payload.isRented,
            tenancy_start_date: payload.tenancyStartDate,
            tenancy_end_date: payload.tenancyEndDate,
            tenancy_type: payload.tenancyType,
            tenancy_units: payload.tenancyUnits,
            tenancy_units_price: payload.tenancyUnitsPrice,
            parking_space_rent: payload.parkingSpaceRent,
            misc_rent: payload.miscRent,
            warm_rent: payload.warmRent,
            cold_rent: payload.coldRent,
        })
        .select()
        .single();

    if (error || !data) return null;
    return toTenancy(data);
}

export async function updateTenancy(
    tenancyId: number,
    updates: TenancyUpdate,
): Promise<Tenancy | null> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.maintenanceCostsId !== undefined) dbUpdates.maintenance_costs_id = updates.maintenanceCostsId;
    if (updates.parkingSpaceId !== undefined) dbUpdates.parking_space_id = updates.parkingSpaceId;
    if (updates.isRented !== undefined) dbUpdates.is_rented = updates.isRented;
    if (updates.tenancyStartDate !== undefined) dbUpdates.tenancy_start_date = updates.tenancyStartDate;
    if (updates.tenancyEndDate !== undefined) dbUpdates.tenancy_end_date = updates.tenancyEndDate;
    if (updates.tenancyType !== undefined) dbUpdates.tenancy_type = updates.tenancyType;
    if (updates.tenancyUnits !== undefined) dbUpdates.tenancy_units = updates.tenancyUnits;
    if (updates.tenancyUnitsPrice !== undefined) dbUpdates.tenancy_units_price = updates.tenancyUnitsPrice;
    if (updates.parkingSpaceRent !== undefined) dbUpdates.parking_space_rent = updates.parkingSpaceRent;
    if (updates.miscRent !== undefined) dbUpdates.misc_rent = updates.miscRent;
    if (updates.warmRent !== undefined) dbUpdates.warm_rent = updates.warmRent;
    if (updates.coldRent !== undefined) dbUpdates.cold_rent = updates.coldRent;

    const { data, error } = await supabase
        .from('tenancy')
        .update(dbUpdates)
        .eq('tenancy_id', tenancyId)
        .select()
        .single();

    if (error || !data) return null;
    return toTenancy(data);
}

export async function deleteTenancy(tenancyId: number): Promise<boolean> {
    const { error } = await supabase
        .from('tenancy')
        .delete()
        .eq('tenancy_id', tenancyId);

    return !error;
}

export async function deleteTenanciesByProperty(propertyId: number): Promise<boolean> {
    const { error } = await supabase
        .from('tenancy')
        .delete()
        .eq('property_id', propertyId);

    return !error;
}
