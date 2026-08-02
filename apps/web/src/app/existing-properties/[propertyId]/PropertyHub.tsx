"use client";

import { BESTANDSOBJEKTE_BREADCRUMB_ROOT, PROPERTY_CATEGORY_LABEL, PropertyLoadingPage } from '@/components/features/PropertyDisplay';
import { ConfirmDeleteModal, Header, SectionLabel, Tag } from '@/components/ui';
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
  FileText,
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
  /** Navigates to `/existing-properties/{propertyId}/{route}` when set. */
  route?: string;
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
    description: 'Adresse, Fläche, Baujahr und weitere Stammdaten des Objekts pflegen',
    route: 'property-data',
    icon: Database,
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'adjust-rnd',
    title: 'Restnutzungsdauer',
    description: 'Individuelle Restnutzungsdauer für die Abschreibung festlegen und anpassen',
    route: 'adjust-rnd',
    icon: Clock,
    colorClass: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    key: 'adjust-distribution',
    title: 'Kaufpreisaufteilung',
    description: 'Prozentuale Verteilung des Kaufpreises auf Grundstück und Gebäude für die Abschreibung',
    route: 'adjust-distribution',
    icon: PieChart,
    colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    key: 'tenant-data-new',
    title: 'Neue Einheit',
    description: 'Weitere Wohn-, Gewerbe- oder Stellplatzeinheiten für dieses Objekt anlegen',
    route: 'tenant-data/new',
    icon: Plus,
    colorClass: 'bg-primary/10 text-primary',
  },
];

const MIETE: HubCard[] = [
  {
    key: 'tenant-data',
    title: 'Mieterdaten',
    description: 'Kontaktdaten, Mietvertrag und Unterlagen des aktuellen Mieters verwalten',
    route: 'tenant-data',
    icon: Users,
    colorClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    key: 'tenant-history',
    title: 'Mieter-Historie',
    description: 'Übersicht aller bisherigen Mietverhältnisse und Mieterwechsel einsehen',
    route: 'tenant-history',
    icon: History,
    colorClass: 'bg-muted text-muted-foreground',
  },
  {
    key: 'rental-trends',
    title: 'Mietentwicklung',
    description: 'Entwicklung der Mietpreise über die Zeit auswerten und analysieren',
    route: 'rental-trends',
    icon: TrendingUp,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'tenant-move-out',
    title: 'Mieterauszug',
    description: 'Abnahmeprotokoll erstellen und die Wohnungsübergabe dokumentieren',
    route: 'tenant-move-out',
    icon: DoorOpen,
    colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
];

const FINANZEN_DOKUMENTE: HubCard[] = [
  {
    key: 'service-charge-settlement',
    title: 'Nebenkostenabrechnung',
    description: 'Jährliche Nebenkostenabrechnungen erstellen, prüfen und verwalten',
    route: 'service-charge-settlement',
    icon: Receipt,
    colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    key: 'tax-documents',
    title: 'Steuerunterlagen',
    description: 'Relevante Belege und Dokumente für die Steuererklärung sammeln',
    route: 'tax-documents',
    icon: Landmark,
    colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    key: 'key-metrics',
    title: 'Kennzahlen',
    description: 'Rendite, KPF und weitere Kennzahlen des Objekts im Überblick auswerten',
    route: 'key-metrics',
    icon: BarChart3,
    colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'contractors',
    title: 'Handwerker',
    description: 'Handwerksaufträge verwalten sowie Angebote einholen und vergleichen',
    route: 'contractors',
    icon: Wrench,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
];

const WEITERE_AKTIONEN: HubCard[] = [
  {
    key: 'sale',
    title: 'Verkauf',
    description: 'Verkaufsprozess einleiten und alle nötigen Unterlagen vorbereiten',
    route: 'sale',
    icon: ShoppingCart,
    colorClass: 'bg-muted text-muted-foreground',
  },
];

function HubCardTile({ card, propertyId }: { card: HubCard; propertyId: string }) {
  const router = useRouter();
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => card.onClick ? card.onClick() : router.push(`/existing-properties/${propertyId}/${card.route}`)}
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

export default function PropertyHub({ propertyId }: { propertyId: string }) {
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

  const photo = base64ToDataUri(property.imageUrl);
  const categoryLabel = property.propertyCategory
    ? PROPERTY_CATEGORY_LABEL[property.propertyCategory] ?? property.propertyCategory
    : null;

  // Generieren shortcuts need a single, unambiguous unit to target — with
  // several Wohneinheiten the user picks one first via Mieterdaten.
  const singleUnit = units.length === 1 ? units[0] : null;
  const miete: HubCard[] = [
    ...MIETE,
    ...(singleUnit ? [
      {
        key: 'certificate-generate',
        title: 'Mieterbescheinigung',
        description: 'Offizielle Bescheinigung des Mietverhältnisses für den aktuellen Mieter erstellen',
        route: `tenant-data/unit/${singleUnit.propertyUnitId}/certificate`,
        icon: FileText,
        colorClass: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      },
      {
        key: 'rental-agreement-generate',
        title: 'Mietvertrag',
        description: 'Standardisierten Mietvertrag für Wohnraum automatisch erstellen',
        route: `tenant-data/unit/${singleUnit.propertyUnitId}/rental-agreement`,
        icon: FileSignature,
        colorClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      },
    ] : []),
  ];

  const weitereAktionen: HubCard[] = [
    ...WEITERE_AKTIONEN,
    {
      key: 'delete-property',
      title: 'Löschung',
      description: 'Dieses Bestandsobjekt und alle zugehörigen Daten endgültig entfernen',
      icon: Trash2,
      colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      onClick: () => setDeleteModalOpen(true),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <Header
          items={[
            BESTANDSOBJEKTE_BREADCRUMB_ROOT,
            { label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}` },
          ]}
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

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Objektverwaltung</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OBJEKTVERWALTUNG.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Miete</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {miete.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Finanzen &amp; Dokumente</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FINANZEN_DOKUMENTE.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionLabel>Weitere Aktionen</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weitereAktionen.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
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
