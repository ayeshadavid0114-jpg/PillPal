import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonButton, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { IntakeLog } from '../../models/intake.model';
import { UserProfile } from '../../models/profile.model';
import { IntakeService } from '../../services/intake.service';
import { MedicationService } from '../../services/medication.service';
import { ProfileService } from '../../services/profile.service';
import { MedicationDetailsPage } from '../medication-details/medication-details.page';

interface DayCell {
  date: Date;
  dateStr: string;
  label: string;
  num: number;
  hasLogs: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private intakeService = inject(IntakeService);
  private medService = inject(MedicationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private modalCtrl = inject(ModalController); 

  profile: UserProfile = { name: '', notificationsEnabled: true };
  greetingText = ''; 
  weekDays: DayCell[] = [];
  selectedDateStr = '';
  logs: IntakeLog[] = [];
  remainingCount = 0;
  
  private profileSub!: Subscription;
  private logSub!: Subscription;

  ngOnInit(): void {
    this.profileSub = this.profileService.profile$.subscribe(profile => {
      if (profile) {
        this.profile = profile;
        this.updateGreetingText();
        this.cdr.detectChanges();
      }
    });

    this.logSub = this.intakeService.logsUpdated$.subscribe(async () => {
      await this.loadMedicationsForDate(this.selectedDateStr || this.toDateStr(new Date()));
      await this.buildWeekStrip();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.profileSub) this.profileSub.unsubscribe();
    if (this.logSub) this.logSub.unsubscribe();
  }

  async ionViewWillEnter(): Promise<void> {
    this.profile = await this.profileService.get();
    this.updateGreetingText();
    
    if (!this.selectedDateStr) {
      this.selectedDateStr = this.toDateStr(new Date());
    }
    
    await this.buildWeekStrip();
    await this.loadMedicationsForDate(this.selectedDateStr); 
    this.cdr.detectChanges();
  }

  updateGreetingText(): void {
    const h = new Date().getHours();
    let timeOfDay = 'Good evening';
    if (h < 12) timeOfDay = 'Good morning';
    else if (h < 18) timeOfDay = 'Good afternoon';

    if (this.profile.name && this.profile.name.trim() !== '') {
      this.greetingText = `${timeOfDay}, ${this.profile.name}`;
    } else {
      this.greetingText = timeOfDay;
    }
  }

  async buildWeekStrip(): Promise<void> {
    const today = new Date();
    const todayStr = this.toDateStr(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 2);

    const withLogs = new Set(await this.intakeService.getDatesWithLogs());

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ds = this.toDateStr(d);
      return {
        date: d,
        dateStr: ds,
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        num: d.getDate(),
        hasLogs: withLogs.has(ds),
        isToday: ds === todayStr,
      };
    });
  }

  async selectDay(day: DayCell): Promise<void> {
    this.selectedDateStr = day.dateStr;
    await this.loadMedicationsForDate(day.dateStr);
    this.cdr.detectChanges(); 
  }

  async loadMedicationsForDate(dateStr: string): Promise<void> {
    this.logs = await this.intakeService.getLogsForDate(dateStr);
    this.logs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    this.remainingCount = this.logs.filter(l => !l.takenAt).length;
  }

  async openMedicationDetails(log: IntakeLog): Promise<void> {
    const allMeds = await this.medService.getAll();
    const actualMed = allMeds.find(m => m.id === log.medicationId);

    if (!actualMed) {
      console.warn('Medication not found');
      return;
    }

    // BUKASAN ANG MODAL NA MAY AUTO-HEIGHT CLASS
    const modal = await this.modalCtrl.create({
      component: MedicationDetailsPage,
      componentProps: {
        medication: actualMed,
        log: log 
      },
      cssClass: 'auto-height-modal', // <--- ITO ANG MAG-AYOS SA SPACE SA BABA
    });
    
    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      await this.loadMedicationsForDate(this.selectedDateStr);
      await this.buildWeekStrip();
      this.cdr.detectChanges();
    }
  }

  goProfile(): void { 
    this.router.navigate(['/tabs/profile']); 
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatTime(isoString: string | null): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private toDateStr(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}