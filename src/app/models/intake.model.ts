export interface IntakeLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  date: string;          // "2026-05-05"
  scheduledTime: string; // "08:00"
  takenAt: string | null;
}