# Design — Surf Pays Basque Web v1 (desktop)

**Date :** 2026-07-10  
**Statut :** Approuvé (réponse B : accès PC d'abord)  
**Périmètre :** Site web privé, Pays Basque, 12 spots

---

## 1. Objectif

Remplacer temporairement l'APK Android instable par un **site web desktop** pour valider la logique métier (scoring, carte, courbe horaire) avant de reprendre le mobile.

Même expérience fonctionnelle que l'app mobile v1 :
- Carte Pays Basque avec pins colorés par score /100
- Clic sur un spot → panneau latéral avec score actuel + courbe horaire
- Bouton actualiser
- En ligne uniquement (Open-Meteo)

---

## 2. Décisions

| Décision | Choix |
|---|---|
| Plateforme v1 | Web desktop (navigateur PC) |
| Mobile web | Hors scope v1 (pas de responsive poussé) |
| Carte | Leaflet + tuiles OpenStreetMap |
| Données spots | `spots.json` généré au scrape (pas de SQLite) |
| Scoring | `@app-surf/scoring` (inchangé) |
| Prévisions | Open-Meteo Marine (même API que mobile) |
| Hébergement | GitHub Pages sur push `main` |
| APK Android | En pause jusqu'à validation web |

---

## 3. Architecture

```
scripts/scrape/  →  data/spots.json + data/spots.db
packages/scoring/  →  moteur /100 (partagé)
apps/web/  →  Vite + React + Leaflet + Recharts
```

### Layout desktop

```
┌────────────────────────────────────┬──────────────────┐
│                                    │  Hendaye         │
│         Carte Leaflet              │  72/100          │
│         (pins colorés)             │  ─────────────   │
│                                    │  courbe horaire  │
│  [Actualiser]  légende             │  description     │
└────────────────────────────────────┴──────────────────┘
```

Panneau droit visible au clic sur un spot ; carte occupe le reste.

---

## 4. Hors scope v1

- Responsive mobile / PWA
- APK / modules natifs
- Authentification
- Cache offline

---

## 5. Critères de succès

1. `npm run dev:web` lance le site en local
2. Carte affiche 12 spots avec scores colorés
3. Clic spot → courbe horaire du jour
4. CI publie sur GitHub Pages à chaque push `main`
