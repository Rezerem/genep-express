
# Guide EAS Build — Genep'express Mobile

## Vue d'ensemble

EAS (Expo Application Services) permet de builder des APK et AAB (Android App Bundle) prêtes pour la production directement dans le cloud. Utile pour tester la version compilée, intégrer des modules natifs futurs, ou générer des APK pour Google Play Store.

## Workflow de développement

### 1. Build Preview (Développement)

Lance une build preview pour développer avec rechargement rapide :

```bash
cd mobile
eas build --platform android --profile preview
```

**Sortie :**
- APK téléchargeable
- QR code pour scanner avec la Expo Preview app

### 2. Installer la Preview app

1. Télécharge l'APK depuis le lien EAS fourni
2. Installe sur Android
3. Ouvre l'app Genep'express

### 3. Développer avec Fast Refresh

Après installation de la Preview app :

```bash
npm start
```

Scanne le **QR code** avec l'app Genep'express :
- Les changements **JavaScript** se rechargent instantanément (Fast Refresh)
- Les changements **natifs** (dépendances) nécessitent une nouvelle build EAS

## Build Production

Quand tu es prêt pour la production :

```bash
eas build --platform android --profile production
```

Génère un **AAB** (Android App Bundle) prêt pour Google Play Store.

## Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Credentials
Les credentials Android (Keystore) sont gérés par EAS. Configurer une fois :
```bash
eas credentials
```

## Débogage de l'APK

### 1. Logs via Expo Go Dev Tools

Si tu utilises le QR code pour développer :
```bash
npm start
```

Les logs s'affichent dans le terminal. Ouvre aussi **React DevTools** :
- Appuie sur **Shift+M** dans l'app
- Sélectionne "Debug remote JS"

### 2. Logs natifs Android (ADB)

Pour voir les logs natifs si tu utilises une APK compilée :

```bash
# Installe ADB (Android SDK tools)
# https://developer.android.com/studio/command-line/adb

# Connecte Android en USB et active USB Debugging
# Puis :

adb logcat | grep -i "genepexpress"
```

### 3. Erreur : Module natif manquant

**Symptôme :**
```
Native module of [module-name] was not registered properly
```

**Solution :**
- S'assurer que l'APK est à jour (nouvelle build EAS)
- Vérifier que le module natif est dans les dépendances de `package.json`
- Relancer la build EAS si les dépendances ont changé

### 4. Erreur : Rechargement FastRefresh échoue

**Symptôme :**
```
Error: Cannot hot reload, reloading app...
```

**Causes possibles :**
1. ✅ Changement de dépendances → nouvelle build EAS nécessaire
2. ✅ Changement de TypeScript types → redémarrer `npm start`
3. ✅ Conflit de cache → `npm start` puis recharger depuis l'app

### 5. Erreur : Connexion QR échoue

**Vérifier :**
```bash
# 1. Même réseau WiFi (pas de proxy)
ipconfig  # (Windows) ou ifconfig (Mac/Linux)

# 2. Relancer le serveur
npm start

# 3. Ouvrir les logs de bundler
npm start -- --verbose
```

### 6. Déboguer les performances

Utilise React Profiler pour identifier les lenteurs :

**Code :**
```tsx
import { Profiler } from 'react'

<Profiler id="MapScreen" onRender={onRender}>
  <Map />
</Profiler>

function onRender(id, phase, actualDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`)
}
```

### 7. Erreur : "App has crashed"

**Vérifier :**
1. Adb logs pour voir l'erreur de stack
2. Ajouter des `console.error()` dans les hooks critiques
3. Envelopper le code risqué avec try/catch

**Exemple :**
```tsx
useEffect(() => {
  try {
    const location = await Location.getCurrentPositionAsync()
    setUserLocation(location.coords)
  } catch (error) {
    console.error('Location error:', error)
  }
}, [])
```

## Commandes utiles

| Commande | Effet |
|----------|--------|
| `eas build --platform android --profile preview` | Build preview (dev) |
| `eas build --platform android --profile production` | Build prod (AAB) |
| `eas build --status` | Vérifier le statut des builds |
| `eas build --latest` | Voir les 10 dernières builds |
| `eas credentials` | Gérer les clés Android |
| `adb logcat` | Voir tous les logs natifs |
| `npm start -- --reset-cache` | Reset le cache Metro |

## Ressources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Router Navigation](https://expo.dev/docs/routing/introduction/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Expo Documentation](https://docs.expo.dev/)

## Troubleshooting rapide

| Problème | Solution |
|----------|----------|
| Build fail : "Cannot find module X" | Vérifier que la dépendance est dans `package.json` + relancer `npm install` |
| App crash au démarrage | Vérifier `app/_layout.tsx` et les imports critiques |
| Carte ne s'affiche pas | Vérifier les permissions de localisation dans `app.json` |
| QR code invalide | `npm start` dans le bon dossier (`mobile/`) |
| Changements JS ne se rechargent pas | Vérifier le terminal pour les erreurs de bundler, relancer `npm start` |

## Notes

- **Développement sans EAS** : Utilise `npm start` et Expo Go pour tester rapidement avec Fast Refresh
- **EAS pour la production** : Utilise EAS quand tu as besoin d'une APK compilée pour Google Play Store ou pour tester des modules natifs
- **Credentials locaux** : Stockés dans EAS Cloud, pas dans le repo Git
- **Versioning** : Géré dans `app.json` (version, sdkVersion)
- **Environnement** : Les variables `EXPO_PUBLIC_*` sont injected au build time
