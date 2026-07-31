"use client";

import { Button, Modal } from "@/components/ui";
import { BUTTON_DETAILS } from "@/constants/ButtonLabels";
import type { ReactNode } from "react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDeleteModal({ open, onCancel, onConfirm, title, children, confirmDisabled }: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      icon={<BUTTON_DETAILS.Delete.icon />}
      footer={
        <>
          <Button
            label={BUTTON_DETAILS.Cancel.label}
            icon={<BUTTON_DETAILS.Cancel.icon />}
            variant="outline"
            onClick={onCancel}
          />
          <Button
            label={BUTTON_DETAILS.Delete.label}
            icon={<BUTTON_DETAILS.Delete.icon />}
            variant="primary"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={confirmDisabled}
            onClick={onConfirm}
          />
        </>
      }
    >
      {children}
    </Modal>
  );
}
