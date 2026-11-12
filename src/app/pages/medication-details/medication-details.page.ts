import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonContent, ModalController, AlertController, IonIcon } from '@ionic/angular';

import { IntakeLog } from '../../models/intake.model';
import { Medication } from '../../models/medication.model';
import { IntakeService } from '../../services/intake.service';
import { MedicationService } from '../../services/medication.service';
import { AddMedicationPage } from '../add-medication/add-medication.page';

@Component({
  selector: 'app-medication-details',
  standalone: true,
  imports: [IonIcon, CommonModule, IonContent],
  templateUrl: './medication-details.page.html',
  styleUrls: ['./medication-details.page.scss'],
})
export class MedicationDetailsPage {
  private modalCtrl = inject(ModalController);
  private intakeService = inject(IntakeService);
  private medService = inject(MedicationService);
  private alertCtrl = inject(AlertController);

  @Input() medication!: Medication;
  @Input() log!: IntakeLog;

  // IDINAGDAG ANG : void
  dismiss(): void {
    this.modalCtrl.dismiss({ updated: false });
  }

  // IDINAGDAG ANG : Promise<void>
  async markTaken(): Promise<void> {
    await this.intakeService.markTaken(this.log.id);
    
    if (this.medication.pillsLeft && this.medication.pillsLeft > 0) {
      this.medication.pillsLeft -= 1;
      await this.medService.update(this.medication);
    }

    this.modalCtrl.dismiss({ updated: true });
  }

  // IDINAGDAG ANG : Promise<void>
  async editMedication(): Promise<void> {
    await this.modalCtrl.dismiss({ updated: false });

    const modal = await this.modalCtrl.create({
      component: AddMedicationPage,
      componentProps: { medication: this.medication },
      initialBreakpoint: 0.9,
      breakpoints: [0, 0.9, 1],
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  // IDINAGDAG ANG : Promise<void>
  async deleteMedication(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Medication',
      message: 'Are you sure you want to delete this medication and all its reminders?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Delete', 
          role: 'destructive',
          handler: async (): Promise<void> => { // IDINAGDAG DIN DITO
            await this.intakeService.deleteLogsForMedication(this.medication.id);
            await this.medService.delete(this.medication.id); 
            this.modalCtrl.dismiss({ updated: true });
          }
        }
      ]
    });
    await alert.present();
  }
}