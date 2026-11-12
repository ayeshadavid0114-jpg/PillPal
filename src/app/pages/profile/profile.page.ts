import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonLabel, IonInput, IonButton, 
  IonIcon, ToastController, IonList, IonToggle, AlertController
} from '@ionic/angular';

import { UserProfile } from '../../models/profile.model';
import { IntakeService } from '../../services/intake.service';
import { MedicationService } from '../../services/medication.service';
import { NotificationService } from '../../services/notification.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton, 
    IonIcon, IonList, IonToggle
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  private profileService = inject(ProfileService);
  private toast = inject(ToastController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // <-- Forces UI updates
  
  private notif = inject(NotificationService);
  private meds = inject(MedicationService);
  private intake = inject(IntakeService);
  private alert = inject(AlertController);

  profile: UserProfile = { name: '', notificationsEnabled: true };
  isEditing = false;
  notificationsEnabled = false;

  // This runs EVERY TIME you tap the Profile tab
  async ionViewWillEnter(): Promise<void> {
    // 1. Get the latest profile
    const savedProfile = await this.profileService.get();
    if (savedProfile) {
      this.profile = { ...savedProfile };
    }
    
    // 2. Default to TRUE if it's a new user
    if (this.profile.notificationsEnabled === undefined) {
      this.profile.notificationsEnabled = true;
    }
    
    // 3. Check if permission is granted, BUT keep the toggle ON by default
    const hasPermission = await this.notif.checkPermission();

    // If they haven't explicitly turned it off, keep it ON in the UI
    this.notificationsEnabled = this.profile.notificationsEnabled && (hasPermission || this.profile.notificationsEnabled);
    
    // 4. Force Angular to repaint the screen with the new name
    this.cdr.detectChanges();
  }

  toggleEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileService.get().then(p => this.profile = p);
  }

  async save(): Promise<void> {
    if (!this.profile.name || this.profile.name.trim().length < 2) {
      const t = await this.toast.create({ message: 'Name must be 2+ characters', duration: 1500, color: 'warning' });
      t.present();
      return;
    }

    await this.profileService.save(this.profile);
    this.isEditing = false;

    const t = await this.toast.create({ message: 'Profile updated', duration: 1000, color: 'success' });
    t.present();
  }

    async toggleNotifications(ev: any): Promise<void> {
    const enabled = ev.detail.checked;
    this.notificationsEnabled = enabled;
    
    // Save the preference to the profile
    this.profile.notificationsEnabled = enabled;
    await this.profileService.save(this.profile);

    if (enabled) {
      const ok = await this.notif.init();
      if (ok) {
        const all = await this.meds.getAll();
        for (const m of all) await this.notif.scheduleForMedication(m);
      }
    } else {
      await this.notif.cancelAll();
    }
  }

  async resetAll(): Promise<void> {
    const a = await this.alert.create({
      header: 'Reset all data?',
      message: 'This deletes your profile, medications, and logs. Cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.notif.cancelAll();
            await this.meds.reset();
            await this.intake.reset();
            await this.profileService.reset();
            
            const t = await this.toast.create({ message: 'All data cleared', duration: 1500 });
            t.present();
            
            this.router.navigateByUrl('/onboarding', { replaceUrl: true });
          },
        },
      ],
    });
    await a.present();
  }
}