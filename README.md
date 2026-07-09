# app_surf

## Build APK

1. Obtenir une clé SHOM sur https://data.shom.fr
2. Copier `apps/mobile/.env.example` → `apps/mobile/.env` et renseigner `EXPO_PUBLIC_SHOM_API_KEY`
3. `npm run scrape && npm run copy-db`
4. `cd apps/mobile && eas build --platform android --profile preview`
