# Design — Application Surf Pays Basque (v1)

**Date :** 2026-07-09  
**Statut :** Approuvé en brainstorming  
**Périmètre :** App privée Android (APK), Pays Basque, usage personnel

---

## 1. Objectif

Application mobile privée permettant de consulter les conditions de surf des spots du Pays Basque avant de partir surfer. L'utilisateur ouvre l'app le matin, voit une carte avec les spots colorés selon un score sur 100, puis peut consulter la courbe horaire du score pour la journée en tapant sur un spot.

---

## 2. Décisions validées

| Décision | Choix |
|---|---|
| Architecture | Tout sur le téléphone (pas de serveur) |
| Connexion | En ligne uniquement (consultation avant de partir) |
| Périmètre géographique v1 | Pays Basque (~12 spots) |
| Écran principal | Carte interactive colorée par score |
| Horizon temporel | Score actuel sur la carte ; courbe horaire au tap |
| APIs dynamiques v1 | Open-Meteo Marine + API SHOM |
| APIs dynamiques v2 | Stormglass.io (si scores houle imprécis par gros vent) |
| Stack recommandée | Expo monorepo TypeScript |

---

## 3. Architecture globale

```
┌─────────────────────────────────────────────────────┐
│  PC utilisateur (ponctuel)                          │
│  scripts/scrape/  →  génère data/spots.db           │
└──────────────────────┬──────────────────────────────┘
                       │ embarqué au build APK
┌──────────────────────▼──────────────────────────────┐
│  APK (Expo / React Native)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ SQLite      │  │ Scoring      │  │ UI Carte  │ │
│  │ spots stat. │→ │ Engine (TS)  │→ │ + Détail  │ │
│  └─────────────┘  └──────┬───────┘  └───────────┘ │
│                          │                          │
│              ┌───────────▼───────────┐              │
│              │ API Clients           │              │
│              │ Open-Meteo + SHOM     │              │
│              └───────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### Structure du dépôt

```
app_surf/
├── apps/mobile/          # Application Expo (React Native)
├── packages/scoring/     # Algorithme de notation /100 (TypeScript pur)
├── scripts/scrape/       # Scrapers + seed Pays Basque
└── data/                 # spots.db généré (gitignored)
```

### Flux à l'ouverture de l'app

1. Charger les spots depuis SQLite embarquée.
2. Pour chaque spot : appeler Open-Meteo (houle + vent, prévisions horaires du jour) et SHOM (marées du jour).
3. Calculer le score pour chaque heure de la journée via le moteur de scoring.
4. Afficher le score de l'heure actuelle sur la carte (couleur du pin).
5. Au tap sur un spot : ouvrir un bottom sheet avec la courbe horaire du score et le détail des conditions.

### Approche technique retenue

**Expo monorepo TypeScript** avec scrapers Node.js (Cheerio), SQLite embarquée (`expo-sqlite`), carte (`react-native-maps`), build APK via EAS Build.

Alternatives écartées :
- Scrapers Python : deux runtimes à maintenir sans gain suffisant.
- React Native bare + JSON : configuration Android plus lourde sans bénéfice pour une app perso.

---

## 4. Données statiques (scraping)

Les données statiques modélisent la « carte d'identité » physique de chaque spot. Elles sont scrapées une fois sur le PC de l'utilisateur, puis embarquées dans l'APK. Une mise à jour des fiches nécessite un rebuild de l'APK.

### Spots v1 — Pays Basque (12)

| Spot | Slug (indicatif) |
|---|---|
| Hendaye | hendaye |
| Sokoa | sokoa |
| Guéthary | guethary |
| Parlementia | parlementia |
| Bidart | bidart |
| Lafitenia | lafitenia |
| Côte des Basques | cote-des-basques |
| Grande Plage Biarritz | grande-plage-biarritz |
| Marinella | marinella |
| Les Corsaires | les-corsaires |
| Belharra | belharra |
| Ondres | ondres |

### Sources de scraping

| Source | URL pattern | Champs extraits |
|---|---|---|
| Surf-Forecast.com | `/breaks/{slug}/spot-guide` | Best wind, Best swell direction (fenêtres angulaires) |
| Wannasurf.com | page spot | Swell direction, Wind direction, Tide position, Bottom (sable/roche), niveau |
| Surf-Report.com | page spot FR | Description qualitative FR, mentions marée idéale |

### Schéma table `spots`

```sql
CREATE TABLE spots (
  spot_id              TEXT PRIMARY KEY,  -- UUID
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  latitude             REAL NOT NULL,
  longitude            REAL NOT NULL,
  beach_orientation    REAL NOT NULL,     -- 0°–360°, perpendiculaire à la plage
  swell_angle_min      REAL NOT NULL,
  swell_angle_max      REAL NOT NULL,
  wind_offshore_min    REAL NOT NULL,
  wind_offshore_max    REAL NOT NULL,
  ideal_swell_height_min REAL NOT NULL,   -- fourchette idéale selon niveau du spot
  ideal_swell_height_max REAL NOT NULL,
  tide_optimal_stage   TEXT NOT NULL,     -- low | mid-rising | mid-falling | high
  bottom_type          TEXT,              -- sand | reef | mixed
  level                TEXT,              -- beginner | intermediate | advanced
  description_fr       TEXT
);
```

### Dérivation des champs

- **`beach_orientation`** : calculé à partir de la direction houle idéale scrapée. L'orientation de la plage est perpendiculaire à la direction d'arrivée de la houle optimale (face à la mer).
- **`swell_angle_min/max`** : fenêtre angulaire extraite de Surf-Forecast et validée par Wannasurf.
- **`wind_offshore_min/max`** : fenêtre « Best wind » de Surf-Forecast.
- **`ideal_swell_height_min/max`** : dérivé du niveau du spot (ex. débutant/intermédiaire Hendaye : 0,8–1,8 m).
- **`tide_optimal_stage`** : enum normalisé à partir des mentions textuelles (Surf-Report, Wannasurf).

### Workflow de mise à jour

```bash
npm run scrape          # Lance les scrapers sur le PC
# → génère data/spots.db
eas build --platform android --profile preview  # Rebuild APK
```

Le fichier `data/spots.db` est gitignored ; seul le script de seed et les snapshots de test HTML sont versionnés.

---

## 5. Données dynamiques (APIs)

### Open-Meteo Marine (gratuit, sans clé)

Un appel par spot à chaque ouverture de l'app.

```
GET https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}
  &longitude={lon}
  &hourly=wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m
  &timezone=Europe/Paris
  &forecast_days=1
