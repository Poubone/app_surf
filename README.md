# app_surf

Application privée de prévision surf — Pays Basque.

## Build APK en local (Gradle release)

1. Clé SHOM : https://data.shom.fr
2. `cp apps/mobile/.env.example apps/mobile/.env` → renseigner `EXPO_PUBLIC_SHOM_API_KEY`
3. Clé Google Maps dans `GOOGLE_MAPS_API_KEY` (ou `apps/mobile/app.json`)
4. JDK 17 + Android SDK installés
5. `npm run android:release`
6. APK : `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

## CI/CD — publication automatique sur `dev`

À chaque push/merge sur la branche **`dev`**, le workflow `.github/workflows/android-release.yml` :

1. Lance les tests
2. Scrape les spots et génère `spots.db`
3. `expo prebuild` + `./gradlew assembleRelease`
4. Publie l'APK en **GitHub Release** (prerelease) + artifact

### Secrets GitHub requis

| Secret | Obligatoire | Description |
|---|---|---|
| `EXPO_PUBLIC_SHOM_API_KEY` | Recommandé | Clé API SHOM (marées) |
| `GOOGLE_MAPS_API_KEY` | Recommandé | Clé Google Maps Android |
| `ANDROID_KEYSTORE_BASE64` | Optionnel | Keystore release encodé en base64 |
| `ANDROID_KEY_ALIAS` | Si keystore | Alias de la clé |
| `ANDROID_KEYSTORE_PASSWORD` | Si keystore | Mot de passe du keystore |
| `ANDROID_KEY_PASSWORD` | Si keystore | Mot de passe de la clé |

Sans keystore release, l'APK est signé avec le keystore debug Expo (OK pour usage perso).

### Générer le keystore release (optionnel)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias surf-release -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.keystore   # → secret ANDROID_KEYSTORE_BASE64
```

## Build APK via EAS (alternative)

```bash
npm run scrape && npm run copy-db
cd apps/mobile && eas build --platform android --profile preview
```
