"use client";

import { Button, Dropdown, Modal } from '@/components/ui';
import { authFetch } from '@/lib/api/authFetch';
import { cn } from '@/lib/utils';
import { ArrowRight, ClipboardCheck, Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type PropertyCreationMode = 'manual' | 'detail-check';

interface DetailCheckOption {
  workflowId: string;
  label: string;
}

interface NewPropertyModalProps {
  open: boolean;
  onClose: () => void;
  /** No destination is built yet — the caller currently just receives the
   *  chosen mode/workflowId. Wire this up once the actual creation form
   *  (manual or pre-filled-from-detail-check) exists. */
  onContinue: (mode: PropertyCreationMode, workflowId: string | null) => void;
}

function OptionCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", selected ? "text-primary" : "text-foreground")}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div
        className={cn(
          "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
          selected ? "border-primary bg-primary" : "border-border"
        )}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
      </div>
    </button>
  );
}

/**
 * "Neues Objekt anlegen" — first step of the (not yet built) property
 * creation flow. Lets the user choose between a blank form or pre-filling
 * from an existing Detailbewertung, sourced from the same /api/detail-checks
 * route the Detailbewertungen overview uses.
 */
export function NewPropertyModal({ open, onClose, onContinue }: NewPropertyModalProps) {
  const [mode, setMode] = useState<PropertyCreationMode>('detail-check');
  const [workflowId, setWorkflowId] = useState('');
  const [options, setOptions] = useState<DetailCheckOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selection and (re-)load the detail-check list each time the
  // modal opens, so it reflects any detail checks saved since last time.
  useEffect(() => {
    if (!open) return;
    setMode('detail-check');
    setWorkflowId('');
    setIsLoading(true);
    authFetch('/api/detail-checks', { cache: 'no-store' })
      .then((res) => res.json())
      .then((rows: Array<{ workflow_id: string; street_house_number: string | null; city: string }>) => {
        setOptions(rows.map((row) => ({
          workflowId: row.workflow_id,
          label: `${row.street_house_number || 'Adresse noch nicht erfasst'}, ${row.city}`,
        })));
      })
      .catch(() => setOptions([]))
      .finally(() => setIsLoading(false));
  }, [open]);

  const canContinue = mode === 'manual' || workflowId !== '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Neues Objekt anlegen"
      subtitle="Möchten Sie Daten aus einer vorhandenen Detailbewertung übernehmen?"
      footer={
        <>
          <Button label="Abbrechen" variant="outline" onClick={onClose} />
          <Button
            label="Weiter"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
            variant="primary"
            disabled={!canContinue}
            onClick={() => onContinue(mode, mode === 'detail-check' ? workflowId : null)}
          />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <OptionCard
          icon={Edit3}
          title="Manuell erfassen"
          description="Alle Felder werden leer geöffnet und können manuell befüllt werden."
          selected={mode === 'manual'}
          onClick={() => setMode('manual')}
        />
        <OptionCard
          icon={ClipboardCheck}
          title="Aus Detailbewertung übernehmen"
          description="Adresse, Kaufdatum und Objektdaten werden aus einer Bewertung vorausgefüllt."
          selected={mode === 'detail-check'}
          onClick={() => setMode('detail-check')}
        />
      </div>

      {mode === 'detail-check' && (
        <Dropdown
          label="Detailbewertung auswählen"
          options={[
            { value: '', label: isLoading ? 'Wird geladen…' : '– Bitte auswählen –' },
            ...options.map((opt) => ({ value: opt.workflowId, label: opt.label })),
          ]}
          value={workflowId}
          onChange={(e) => setWorkflowId(e.target.value)}
          disabled={isLoading}
        />
      )}
    </Modal>
  );
}
