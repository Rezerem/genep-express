# Guide EAS Build — Genep'express Mobile

## Vue d'ensemble

EAS (Expo Application Services) permet de compiler des APK et AAB (Android App Bundle) dans le cloud. Depuis l'ajout de modules natifs (`gesture-handler`, `reanimated`), **Expo Go n'est plus compatible**.

La solution : **Dev Client** — Une APK personnalisée qui se comporte comme Expo Go mais avec tous les modules natifs inclus. Après une build initiale (~10 min), tu as **Fast Refresh** pour chaque changement JS/TS (< 2 sec).

---

## Workflow recommandé : Dev Client

### Setup initial (une seule fois)

Build l'APK dev-client et installe-la sur ton device :

```bash
cd mobile
eas build --platform android --profile dev-client
# Attend la fin (~10 min)
# EAS te donne un lien de téléchargement
```

1. Télécharge l'APK depuis le lien
2. Installe sur ton device Android :
   ```bash
   adb install -r app-release.apk
   ```

### Développement quotidien (Fast Refresh)

Après chaque redémarrage de dev :

```bash
npm start
```

Cela affiche un QR code dans le terminal. Ouvre l'APK `Genep'express` (celle que tu viens d'installer), scanne le QR code ou appuie sur **Shake** → **"Connect to development server"**.

**Ensuite :**
- Modifie n'importe quel fichier `.tsx` ou `.ts`
- Le changement s'applique **instantanément** (< 2 sec) via **Fast Refresh**
- Pas de recompilation, pas de wait

### Recharger manuellement l'app

Si Fast Refresh ne suffit pas (typos, logique complexe) :
- **Shake le device** → "Reload"
- **Terminal** : Appuie sur `Shift + R`

### Rebuild EAS uniquement si :

- ✅ Ajout d'une nouvelle dépendance native (`npm install react-native-gesture-handler`, etc.)
- ✅ Changement de config dans `app.json` (permissions, plugins, `scheme`)
- ✅ Changement de `babel.config.js` ou setup Babel

**Ne pas rebuild pour les changements JS/TS !**

---

## Tableau : Quand utiliser quel profil

| Profil       | Usage | Fast Refresh | Modules natifs | Build time |
|---|---|:---:|:---:|:---:|
| **dev-client** | 👈 Développement quotidien (RECOMMANDÉ) | ✅ | ✅ | ~10 min (une fois) |
| **preview** | Test avant release, QA | ❌ | ✅ | ~10 min |
| **production** | Google Play Store | ❌ | ✅ | ~10 min |

---

## Commandes

### Dev Client

```bash
# Build et installe APK sur device
eas build --platform android --profile dev-client

# Lancer le serveur de développement (Fast Refresh)
npm start
```

### Preview (si tu veux tester la version compilée sans dev-client)

```bash
eas build --platform android --profile preview
# Crée une APK finale prête pour distribution (mais sans Fast Refresh)
```

### Production (Google Play)

```bash
# Build un AAB optimisé pour Google Play
eas build --platform android --profile production
```

### Utilitaires

```bash
eas build --status          # Vérifier le statut des builds en cours
eas build --latest          # Voir les 10 dernières builds
eas credentials              # Gérer les clés Android Keystore
npm start -- --reset-cache  # Réinitialiser le cache Metro
```

---

## Débogage

### 1. Logs JavaScript (Fast Refresh)

Quand tu es connecté via QR code (`npm start`) :

**Terminal :**
```bash
# Les logs s'affichent automatiquement
# Shift+M pour accéder à React DevTools
```

**Dans l'app :**
- Appuie sur **Shift+M**
- Sélectionne "Debug remote JS"
- Ouvre React DevTools (onglet nouveau) dans le navigateur

### 2. Logs natifs Android (ADB)

Pour les erreurs natives (MapLibre, gesture-handler, etc.) :

```bash
# Vérifier que le device est connecté
adb devices

# Afficher les logs (filtrés)
adb logcat | grep -i "genepexpress"

