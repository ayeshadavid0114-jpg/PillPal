import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { Medication } from '../models/medication.model';

const MEDS_KEY = 'medications';

@Injectable({ providedIn: 'root' })
export class MedicationService {

  async getAll(): Promise<Medication[]> {
    const { value } = await Preferences.get({ key: MEDS_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getById(id: string): Promise<Medication | undefined> {
    const all = await this.getAll();
    return all.find(m => m.id === id);
  }

  async add(med: Medication): Promise<void> {
    const all = await this.getAll();
    all.push(med);
    await Preferences.set({ key: MEDS_KEY, value: JSON.stringify(all) });
  }

  async update(updatedMed: Medication): Promise<void> {
  const all = await this.getAll();
  const index = all.findIndex(m => m.id === updatedMed.id);
  
  if (index !== -1) {
    all[index] = updatedMed; // Replace the old med with the new one
    await Preferences.set({ key: MEDS_KEY, value: JSON.stringify(all) });
  }
}

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(m => m.id !== id);
    await Preferences.set({ key: MEDS_KEY, value: JSON.stringify(filtered) });
  }

  async reset(): Promise<void> {
    await Preferences.remove({ key: MEDS_KEY });
  }

  
}