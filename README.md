# app_surf

Application privée de prévision surf — Pays Basque.

## Carte

La carte utilise **OpenStreetMap** (tuiles gratuites, sans clé API). Google Maps n'est pas utilisé.

## Build APK de test en local

Appli de test (`com.poubone.surfpaysbasque.test`) — build **debug**, aucun keystore à configurer.

1. Clé SHOM : https://data.shom.fr
2. `cp apps/mobile/.env.example apps/mobile/.env` → renseigner `EXPO_PUBLIC_SHOM_API_KEY`
3. JDK 17 + Android SDK installés
4. `npm run android:debug`
5. APK : `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## CI/CD — publication automatique sur `dev`

À chaque push/merge sur la branche **`dev`**, le workflow `.github/workflows/android-release.yml` :

1. Lance les tests
2. Scrape les spots et génère `spots.db`
3. `expo prebuild` + `./gradlew assembleDebug` (APK de test, signature debug automatique)
4. Publie l'APK en **GitHub Release** (prerelease) + artifact

### Secret GitHub

| Secret | Obligatoire | Description |
|---|---|---|
| `EXPO_PUBLIC_SHOM_API_KEY` | Recommandé | Clé API SHOM (marées) |

Aucune clé Google Maps ni keystore Android requis.

## Build APK via EAS (alternative)

```bash
npm run scrape && npm run copy-db
cd apps/mobile && eas build --platform android --profile preview
```
