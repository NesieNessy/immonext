"use client";

import { BESTANDSOBJEKTE_BREADCRUMB_ROOT, formatUnitLabel, PROPERTY_CATEGORY_LABEL, PropertyLoadingPage } from '@/components/features/PropertyDisplay';
import { ConfirmDeleteModal, Header, SectionLabel, Tag, type BreadcrumbItem } from '@/components/ui';
import { deleteProperty, getPropertyOverviewById, type PropertyOverview } from '@/lib/supabase/property.supabase';
import { getPropertyUnitsByProperty } from '@/lib/supabase/property_unit.supabase';
import { base64ToDataUri, cn } from '@/lib/utils';
import type { PropertyUnit } from '@immonext/types';
import {
  BarChart3,
  Clock,
  Database,
  DoorOpen,
  FileSignature,
  History,
  Home,
  Landmark,
  PieChart,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HubCard {
  key: string;
  title: string;
  description: string;
  /**
   * Navigates to `/existing-properties/{propertyId}/{route}` when scope is
   * "property", or `/existing-properties/{propertyId}/{route}/{unitId}` when
   * scope is "unit" — the whole reason PropertyHub is entered per-Einheit.
   */
  route: string;
  scope: 'property' | 'unit';
  /** Runs instead of navigating when set (e.g. opening a confirm dialog). */
  onClick?: () => void;
  icon: React.ElementType;
  colorClass: string;
}

// Route segments match the real folders under [propertyId]/.
const OBJEKTVERWALTUNG: HubCard[] = [
  {
    key: 'property-data',
    title: 'Objektdaten',
    description: 'Adresse, Fläche, Baujahr und weitere Stammdaten pflegen',
    route: 'property-data',
    scope: 'property',
    icon: Database,
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'adjust-rnd',
    title: 'Restnutzungsdauer',
    description: 'Restnutzungsdauer für die Abschreibung individuell festlegen',
    route: 'adjust-rnd',
    scope: 'property',
    icon: Clock,
    colorClass: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    key: 'adjust-distribution',
    title: 'Kaufpreisaufteilung',
    description: 'Prozentuale Kaufpreisverteilung für die Abschreibung',
    route: 'adjust-distribution',
    scope: 'property',
    icon: PieChart,
    colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    key: 'tenant-data-new',
    title: 'Neue Einheit',
    description: 'Weitere Wohn-, Gewerbe- oder Stellplatzeinheiten anlegen',
    route: 'tenant-data/new',
    scope: 'property',
    icon: Plus,
    colorClass: 'bg-primary/10 text-primary',
  },
];

const MIETE: HubCard[] = [
  {
    key: 'tenant-data',
    title: 'Mieterdaten',
    description: 'Kontaktdaten und Unterlagen des aktuellen Mieters verwalten',
    route: 'tenant-data',
    scope: 'unit',
    icon: Users,
    colorClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    key: 'tenant-agreement',
    title: 'Mietvertrag',
    description: 'Mietkonditionen, Anpassungen und Dokumente verwalten',
    route: 'tenant-agreement',
    scope: 'unit',
    icon: FileSignature,
    colorClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    key: 'tenant-history',
    title: 'Mieter-Historie',
    description: 'Alle bisherigen Mietverhältnisse und Mieterwechsel einsehen',
    route: 'tenant-history',
    scope: 'unit',
    icon: History,
    colorClass: 'bg-muted text-muted-foreground',
  },
  {
    key: 'rental-trends',
    title: 'Mietentwicklung',
    description: 'Entwicklung der Mietpreise über die Zeit analysieren',
    route: 'rental-trends',
    scope: 'unit',
    icon: TrendingUp,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'tenant-move-out',
    title: 'Mieterauszug',
    description: 'Abnahmeprotokoll erstellen und Übergabe dokumentieren',
    route: 'tenant-move-out',
    scope: 'unit',
    icon: DoorOpen,
    colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
];

const FINANZEN_DOKUMENTE: HubCard[] = [
  {
    key: 'service-charge-settlement',
    title: 'Nebenkostenabrechnung',
    description: 'Jährliche Nebenkostenabrechnungen erstellen und verwalten',
    route: 'service-charge-settlement',
    scope: 'unit',
    icon: Receipt,
    colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    key: 'tax-documents',
    title: 'Steuerunterlagen',
    description: 'Belege und Dokumente für die Steuererklärung sammeln',
    route: 'tax-documents',
    scope: 'property',
    icon: Landmark,
    colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    key: 'key-metrics',
    title: 'Kennzahlen',
    description: 'Rendite, KPF und weitere Kennzahlen im Überblick auswerten',
    route: 'key-metrics',
    scope: 'property',
    icon: BarChart3,
    colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'contractors',
    title: 'Handwerker',
    description: 'Handwerksaufträge verwalten und Angebote einholen',
    route: 'contractors',
    scope: 'property',
    icon: Wrench,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
];

const WEITERE_AKTIONEN: HubCard[] = [
  {
    key: 'sale',
    title: 'Verkauf',
    description: 'Verkaufsprozess einleiten und Unterlagen vorbereiten',
    route: 'sale',
    scope: 'property',
    icon: ShoppingCart,
    colorClass: 'bg-muted text-muted-foreground',
  },
];

function HubCardTile({ card, propertyId, unitId }: { card: HubCard; propertyId: string; unitId: string | null }) {
  const router = useRouter();
  const Icon = card.icon;
  const href = card.scope === 'unit' && unitId
    ? `/existing-properties/${propertyId}/${card.route}/${unitId}`
    : `/existing-properties/${propertyId}/${card.route}`;
  return (
    <button
      type="button"
      onClick={() => card.onClick ? card.onClick() : router.push(href)}
      className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", card.colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-semibold text-foreground">{card.title}</p>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
    </button>
  );
}

export default function PropertyHub({ propertyId, unitId }: { propertyId: string; unitId: string | null }) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOverview | null>(null);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const id = parseInt(propertyId, 10);
    Promise.all([getPropertyOverviewById(id), getPropertyUnitsByProperty(id)]).then(([p, foundUnits]) => {
      setProperty(p);
      setUnits(foundUnits);
      setIsLoading(false);
    });
  }, [propertyId]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const success = await deleteProperty(parseInt(propertyId, 10));
    setIsDeleting(false);
    if (success) {
      router.push('/existing-properties');
    }
  };

  if (isLoading) return <PropertyLoadingPage />;

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Objekt nicht gefunden</p>
      </div>
    );
  }

  const unit = unitId ? units.find((u) => u.propertyUnitId === Number(unitId)) ?? null : null;

  if (unitId && !unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Einheit nicht gefunden</p>
      </div>
    );
  }

  const photo = base64ToDataUri(property.imageUrl);
  const categoryLabel = property.propertyCategory
    ? PROPERTY_CATEGORY_LABEL[property.propertyCategory] ?? property.propertyCategory
    : null;

  // Unit-scoped tiles (Mieterdaten, Mietvertrag, Nebenkostenabrechnung, …) only
  // make sense once an Einheit is selected — with none yet, only property-wide
  // setup actions (Objektdaten, Neue Einheit, …) are shown.
  const showUnitSections = unit !== null;
  const addressHref = units.length > 1 ? `/existing-properties/${propertyId}` : undefined;

  const breadcrumbItems: BreadcrumbItem[] = unit
    ? [
      BESTANDSOBJEKTE_BREADCRUMB_ROOT,
      { label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`, href: addressHref },
      { label: formatUnitLabel(unit.unitLabel, unit.floor, unit.locationNote) },
    ]
    : [
      BESTANDSOBJEKTE_BREADCRUMB_ROOT,
      { label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}` },
    ];

  const weitereAktionen: HubCard[] = [
    ...WEITERE_AKTIONEN,
    {
      key: 'delete-property',
      title: 'Löschung',
      description: 'Bestandsobjekt und alle Daten endgültig entfernen',
      route: '',
      scope: 'property',
      icon: Trash2,
      colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      onClick: () => setDeleteModalOpen(true),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <Header
          items={breadcrumbItems}
          image={
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                !photo && "bg-primary/10"
              )}
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Home className="w-5 h-5 text-primary" />
              )}
            </div>
          }
        />
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {categoryLabel && <Tag label={categoryLabel} variant="muted" />}
          <Tag label={`${property.squareMeters} m²`} variant="muted" />
          <Tag label={`Baujahr ${property.yearOfConstruction}`} variant="muted" />
          <Tag label={property.isRented ? 'Vermietet' : 'Unvermietet'} variant={property.isRented ? 'success' : 'warning'} />
        </div>

        {!showUnitSections && (
          <div className="mt-6 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground">
            Für dieses Objekt ist noch keine Einheit angelegt. Lege eine Einheit an, um Mieterdaten, Mietvertrag und weitere Funktionen zu nutzen.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Objektverwaltung</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OBJEKTVERWALTUNG.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} unitId={unitId} />
            ))}
          </div>
        </div>

        {showUnitSections && (
          <div className="mt-8 flex flex-col gap-3">
            <SectionLabel>Miete</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MIETE.map((card) => (
                <HubCardTile key={card.key} card={card} propertyId={propertyId} unitId={unitId} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Finanzen &amp; Dokumente</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FINANZEN_DOKUMENTE.filter((card) => showUnitSections || card.scope === 'property').map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} unitId={unitId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Weitere Aktionen</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weitereAktionen.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} unitId={unitId} />
            ))}
          </div>
        </div>
      </main>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        title="Objekt löschen"
        confirmDisabled={isDeleting}
      >
        <p className="text-sm text-muted-foreground">
          Möchten Sie <span className="font-medium text-foreground">{property.street} {property.houseNumber}</span>,{' '}
          {property.postalCode} {property.city} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
