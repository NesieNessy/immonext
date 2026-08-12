"use client";
import { useEffect, useState } from 'react';

import { PropertyLoadingPage, PropertyNotFoundPage } from '@/components/features/PropertyDisplay';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { getPropertyUnitsByProperty } from '@/lib/supabase/property_unit.supabase';
import type { Property, PropertyUnit } from '@immonext/types';

import { ServiceChargeSettlementView } from '../ServiceChargeSettlementView';

export default function ServiceChargeSettlementUnitPage({ propertyId, unitId }: { propertyId: string; unitId: string }) {
    const [property, setProperty] = useState<Property | null>(null);
    const [unit, setUnit] = useState<PropertyUnit | null | undefined>(undefined);

    useEffect(() => {
        const id = parseInt(propertyId, 10);
        const targetUnitId = parseInt(unitId, 10);
        Promise.all([
            getPropertyById(id),
            getPropertyUnitsByProperty(id),
        ]).then(([foundProperty, units]) => {
            setProperty(foundProperty);
            setUnit(units.find((u) => u.propertyUnitId === targetUnitId) ?? null);
        });
    }, [propertyId, unitId]);

    if (property === null || unit === null) return <PropertyNotFoundPage />;
    if (!property || unit === undefined) return <PropertyLoadingPage />;

    return <ServiceChargeSettlementView propertyId={propertyId} property={property} unit={unit} hasMultipleUnits={true} />;
}
