

module.exports = {
  expo: {
    name: 'KongoChauffeur',
    slug: 'KongoChauffeur',
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
      bundleIdentifier: 'com.kongo.chauffeur',
      buildNumber: '1',
      infoPlist: {
        // Permissions de géolocalisation (affichées à l'utilisateur)
        NSLocationWhenInUseUsageDescription:
          'KonGO Chauffeur utilise votre position pour guider vos trajets en temps réel.',
        NSLocationAlwaysUsageDescription:
          'KonGO Chauffeur utilise votre position pour un suivi continu pendant vos trajets.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    // ─── Android ──────────────────────────────────────────
    android: {
      package: 'com.kongo.chauffeur',
      icon: './assets/ICONE.png',
      adaptiveIcon: {
        foregroundImage: './assets/ICONE.png',
        backgroundColor: '#000000',
      },
      predictiveBackGestureEnabled: false,
    },

    web: {
      favicon: './assets/favicon.png',
    },

    plugins: [
      './plugins/withIosFmtFix',
    ],

    extra: {
      eas: {
        projectId: 'f7e03156-d032-47e6-8f9d-df0b5c3b8da7',
      },
    },

    owner: 'mctaylor',
  },
};
