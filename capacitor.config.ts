import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.pillpal',
  appName: 'PillPal',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0E7C7B',
      sound: 'default', 
    },
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true, // <--- PALITAN ITO NG TRUE
      backgroundColor: '#0E7C7B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;