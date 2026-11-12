import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { IntakeService } from '../../services/intake.service';
import { MedicationService } from '../../services/medication.service';
import { NotificationService } from '../../services/notification.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, IonContent],
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private notif = inject(NotificationService);
  private meds = inject(MedicationService);
  private intake = inject(IntakeService);

  showLogo = false;
  loading = true;

  async ngOnInit(): Promise<void> {
    setTimeout(() => this.showLogo = true, 50);

    // Timer for splash screen
    const minSplash = new Promise(res => setTimeout(res, 1500));
    
    // Run work, but don't let it block forever
    const work = this.runStartup();

    await Promise.all([minSplash, work]);

    // Force navigation
    try {
      const hasName = await this.profileService.hasName(); 
      this.router.navigateByUrl(hasName ? '/tabs/home' : '/onboarding', { replaceUrl: true });
    } catch (e) {
      console.warn('Navigation fallback:', e);
      this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    }
  }

  private async runStartup(): Promise<void> {
    try {
      // Wrap each service call in its own try/catch so one failure doesn't stop the rest
      try { await this.notif.init(); } catch (e) { console.warn(e); }

      let allMeds: any[] = [];
      try { 
        allMeds = (await this.meds.getAll()).filter(m => m.active); 
      } catch (e) { console.warn(e); }

      try { await this.intake.ensureTodayLogs(allMeds); } catch (e) { console.warn(e); }

      for (const m of allMeds) {
        try { await this.notif.scheduleForMedication(m); } catch (e) { console.warn(e); }
      }
    } catch (e) {
      console.warn('Startup critical error (ignored):', e);
    }
  }
}