"use client";

import { Icons } from "@/components/common";
import { Button, Modal } from "@/components/ui";
import { BUTTON_DETAILS } from "@/constants/ButtonLabels";

interface UnsavedChangesModalProps {
  open: boolean;
  /** Keep editing — closes the dialog without navigating. */
  onCancel: () => void;
  /** Confirm — discards the changes and lets navigation proceed. */
  onDiscard: () => void;
  /** e.g. "an der Restnutzungsdauer" — appended to the default sentence. */
  context?: string;
}

export function UnsavedChangesModal({ open, onCancel, onDiscard, context }: UnsavedChangesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Änderungen verwerfen?"
      icon={<Icons.AlertTriangle />}
      footer={
        <>
          <Button
            label={BUTTON_DETAILS.Cancel.label}
            icon={<BUTTON_DETAILS.Cancel.icon />}
            variant="outline"
            onClick={onCancel}
          />
          <Button
            label={BUTTON_DETAILS.Discard.label}
            icon={<BUTTON_DETAILS.Discard.icon />}
            variant="primary"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDiscard}
          />
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Sie haben ungespeicherte Änderungen{context ? ` ${context}` : ''}. Möchten Sie diese wirklich verwerfen?
      </p>
    </Modal>
  );
}
