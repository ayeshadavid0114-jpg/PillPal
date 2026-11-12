import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonInput, IonButton, IonIcon, ToastController } from '@ionic/angular';

import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private toast = inject(ToastController);

  name = '';
  saving = false;

  async continue(): Promise<void> {
    const clean = this.name.trim();
    
    if (clean.length < 2) {
      const t = await this.toast.create({
        message: 'Please enter your name',
        duration: 1500,
        color: 'warning',
      });
      await t.present();
      return;
    }

    this.saving = true;
    
    try {
      await this.profileService.save({ name: clean, notificationsEnabled: true });
      this.saving = false;
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (e) {
      console.error('Save failed:', e);
      this.saving = false;
    }
  }
}