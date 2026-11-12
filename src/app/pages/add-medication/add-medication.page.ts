import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonIcon, ModalController, ToastController, NavParams,
  IonSelect, IonSelectOption
} from '@ionic/angular';

import { IntakeService } from '../../services/intake.service';
import { MedicationService } from '../../services/medication.service';
import { NotificationService } from '../../services/notification.service';
import { uuid } from '../../utils/uuid';

@Component({
  selector: 'app-add-medication',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonIcon, IonSelect, IonSelectOption,
  ],
  templateUrl: './add-medication.page.html',
  styleUrls: ['./add-medication.page.scss'],
})
export class AddMedicationPage {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private meds = inject(MedicationService);
  private intake = inject(IntakeService);
  private notif = inject(NotificationService);
  private navParams = inject(NavParams);

  isEditMode = false;
  medId = '';

  name = '';
  dose: number | null = null; 
  time = this.getCurrentTime(); 
  startDate = new Date().toISOString().split('T')[0]; 
  endDate = ''; 
  frequency = 1; 
  pillsLeft: number | null = null; 

  constructor() {
    const passedMed = this.navParams.get('medication');
    if (passedMed) {
      this.isEditMode = true;
      this.medId = passedMed.id;
      this.name = passedMed.name;
      this.dose = parseInt(passedMed.dose, 10);
      this.time = passedMed.time;
      this.startDate = passedMed.startDate || this.startDate;
      this.endDate = passedMed.endDate || '';
      this.frequency = passedMed.frequency || 1;
      this.pillsLeft = passedMed.pillsLeft ?? null;
    }
  }

  dismiss(): void { this.modalCtrl.dismiss(); }
  
  private getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  async save(): Promise<void> {
    if (!this.name.trim() || this.dose === null || this.dose <= 0 || !this.time) {
      const t = await this.toastCtrl.create({ 
        message: 'Please enter a valid name, numeric dose, and time.', duration: 2000, color: 'warning' 
      });
      t.present();
      return;
    }

    const med = {
      id: this.isEditMode ? this.medId : uuid(),
      name: this.name.trim(),
      dose: this.dose.toString(), 
      time: this.time,
      active: true,
      createdAt: new Date().toISOString(),
      startDate: this.startDate,
      endDate: this.endDate,
      frequency: this.frequency,
      pillsLeft: this.pillsLeft,
    };

    try {
      if (this.isEditMode) {
        await this.meds.update(med);
        await this.intake.deleteLogsForMedication(med.id);
        await this.notif.cancelAll(); 
        const allMeds = await this.meds.getAll();
        for (const m of allMeds) {
           if (m.active) await this.notif.scheduleForMedication(m);
        }
      } else {
        await this.meds.add(med);
        await this.notif.scheduleForMedication(med);
      }
      
      await this.intake.createLogsForDateRange(
        med.id, med.name, med.dose, med.time, med.startDate, med.endDate, med.frequency
      );

      this.intake.logsUpdated$.next(true);
      const t = await this.toastCtrl.create({ 
        message: this.isEditMode ? 'Medication updated!' : 'Medication added!', duration: 1500, color: 'success' 
      });
      t.present();
      this.modalCtrl.dismiss({ added: true });

    } catch (e) {
      console.error(e);
      const t = await this.toastCtrl.create({ message: 'Failed to save', duration: 1500, color: 'danger' });
      t.present();
    }
  }
}