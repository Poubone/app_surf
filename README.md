# app_surf

Application privée de prévision surf — Pays Basque.

## APIs utilisées (toutes gratuites, sans clé)

| Source | Données |
|---|---|
| **Open-Meteo Marine** | Houle, vent, niveau mer (`sea_level_height_msl` → marée) |
| **OpenStreetMap** | Fond de carte |

> **SHOM REFMAR** ([doc](https://services.data.shom.fr/support/fr/services/refmar)) est aussi gratuit sans clé, mais ce sont des **observations** de marégraphes. Les **prédictions** SHOM (service SPM / `maree/v2`) nécessitent un abonnement payant — on ne les utilise pas.

Les marées sont dérivées du niveau mer horaire Open-Meteo (min/max locaux → mi-marée, PM, BM).

## Carte

OpenStreetMap via tuiles `UrlTile` — pas de Google Maps.

## Site web (v1 — priorité desktop)

Version principale pour valider la logique avant de reprendre l'APK Android.

**En local :**

```bash
npm run scrape && npm run copy-data   # une fois (ou à chaque refresh spots)
npm run dev:web                       # http://localhost:5173/app_surf/
```

**Build production :** `npm run build:web`

**En ligne :** à chaque push sur `main`, le workflow `Deploy Web` publie sur GitHub Pages  
→ https://poubone.github.io/app_surf/

> Activer GitHub Pages une fois : *Settings → Pages → Build and deployment → Source: GitHub Actions*.

Layout desktop : carte Leaflet à gauche, panneau détail à droite au clic sur un spot.

## APK Android (en pause)

L'APK natif crash au lancement (modules natifs `react-native-maps`, `expo-sqlite`). On reprendra le mobile une fois le web validé.

### Build APK de test en local

Appli de test (`com.poubone.surfpaysbasque.test`) — APK **autonome** (JavaScript + base spots embarqués, pas de Metro / ordinateur requis).

1. JDK 17 + Android SDK
2. `npm run android:apk`
3. APK : `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

À l'usage, l'app a seulement besoin d'Internet pour les prévisions Open-Meteo. Les 12 spots sont déjà dans l'APK (base SQLite générée au build CI).

## CI/CD — publication automatique sur `main`

À chaque push sur **`main`** :

1. Tests + scrape spots
2. `expo prebuild` + `./gradlew assembleRelease` (bundle JS embarqué dans l'APK)
3. APK publié en GitHub Release (prerelease)

Aucun secret GitHub requis.

## Build APK via EAS (alternative)

```bash
npm run scrape && npm run copy-db
cd apps/mobile && eas build --platform android --profile preview
```
