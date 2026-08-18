# Fiche de Contrôle Avant Déploiement — KINTU Mobile 🚀

Ce document récapitule les configurations requises, les formats et dimensions d'images, ainsi que les points clés à valider pour le déploiement de l'application KINTU sur Google Play Store (Android) et Apple App Store (iOS).

---

## 📱 1. Spécifications des Images, Logos et Captures d'Écran

### 🍏 Apple App Store (iOS)
Pour soumettre l'application sur App Store Connect, les visuels suivants sont strictement requis :

| Élément | Dimensions Recommandées | Format / Contrainte | Rôle / Emplacement |
| :--- | :--- | :--- | :--- |
| **Icône de l'App Store** | **1024 × 1024 px** | PNG 24-bit, **sans canal alpha** (pas de transparence) | Fiche App Store et appareil |
| **Écran 6.7" (iPhone 14/15/16 Pro Max)** | **1290 × 2796 px** ou **1284 × 2778 px** | JPG ou PNG (pas de transparence) | Captures d'écran obligatoires |
| **Écran 6.5" (iPhone XS Max/11 Pro Max)** | **1242 × 2688 px** | JPG ou PNG (pas de transparence) | Captures d'écran obligatoires |
| **Écran 5.5" (iPhone 8/7/6 Plus)** | **1242 × 2208 px** | JPG ou PNG (pas de transparence) | Captures d'écran optionnelles/recommandées |
| **Écran iPad Pro 12.9"** | **2048 × 2732 px** | JPG ou PNG | Obligatoire si l'iPad est supporté |

*Note : Les captures d'écran actuelles redimensionnées pour KINTU sont situées dans `mobile/Image/AppStore_6.7/` et `mobile/Image/AppStore_6.5/`.*

---

### 🤖 Google Play Store (Android)
Google exige les formats suivants pour la console développeur :

| Élément | Dimensions Recommandées | Format / Contrainte | Rôle / Emplacement |
| :--- | :--- | :--- | :--- |
| **Icône de l'application** | **512 × 512 px** | PNG 32-bit (transparence autorisée pour les icônes adaptatives) | Fiche Play Store |
| **Graphique informatif (Feature Graphic)** | **1024 × 500 px** | JPG ou PNG 24-bit, sans canal alpha | Bannière de présentation |
| **Captures d'écran téléphone** | Ratio 16:9 ou 18:9 (ex: **1080 × 1920 px** ou **1080 × 2400 px**) | JPG ou PNG, min. 320 px et max. 3840 px | Présentation (min. 2 captures requises) |
| **Captures tablette (7" & 10")** | Dimensions adaptées aux tablettes (ex: **2048 × 1536 px**) | JPG ou PNG | Nécessaire pour que l'app soit visible sur tablette |

---

## ⚙️ 2. Configuration Requise pour Android (Google Play Store)

Les fichiers de configuration du projet mobile forcent l'usage de l'**API Level 35** (exigé par Google Play Store) :

### Fichiers de configuration analysés :
1. **`mobile/android/gradle.properties`** :
   ```properties
   android.compileSdkVersion=35
   android.targetSdkVersion=35
   android.buildToolsVersion=35.0.0
   ```
2. **`mobile/android/build.gradle`** :
   Le fichier récupère dynamiquement les configurations définies dans `gradle.properties` :
   ```groovy
   compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
   targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')
   ```
3. **`mobile/app.config.js`** :
   - **`versionCode`** : `5` (Doit être incrémenté à chaque nouveau build soumis à la console Google).
   - **`version`** : `1.0.1` (Version marketing visible par l'utilisateur).
   - **`expo-build-properties`** : Assure que le prebuild d'EAS applique les bonnes versions d'API SDK 35 :
     ```javascript
     [
       "expo-build-properties",
       {
         "android": {
           "compileSdkVersion": 35,
           "targetSdkVersion": 35,
           "buildToolsVersion": "35.0.0"
         }
       }
     ]
     ```

---

## 🍏 3. Configuration Requise pour iOS (Apple App Store)

Pour que l'App Store accepte le fichier `.ipa` généré par Expo EAS, les configurations suivantes sont appliquées dans le projet :

1. **Version Xcode requise par Apple (en 2026)** :
   Apple exige que les applications soumises soient compilées avec **Xcode 17+ (ou version supérieure)**.
   - **`mobile/eas.json`** : Configuré avec `"image": "latest"` pour s'assurer que les serveurs de build d'EAS utilisent la dernière image macOS contenant la version d'Xcode requise par Apple.
   ```json
   "production": {
     "ios": {
       "simulator": false,
       "image": "latest"
     }
   }
   ```

2. **Hook de Post-Installation et Correction C++17 (`withIosFmtFix.js`)** :
   Le compilateur strict Clang présent sur Xcode 16+ / 17+ lève des erreurs sur la bibliothèque `fmt` utilisée par Hermes (moteur JavaScript de React Native).
   - **`mobile/plugins/withIosFmtFix.js`** est enregistré dans les plugins de `app.config.js`.
   - **Fonctionnement** : Il injecte de manière chirurgicale à la fin du bloc `post_install` du `Podfile` généré une modification qui force le standard **C++17** et ajoute la macro `FMT_USE_CONSTEVAL=0` uniquement sur le pod `fmt`.
   ```ruby
   installer.pods_project.targets.each do |target|
     if target.name.downcase.include?('fmt')
       target.build_configurations.each do |bc|
         bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
         bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
         bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'
       end
     end
   end
   ```

3. **Incrémentation et Identification (`mobile/app.config.js`)** :
   - **`bundleIdentifier`** : `com.kintu.app` (doit correspondre à l'App ID créé dans le portail Apple Developer).
   - **`buildNumber`** : `"5"` (Doit être incrémenté sous forme de chaîne de caractères à chaque soumission sur App Store Connect).
   - **`ITSAppUsesNonExemptEncryption`** : `false` (Évite les questions de conformité d'exportation sur le chiffrement lors de la soumission de l'IPA).

4. **Soumission Automatique (`mobile/eas.json`)** :
   - **`submit.production.ios`** est configuré pour lier directement le build à ton compte développeur :
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "laurentkyungu23@gmail.com",
         "ascAppId": "6792368023"
       }
     }
   }
   ```

---

## 📋 Checklist Avant Soumission (Lancer EAS)

- [ ] Incrémenter le `versionCode` (ex: `6`) et le `buildNumber` (ex: `"6"`) dans `mobile/app.config.js`.
- [ ] Vérifier que les variables d'environnement Supabase (`EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`) sont correctement renseignées pour la production.
- [ ] Exécuter la commande git pour synchroniser les fichiers :
  ```bash
  git add .
  git commit -m "chore: incrémentation version pour déploiement"
  git push
  ```
- [ ] Lancer les builds de production :
  - **Android** : `eas build --platform android --profile production`
  - **iOS** : `eas build --platform ios --profile production`
