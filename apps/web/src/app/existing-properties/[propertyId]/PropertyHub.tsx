"use client";

import { PROPERTY_CATEGORY_LABEL } from '@/components/features/PropertyDisplay';
import { Button, Header, Modal, Tag } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { deleteProperty, getPropertyOverviewById, type PropertyOverview } from '@/lib/supabase/property.supabase';
import { base64ToDataUri, cn } from '@/lib/utils';
import {
  BarChart3,
  Clock,
  Database,
  DoorOpen,
  History,
  Home,
  Landmark,
  PieChart,
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
    title: 'Objektdaten bearbeiten',
    description: 'Adresse, Fläche, Baujahr und weitere Stammdaten',
    route: 'property-data',
    icon: Database,
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'adjust-rnd',
    title: 'RND anpassen',
    description: 'Restnutzungsdauer individuell festlegen',
    route: 'adjust-rnd',
    icon: Clock,
    colorClass: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    key: 'adjust-distribution',
    title: 'Aufteilung Grund/Boden & Gebäude',
    description: 'Prozentuale Verteilung für die Abschreibung',
    route: 'adjust-distribution',
    icon: PieChart,
    colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
];

const MIETE: HubCard[] = [
  {
    key: 'tenant-data',
    title: 'Mieterdaten bearbeiten',
    description: 'Kontaktdaten und Mietvertrag des aktuellen Mieters',
    route: 'tenant-data',
    icon: Users,
    colorClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    key: 'tenant-history',
    title: 'Mieter-Historie',
    description: 'Alle bisherigen Mietverhältnisse einsehen',
    route: 'tenant-history',
    icon: History,
    colorClass: 'bg-muted text-muted-foreground',
  },
  {
    key: 'rental-trends',
    title: 'Mietentwicklung',
    description: 'Mietpreishistorie und Entwicklung analysieren',
    route: 'rental-trends',
    icon: TrendingUp,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'tenant-move-out',
    title: 'Mieterauszug',
    description: 'Abnahmeprotokoll erstellen und Übergabe dokumentieren',
    route: 'tenant-move-out',
    icon: DoorOpen,
    colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
];

const FINANZEN_DOKUMENTE: HubCard[] = [
  {
    key: 'service-charge-settlement',
    title: 'Nebenkostenabrechnung',
    description: 'Jahresabrechnungen erstellen und verwalten',
    route: 'service-charge-settlement',
    icon: Receipt,
    colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    key: 'tax-documents',
    title: 'Steuerunterlagen',
    description: 'Relevante Dokumente für die Steuererklärung',
    route: 'tax-documents',
    icon: Landmark,
    colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    key: 'key-metrics',
    title: 'Kennzahlen analysieren',
    description: 'Rendite, KPF und weitere Kennzahlen im Überblick',
    route: 'key-metrics',
    icon: BarChart3,
    colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'contractors',
    title: 'Handwerker beauftragen',
    description: 'Aufträge verwalten und Angebote einholen',
    route: 'contractors',
    icon: Wrench,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
];

const WEITERE_AKTIONEN: HubCard[] = [
  {
    key: 'sale',
    title: 'Verkaufen',
    description: 'Verkaufsprozess einleiten und Unterlagen vorbereiten',
    route: 'sale',
    icon: ShoppingCart,
    colorClass: 'bg-muted text-muted-foreground',
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
      {children}
    </p>
  );
}

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
      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
    </button>
  );
}

export default function PropertyHub({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getPropertyOverviewById(parseInt(propertyId, 10)).then((p) => {
      setProperty(p);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    );
  }

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

  const weitereAktionen: HubCard[] = [
    ...WEITERE_AKTIONEN,
    {
      key: 'delete-property',
      title: 'Objekt löschen',
      description: 'Bestandsobjekt endgültig entfernen',
      icon: Trash2,
      colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      onClick: () => setDeleteModalOpen(true),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Header
          items={[
            { label: 'Bestandsobjekte', href: '/existing-properties' },
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
        <p className="mt-2 ml-[3.25rem] text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {categoryLabel && (
            <>
              <span>{categoryLabel}</span>
              <span>·</span>
            </>
          )}
          <span>{property.squareMeters} m²</span>
          <span>·</span>
          <span>Baujahr {property.yearOfConstruction}</span>
          <span>·</span>
          <Tag label={property.isRented ? 'Vermietet' : 'Unvermietet'} variant={property.isRented ? 'success' : 'warning'} />
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <SectionTitle>Objektverwaltung</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OBJEKTVERWALTUNG.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionTitle>Miete</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MIETE.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionTitle>Finanzen &amp; Dokumente</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FINANZEN_DOKUMENTE.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SectionTitle>Weitere Aktionen</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weitereAktionen.map((card) => (
              <HubCardTile key={card.key} card={card} propertyId={propertyId} />
            ))}
          </div>
        </div>
      </main>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Objekt löschen"
        icon={<BUTTON_DETAILS.Delete.icon />}
        footer={
          <>
            <Button
              label={BUTTON_DETAILS.Cancel.label}
              icon={<BUTTON_DETAILS.Cancel.icon />}
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            />
            <Button
              label={BUTTON_DETAILS.Delete.label}
              icon={<BUTTON_DETAILS.Delete.icon />}
              variant="primary"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            />
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Möchten Sie <span className="font-medium text-foreground">{property.street} {property.houseNumber}</span>,{' '}
          {property.postalCode} {property.city} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </Modal>
    </div>
  );
}
