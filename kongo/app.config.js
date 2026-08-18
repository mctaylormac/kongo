// app.config.js — Configuration dynamique KonGO Mobile
// Même logique que KINTU : la clé Google Maps est lue depuis .env
// et injectée nativement dans les builds Android & iOS via Expo Config.
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = {
  expo: {
    name: 'kongo',
    slug: 'kongo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/ICONE.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,

    splash: {
      image: './assets/logo3.png',
      resizeMode: 'contain',
      backgroundColor: '#C8E63C',
    },

    // ─── iOS ──────────────────────────────────────────────
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mactaylor.kongo',
      buildNumber: '1',
      // Injection de la clé pour Google Maps iOS SDK
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        // Permissions de géolocalisation (affichées à l'utilisateur)
        NSLocationWhenInUseUsageDescription:
          'KonGO utilise votre position pour vous montrer où se trouve votre bus en temps réel.',
        NSLocationAlwaysUsageDescription:
          'KonGO utilise votre position pour un suivi continu pendant vos trajets.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    // ─── Android ──────────────────────────────────────────
    android: {
      package: 'com.mactaylor.kongo',
      adaptiveIcon: {
        foregroundImage: './assets/ICONE.png',
        backgroundColor: '#C8E63C',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Injection de la clé pour Google Maps Android SDK
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
    },

    web: {
      favicon: './assets/favicon.png',
    },

    plugins: [
      '@react-native-community/datetimepicker',
      './plugins/withIosFmtFix',
    ],

    extra: {
      // Disponible dans l'app via Constants.expoConfig.extra.googleMapsApiKey
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: '1db2e399-5586-44ea-8c15-5258e607300e',
      },
    },

    owner: 'mctaylor',
  },
};
