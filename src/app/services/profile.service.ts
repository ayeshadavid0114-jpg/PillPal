import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

import { UserProfile } from '../models/profile.model';

const PROFILE_KEY = 'user_profile';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  // The live broadcast channel for the Home page
  public profile$ = new BehaviorSubject<UserProfile | null>(null);

  async get(): Promise<UserProfile> {
    const { value } = await Preferences.get({ key: PROFILE_KEY });
    if (value) {
      try {
        const profile = JSON.parse(value) as UserProfile;
        this.profile$.next(profile); // Broadcast
        return profile;
      } catch {
        const blank = { name: '', notificationsEnabled: true };
        this.profile$.next(blank);
        return blank;
      }
    }
    const blank = { name: '', notificationsEnabled: true };
    this.profile$.next(blank);
    return blank;
  }

  async save(profile: UserProfile): Promise<void> {
    const cleanName = (profile.name ?? '').trim();

    if (cleanName.length < 2) {
      console.warn('Refusing to save empty name');
      return;
    }

    const clean: UserProfile = {
      name: cleanName,
      avatar: profile.avatar,
      notificationsEnabled: profile.notificationsEnabled ?? true,
    };

    await Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(clean) });
    
    // Broadcast the new name to the Home Page
    this.profile$.next(clean); 
  }

  async reset(): Promise<void> {
    await Preferences.remove({ key: PROFILE_KEY });
    this.profile$.next(null);
  }

  // THIS WAS MISSING! The Splash screen needs this to work.
  async hasName(): Promise<boolean> {
    const { value } = await Preferences.get({ key: PROFILE_KEY });
    if (!value) return false;
    
    try {
      const p: UserProfile = JSON.parse(value);
      return !!(p.name && p.name.trim().length >= 2);
    } catch {
      return false;
    }
  }
}