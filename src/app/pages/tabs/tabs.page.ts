import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, ModalController } from '@ionic/angular';

import { AddMedicationPage } from '../add-medication/add-medication.page';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  async openAdd(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddMedicationPage,
      initialBreakpoint: 0.9,
      breakpoints: [0, 0.9],
      backdropDismiss: true,
      cssClass: 'custom-modal'
    });
    
    await modal.present();

    // Wait for the modal to close
    const { data } = await modal.onDidDismiss();
    
    // If a medication was added successfully...
    if (data && data.added) {
      // 1. Force navigation to the Home tab
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      
      // 2. Tell the Home page to reload its data
      window.dispatchEvent(new CustomEvent('medicationAdded'));
    }
  }
}