// Import your icons (example using lucide-react)
import { 
  X, Save, ArrowLeft, ArrowRight, CornerUpLeft, 
  Plus, Briefcase, FileText, Play, Download, 
  Edit3, Calculator 
} from 'lucide-react';

// 1. Define the button types (keys) as an Enum
export enum ButtonType {
  Cancel = 'Cancel',
  Save = 'Save',
  Previous = 'Previous',
  Next = 'Next',
  Back = 'Back',
  Create = 'Create',
  UseCases = 'UseCases',
  RequestAppraisal = 'RequestAppraisal',
  Start = 'Start',
  ImportData = 'ImportData',
  EnterManually = 'EnterManually',
  Calculate = 'Calculate'
}

// 2. Define the structure for your button properties
export interface ButtonConfig {
  label: string;
  icon: React.ElementType; // Use 'string' if you use image paths instead of component references
}

// 3. Create the mapping object that combines the label and the icon
export const BUTTON_DETAILS: Record<ButtonType, ButtonConfig> = {
  [ButtonType.Cancel]:           { label: 'Abbrechen',           icon: X },
  [ButtonType.Save]:             { label: 'Speichern',           icon: Save },
  [ButtonType.Previous]:         { label: 'Vorheriges',          icon: ArrowLeft },
  [ButtonType.Next]:             { label: 'Nächstes',            icon: ArrowRight },
  [ButtonType.Back]:             { label: 'Zurück',              icon: CornerUpLeft },
  [ButtonType.Create]:           { label: 'Erstellen',           icon: Plus },
  [ButtonType.UseCases]:         { label: 'Anwendungsfall',      icon: Briefcase },
  [ButtonType.RequestAppraisal]: { label: 'Gutachten anfordern', icon: FileText },
  [ButtonType.Start]:            { label: 'Starten',             icon: Play },
  [ButtonType.ImportData]:       { label: 'Daten importieren',   icon: Download },
  [ButtonType.EnterManually]:    { label: 'Manuell eingeben',    icon: Edit3 },
  [ButtonType.Calculate]:        { label: 'Berechne',            icon: Calculator }
};