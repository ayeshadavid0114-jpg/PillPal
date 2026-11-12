import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { IonContent, IonDatetime, IonIcon } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { IntakeLog } from '../../models/intake.model';
import { IntakeService } from '../../services/intake.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonContent, IonDatetime, IonIcon,
  ],
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit, OnDestroy {
  private intake = inject(IntakeService);
  private cdr = inject(ChangeDetectorRef);

  selectedDateStr = this.todayStr();
  dayLogs: IntakeLog[] = [];
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  
  private logSub!: Subscription;

  ngOnInit(): void {
    // Listen to updates from Add Medication or Mark Taken
    this.logSub = this.intake.logsUpdated$.subscribe(async () => {
      await this.loadHighlights();
      await this.loadDay();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.logSub) {
      this.logSub.unsubscribe();
    }
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadHighlights();
    await this.loadDay();
    this.cdr.detectChanges();
  }

  async loadHighlights(): Promise<void> {
    const dates = await this.intake.getDatesWithLogs();
    this.highlightedDates = dates.map(d => ({
      date: d,
      textColor: '#ffffff',
      backgroundColor: '#C94C3A',
    }));
  }

  async onDateChange(ev: any): Promise<void> {
    const value = ev.detail.value;
    this.selectedDateStr = typeof value === 'string'
      ? value.slice(0, 10)
      : value[0].slice(0, 10);
    await this.loadDay();
  }

  async loadDay(): Promise<void> {
    this.dayLogs = await this.intake.getLogsForDate(this.selectedDateStr);
    this.cdr.detectChanges();
  }

  private todayStr(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}