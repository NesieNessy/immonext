"use client";

import { Button, Modal, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useState } from 'react';

interface Props {
  portalUrl: string;
  onPortalUrlChange: (value: string) => void;
}

/**
 * "Daten importieren" trigger + divider + the (currently stubbed) URL import
 * modal, shared between the quick-check creation form and the result/edit view.
 */
export function QuickCheckImportSection({ portalUrl, onPortalUrlChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={BUTTON_DETAILS.ImportData.label}
        subtitle="Immobiliendaten aus einem Portal laden"
        icon={<BUTTON_DETAILS.ImportData.icon />}
        footer={
          <>
            <Button
              label={BUTTON_DETAILS.Cancel.label}
              icon={<BUTTON_DETAILS.Cancel.icon />}
              variant="outline"
              onClick={() => setModalOpen(false)}
            />
            <Button
              label={BUTTON_DETAILS.ImportData.label}
              icon={<BUTTON_DETAILS.ImportData.icon />}
              variant="primary"
              disabled
              title="URL-Import ist noch nicht verfügbar"
            />
          </>
        }
      >
        <TextField
          label="Portal-URL"
          placeholder="https://immobilienscout24.de/expose/..."
          helperText="Unterstützte Portale: ImmobilienScout24, Immowelt, Immonet"
          value={portalUrl}
          onChange={(e) => onPortalUrlChange(e.target.value)}
        />
      </Modal>

      <Button
        label={BUTTON_DETAILS.ImportData.label}
        icon={<BUTTON_DETAILS.ImportData.icon />}
        variant="outline"
        onClick={() => setModalOpen(true)}
        className="w-full mb-3"
      />

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">oder manuell ausfüllen</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </>
  );
}
