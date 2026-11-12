export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  active: boolean;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  frequency?: number; // 1 = Once, 2 = Twice, 3 = Thrice
  pillsLeft?: number | null; // <-- DAPAT MAY | null ITO
}