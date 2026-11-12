import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  homeOutline, calendarOutline, addCircle, settingsOutline, personOutline, 
  personCircleOutline, notificationsOutline, medkitOutline, checkmarkCircle, 
  timeOutline, alertCircle, cameraOutline, trashOutline, checkmarkCircleOutline,
  person, personAddOutline, arrowForwardOutline, pencilOutline, closeOutline, 
  checkmarkOutline, createOutline, heartOutline, heartSharp, chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

addIcons({
  homeOutline, calendarOutline, addCircle, settingsOutline, personOutline, 
  personCircleOutline, notificationsOutline, medkitOutline, checkmarkCircle, 
  timeOutline, alertCircle, cameraOutline, trashOutline, checkmarkCircleOutline,
  person, personAddOutline, arrowForwardOutline, pencilOutline, closeOutline, 
  checkmarkOutline, createOutline, heartOutline, heartSharp, chevronBackOutline, chevronForwardOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
}).catch(err => {
  console.error('Fatal Error:', err);
  document.body.innerHTML = `<h1 style="color:red">CRASH: ${err.message}</h1>`;
});