# Ou tout voir (verbose)
adb logcat
```

### 3. Erreur : "Module natif non trouvé"

**Symptôme :**
```
Native module of [module-name] was not registered properly
```

**Causes & solutions :**
1. ✅ L'APK dev-client est trop ancienne → refaire `eas build --profile dev-client`
2. ✅ La dépendance n'est pas dans `package.json` → faire `npm install <package> --legacy-peer-deps`
3. ✅ Le Babel plugin est oublié (ex: `react-native-reanimated/plugin`) → vérifier `babel.config.js`

### 4. Erreur : Fast Refresh échoue

**Symptôme :**
```
Error: Cannot hot reload, reloading app...
```

**Causes & solutions :**
1. ✅ Changement de dépendances → nouvelle build EAS
2. ✅ Changement de TypeScript types → relancer `npm start`
3. ✅ Cache corrompu → `npm start -- --reset-cache`
4. ✅ Fichier invalide → vérifier la syntaxe, relancer `npm start`

### 5. Erreur : QR code ne se scanne pas / app ne se connecte pas

**Vérifications :**
1. Device et PC sur le **même WiFi** (pas de proxy)
2. Terminal affiche bien le QR code → relancer `npm start`
3. Device a la bonne APK installée (dev-client)
4. Appuie sur **Shake** → "Connect to development server"

```bash
# Si ça reste bloqué :
npm start -- --tunnel    # Mode tunnel (plus lent, outrepasse les pare-feu)
```

### 6. Erreur : "App has crashed"

**Marche à suivre :**
1. Vérifier les **logs ADB** pour le stacktrace :
   ```bash
   adb logcat | grep -i "crash"
   ```
2. Ajouter `console.error()` dans les hooks critiques
3. Tester avec un try/catch :
   ```tsx
   useEffect(() => {
     try {
       const location = await Location.getCurrentPositionAsync()
       setLocation(location.coords)
     } catch (error) {
       console.error('Location error:', error)
     }
   }, [])
   ```

### 7. Déboguer les performances

Identifier les lenteurs avec React Profiler :

```tsx
import { Profiler } from 'react'

export default function Map() {
  const onRender = (id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`)
  }

  return (
    <Profiler id="MapScreen" onRender={onRender}>
      <MapContainer />
    </Profiler>
  )
}
```

---

## Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "dev-client": {
      "android": {
        "buildType": "apk",
        "developmentClient": true
      },
      "channel": "development"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "channel": "preview"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "channel": "production"
    }
  }
}
```

### app.json (essentiels)
```json
{
  "scheme": "genepexpress",
  "sdkVersion": "54.0.0",
  "version": "1.0.0"
}
```

⚠️ **Important** : Le champ `scheme` est **obligatoire** pour dev-client.

### Credentials
Les credentials Android (Keystore) sont gérés par EAS Cloud (sécurisé) :
```bash
eas credentials
```

---

## VARIABLES D'ENVIRONNEMENT

### .env.local (dev)
```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_MAPTILER_KEY=
```

⚠️ `EXPO_PUBLIC_*` est injecté dans le bundle. **Jamais de secrets ici** (API keys, passwords).

### Détecter l'IP LAN (important pour API_URL)
```bash
# Windows
ipconfig

# Mac / Linux
ifconfig
```

Cherche l'adresse IPv4 de ta carte WiFi, ex: `192.168.1.42`

---

## Notes & Conseils

- **Dev sans modules natifs** : Si tu veux tester rapidement sans installer d'APK, utilise `expo-dev-client` n'est pas obligatoire pour du JS pur. Mais comme tu as `gesture-handler` et `reanimated`, tu dois utiliser dev-client.
- **Expo Go** : Plus compatible avec les modules natifs. Utilise dev-client à la place.
- **Versionning** : Géré dans `app.json` (version = app version, sdkVersion = Expo SDK).
- **Environnements** : Utiliser les variables `EXPO_PUBLIC_*` pour les config publiques, et `.env.local` pour les locales.

---

## Ressources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native Fast Refresh](https://reactnative.dev/docs/fast-refresh)
- [Expo Router Navigation](https://expo.dev/docs/routing/introduction/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [MapLibre React Native](https://github.com/maplibre/maplibre-react-native)
- [Expo Documentation](https://docs.expo.dev/)

---

## Troubleshooting rapide

| Problème | Solution |
|----------|----------|
| Build fail : "Cannot find module X" | Vérifier `package.json` + `npm install --legacy-peer-deps` |
| App crash au démarrage | Vérifier `app/_layout.tsx`, imports, et GestureHandlerRootView |
| Carte ne s'affiche pas | Vérifier permissions dans `app.json` + API key MapLibre |
| QR code invalide / app ne se connecte pas | Même réseau WiFi, relancer `npm start`, vérifier l'APK installée |
| Fast Refresh ne marche pas | Vérifier `npm start` logs, relancer `npm start -- --reset-cache` |
| "Module natif manquant" | Rebuild EAS si nouvelle dépendance native ajoutée |
| Gesture-handler/Reanimated n'a pas l'air de marcher | Vérifier `GestureHandlerRootView` dans `app/_layout.tsx` + `babel.config.js` |
