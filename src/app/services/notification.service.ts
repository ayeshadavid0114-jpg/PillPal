import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

import { Medication } from '../models/medication.model';

const CHANNEL_ID = 'pillpal-reminders-v2'; 

@Injectable({ providedIn: 'root' })
export class NotificationService {

  async init(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false; 
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID, name: 'Medication Reminders',
        description: 'Reminds you to take your medicine',
        importance: 5, visibility: 1, vibration: true, sound: 'default',
      });
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;

      const exactSetting = await LocalNotifications.checkExactNotificationSetting();
      if (exactSetting.exact_alarm !== 'granted') {
        await LocalNotifications.changeExactNotificationSetting();
      }

      await LocalNotifications.addListener('localNotificationReceived', async () => {
        try { await Haptics.vibrate({ duration: 5000 }); } catch (e) { console.warn(e); }
      });
      return true;
    } catch (e) {
      console.warn('Notification init failed:', e);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const perm = await LocalNotifications.checkPermissions();
      return perm.display === 'granted';
    } catch { return false; }
  }

  async scheduleForMedication(med: Medication): Promise<void> {
    try {
      if (!med || !med.time || !med.time.includes(':')) return;
      const granted = await this.checkPermission();
      if (!granted) return;

      const [hour, minute] = med.time.split(':').map(Number);
      
      // PALITAN ITO NG CONST
      const times = [{ hour, minute }];

      if (med.frequency === 2) {
        times.push({ hour: (hour + 12) % 24, minute });
      } else if (med.frequency === 3) {
        times.push({ hour: (hour + 8) % 24, minute });
        times.push({ hour: (hour + 16) % 24, minute });
      }

      for (let i = 0; i < times.length; i++) {
        await LocalNotifications.schedule({
          notifications: [{
            id: this.hashId((med.id || Math.random().toString()) + i), 
            title: 'PillPal Reminder',
            body: `Time to take ${med.name} (${med.dose}mg)`,
            schedule: { on: times[i], repeats: true, allowWhileIdle: true },
            channelId: CHANNEL_ID,
          }],
        });
      }
    } catch (e) { console.warn('Failed to schedule:', e); }
  }

  async cancelAll(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      await LocalNotifications.cancel({ notifications: pending.notifications });
    } catch (e) { 
      // PALITAN ANG EMPTY CATCH NG GANITO
      console.warn('Cancel all failed:', e);
    }
  }

  private hashId(uuid: string): number {
    let h = 0;
    for (let i = 0; i < uuid.length; i++) { h = (h * 31 + uuid.charCodeAt(i)) | 0; }
    return Math.abs(h) % 2147483647;
  }
}