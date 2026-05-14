import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.chioi.app',
  appName: 'Chị Ơi!',
  webDir: 'www',

  // Load PWA từ remote URL (KHÔNG bundle static files)
  // Apple Review Note: kết hợp với native plugins (Geolocation, Push, Browser)
  // để pass guideline 4.2 — không phải pure WebView
  server: {
    url: 'https://app.chioi.vn',
    cleartext: false,
    allowNavigation: [
      'app.chioi.vn',
      'chioi.vn',
      'api.chioi.vn',
      '*.chioi.vn',
    ],
  },

  ios: {
    contentInset: 'always',
    scheme: 'chioi',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#a04100',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#a04100',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
