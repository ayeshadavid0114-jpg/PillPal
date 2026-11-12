import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
  { path: 'splash', loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage) },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
      { path: 'calendar', loadComponent: () => import('./pages/calendar/calendar.page').then((m) => m.CalendarPage) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: 'splash' },
  {
    path: 'medication-details',
    loadComponent: () =>
      import('./pages/medication-details/medication-details.page').then((m) => m.MedicationDetailsPage),
  },
];
