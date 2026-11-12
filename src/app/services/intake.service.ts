import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

import { IntakeLog } from '../models/intake.model';
import { uuid } from '../utils/uuid';

const LOGS_KEY = 'intake_logs';

@Injectable({ providedIn: 'root' })
export class IntakeService {
  public logsUpdated$ = new BehaviorSubject<boolean>(false);

  async getAll(): Promise<IntakeLog[]> {
    const { value } = await Preferences.get({ key: LOGS_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getLogsForDate(dateStr: string): Promise<IntakeLog[]> {
    const all = await this.getAll();
    return all.filter(l => l.date === dateStr).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }

  async getDatesWithLogs(): Promise<string[]> {
    const all = await this.getAll();
    return Array.from(new Set(all.map(l => l.date)));
  }

  private getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async createLogsForDateRange(
    medId: string, name: string, dose: string, time: string, startDate: string, endDate: string, frequency: number = 1
  ): Promise<void> {
    const all = await this.getAll();
    const start = new Date(startDate + 'T00:00:00');
    const end = endDate ? new Date(endDate + 'T00:00:00') : new Date(startDate + 'T00:00:00');
    const todayStr = this.getTodayStr();
    const current = new Date(start);

    let times: string[] = [time];
    if (frequency === 2) {
      const [h, m] = time.split(':').map(Number);
      times = [time, `${String((h + 12) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`];
    } else if (frequency === 3) {
      const [h, m] = time.split(':').map(Number);
      times = [
        time, 
        `${String((h + 8) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        `${String((h + 16) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      ];
    }

    while (current <= end) {
      const dateStr = this.toDateStr(current);
      if (dateStr >= todayStr) {
        for (const t of times) {
          const exists = all.some(l => l.medicationId === medId && l.date === dateStr && l.scheduledTime === t);
          if (!exists) {
            all.push({
              id: uuid(), medicationId: medId, medicationName: name, dose: dose,
              date: dateStr, scheduledTime: t, takenAt: null,
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }
    await Preferences.set({ key: LOGS_KEY, value: JSON.stringify(all) });
    this.logsUpdated$.next(true);
  }

  async ensureTodayLogs(meds: any[]): Promise<void> {
    const today = this.getTodayStr();
    const all = await this.getAll();
    let changed = false;

    for (const m of meds) {
      const start = m.startDate ? new Date(m.startDate + 'T00:00:00') : new Date();
      const end = m.endDate ? new Date(m.endDate + 'T00:00:00') : null;
      const todayDate = new Date(today + 'T00:00:00');

      if (todayDate < start) continue;
      if (end && todayDate > end) continue;

      const exists = all.some(l => l.medicationId === m.id && l.date === today);
      if (!exists) {
        all.push({
          id: uuid(), medicationId: m.id, medicationName: m.name, dose: m.dose,
          date: today, scheduledTime: m.time, takenAt: null,
        });
        changed = true;
      }
    }
    if (changed) {
      await Preferences.set({ key: LOGS_KEY, value: JSON.stringify(all) });
      this.logsUpdated$.next(true);
    }
  }

  async markTaken(logId: string): Promise<void> {
    const all = await this.getAll();
    const log = all.find(l => l.id === logId);
    if (!log) return;
    log.takenAt = new Date().toISOString();
    await Preferences.set({ key: LOGS_KEY, value: JSON.stringify(all) });
    this.logsUpdated$.next(true);
  }

  async deleteLogsForMedication(medId: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(l => l.medicationId !== medId);
    await Preferences.set({ key: LOGS_KEY, value: JSON.stringify(filtered) });
    this.logsUpdated$.next(true);
  }

  async updateLogsForMedication(medId: string, newName: string, newDose: string, newTime: string): Promise<void> {
    const all = await this.getAll();
    let changed = false;
    for (const log of all) {
      if (log.medicationId === medId) {
        log.medicationName = newName;
        log.dose = newDose;
        log.scheduledTime = newTime; 
        changed = true;
      }
    }
    if (changed) {
      await Preferences.set({ key: LOGS_KEY, value: JSON.stringify(all) });
      this.logsUpdated$.next(true);
    }
  }

  async reset(): Promise<void> {
    await Preferences.remove({ key: LOGS_KEY });
    this.logsUpdated$.next(true);
  }
}