```

**Variables récupérées (horaires) :**

| Variable API | Usage |
|---|---|
| `wave_height` | Hauteur de vague (m) |
| `wave_period` | Période (s) |
| `wave_direction` | Direction houle (°) |
| `wind_speed_10m` | Vitesse vent (m/s → converti en nœuds × 1,944) |
| `wind_direction_10m` | Direction vent (°) |

### API SHOM (gratuit, clé requise)

Marées du jour pour le port de référence le plus proche du Pays Basque (Saint-Jean-de-Luz / socle SHOM approprié).

**Variables récupérées :**

| Variable | Usage |
|---|---|
| Horaires PM / BM | Repères temporels du cycle |
| Hauteur d'eau horaire | Position dans le cycle |
| Coefficient de marée | Contexte (optionnel v1) |

**Calcul du `tide_stage` à l'heure H :**

| Stage | Condition |
|---|---|
| `low` | ±1h autour de la basse mer |
| `high` | ±1h autour de la pleine mer |
| `mid-rising` | Entre BM et PM, hors zones low/high |
| `mid-falling` | Entre PM et BM, hors zones low/high |

La clé SHOM est injectée au build via `EXPO_PUBLIC_SHOM_API_KEY` (acceptable pour une APK privée à usage personnel).

### Volume d'appels

12 spots × 2 APIs = **24 appels** par ouverture. Acceptable pour un usage matinal ponctuel.

### Stormglass.io (v2, hors périmètre v1)

Réservé à une version ultérieure si les scores houle s'avèrent imprécis en conditions de vent fort (mer de vent mélangée à la houle). Freins : quota gratuit (~10 req/j), coût du plan payant, complexité de fusion multi-sources.

---

## 6. Moteur de scoring

Implémentation en TypeScript pur dans `packages/scoring/`. Aucune dépendance React Native — testable unitairement.

### Formule globale

```
SurfScore = (ScoreHoule + ScoreVent + ScoreMarée) × MalusVent × MalusSaturation
```

`MalusSaturation` = 1,0 en v1 (réservé v2).

### Score Houle (max 50 pts)

```
ScoreHoule = (S_période + S_hauteur) × M_dir_houle
```

**Période (`S_période`, max 25) :**

| Période | Points |
|---|---|
| T < 7 s | 2 |
| 7 s ≤ T < 10 s | 12 |
| 10 s ≤ T < 14 s | 25 |
| T ≥ 14 s | 20 |

**Hauteur (`S_hauteur`, max 25) — relative à la fourchette idéale du spot :**

| Condition | Points |
|---|---|
| Hauteur < 0,4 m | 0 |
| Dans la zone idéale du spot | 25 |
| Au-dessus de la limite du spot | 5 |

**Multiplicateur direction houle (`M_dir_houle`) :**

| Condition | Multiplicateur |
|---|---|
| θ_swell dans [swell_angle_min, swell_angle_max] | 1,0 |
| Décalage ±20° | 0,5 |
| Décalage > 20° hors fenêtre | 0,0 |

### Score Vent (max 30 pts)

L'offshore idéal du spot est le centre de la fenêtre `[wind_offshore_min, wind_offshore_max]`.

```
Δ_vent = angle_diff(θ_wind, θ_offshore)   // plus courte distance sur le cercle 0°–360°
```

| Condition | Points |
|---|---|
| Vitesse < 5 nœuds (Glassy) | 30 |
| Δ_vent ≤ 30° (Offshore) | 30 |
| 30° < Δ_vent ≤ 75° (Cross-shore) | 15 |
| Δ_vent > 75° (Onshore) | 0 |

**Malus vent (`MalusVent`) :**

| Condition | Multiplicateur |
|---|---|
| Onshore ET vitesse > 20 nœuds | 0,0 |
| Onshore ET vitesse > 12 nœuds | 0,3 |
| Sinon | 1,0 |

### Score Marée (max 20 pts)

Comparer le `tide_stage` calculé à l'heure H avec `tide_optimal_stage` du spot.

| Match | Points |
|---|---|
| Parfait (ex. spot veut mid-rising, on est en mid-rising) | 20 |
| Partiel (ex. spot veut mid-rising, on est à 1h de PM) | 10 |
| Mauvais (ex. spot ne marche pas à PM, on est en high) | 2 |

### Test de régression — Hendaye

**Conditions :** Houle 1,2 m, période 11 s, direction 270°. Vent NW 310° à 14 nœuds. Mi-marée montante.

**Fiche Hendaye :** Houle idéale 290°–320°. Offshore idéal ~150°. Marée idéale = mi-marée.

| Composante | Calcul | Résultat |
|---|---|---|
| Houle | (25 + 25) × 0,5 (270° à 20° sous swell_angle_min 290°) | 25 |
| Vent | Onshore → 0 pt | 0 |
| Marée | Mi-marée montante → match parfait | 20 |
| Malus vent | Onshore 14 nœuds > 12 | ×0,3 |
| **Final** | (25 + 0 + 20) × 0,3 | **14/100** (arrondi affiché : 15) |

---

## 7. Interface utilisateur

### Écran carte (principal)

- Carte centrée sur le Pays Basque (`react-native-maps`).
- Un pin par spot, coloré selon le score de l'heure actuelle :
  - **Vert** : score ≥ 60
  - **Orange** : score 30–59
  - **Rouge** : score < 30
  - **Gris** : erreur API ou données indisponibles
- Score numérique affiché dans le pin (ex. `72`).
- Bouton « Actualiser » en haut à droite.
- Légende des couleurs en bas de l'écran.

### Bottom sheet (tap sur un spot)

- Nom du spot + description FR (issue du scraping Surf-Report).
- Score actuel en grand + badge condition (Glassy / Offshore / Cross / Onshore).
- **Courbe horaire** du score sur la journée (0h–23h) avec marqueur sur l'heure actuelle.
- Section dépliable : détail houle (H, T, θ), vent (V, θ), marée (stage).
- Infos spot : type de fond, niveau requis.

### Hors périmètre v1

- Écran liste / classement séparé.
- Favoris.
- Mode hors-ligne / cache.
- Carte multi-régions France.

---

## 8. Gestion d'erreurs

| Situation | Comportement |
|---|---|
| Pas de réseau | Écran plein : « Connecte-toi pour voir les conditions » + bouton réessayer |
| Échec Open-Meteo sur un spot | Pin gris ; message d'erreur au tap |
| Échec SHOM (global ou spot) | Score calculé sans composante marée (max 80/100) ; badge « Marée indisponible » |
| Scraping échoué (PC) | Script loggue l'erreur ; le spot est exclu ou marqué incomplet dans le seed |

---

## 9. Tests

| Niveau | Cible |
|---|---|
| Unitaires | Moteur de scoring : cas Hendaye (15/100), cas optimal (≈100/100), cas plat (≈0/100) |
| Scrapers | Snapshots HTML fixes → validation du parsing (pas d'appel réseau en CI) |
| E2E mobile | Hors périmètre v1 |

---

## 10. Build et déploiement

- **Framework :** Expo SDK (dernière stable au moment de l'implémentation).
- **Build APK :** `eas build --platform android --profile preview` → APK installable directement (sideload, pas de Play Store).
- **Secrets :** `EXPO_PUBLIC_SHOM_API_KEY` injectée au build via fichier `.env` local (non versionné).
- **Ajout de spots :** relancer `npm run scrape` sur PC → rebuild APK.

---

## 11. Évolutions prévues (hors v1)

| Évolution | Déclencheur |
|---|---|
| Stormglass.io pour houle pure | Scores houle faux en conditions ventées |
| Extension façade atlantique | Après validation Pays Basque |
| Cache local / mode hors-ligne | Si besoin sur la plage |
| Malus saturation | Affinage algo quand houle dépasse la capacité du spot |
| Favoris et notifications | Usage quotidien confirmé |

---

## 12. Dépendances techniques principales

| Package | Rôle |
|---|---|
| `expo` | Framework React Native |
| `expo-sqlite` | Base spots embarquée |
| `react-native-maps` | Carte interactive |
| `victory-native` ou `react-native-gifted-charts` | Courbe horaire du score |
| `cheerio` (dev) | Parsing HTML des scrapers |
| `vitest` | Tests unitaires scoring + scrapers |
