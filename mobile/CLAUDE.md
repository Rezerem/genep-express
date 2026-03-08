# Genep'express — Mobile (Expo)

## Contexte projet
Application mobile de ravitaillement GPS sur pistes de ski.
Le client localise les ravitailleurs sur une carte 3D et envoie
une demande de rendez-vous GPS. Pas de catalogue, pas de panier.

## Stack technique
- **Framework** : React Native + Expo SDK 54
- **Routeur** : expo-router 6.0.23 (file-based, comme Next.js)
- **Langage** : TypeScript 5 strict
- **État global** : Zustand (stores dans `src/store/`)
- **Auth** : expo-auth-session → Google Sign-In → POST /auth/google → JWT stocké dans expo-secure-store
- **Carte** : react-native-maps (Expo Go compatible pour développement avec Fast Refresh)
- **GPS** : expo-location (`watchPositionAsync` pour les ravitailleurs)
- **Temps réel** : socket.io-client
- **HTTP** : axios avec intercepteur JWT automatique
- **Push** : expo-notifications (token FCM envoyé au backend après login)
- **Build** : EAS (Expo Application Services) pour APK customisée avec modules natifs

## Architecture des dossiers
```
genepexpress-mobile/
├── app/                       # Routes expo-router
│   ├── _layout.tsx            # Root layout — charge le token au démarrage
│   ├── index.tsx              # Route "/" — redirige selon auth/role (B-01)
│   ├── auth/
│   │   └── login.tsx          # Écran Google Sign-In (B-01)
│   ├── client/                # Screens skieurs
│   │   ├── _layout.tsx
│   │   ├── map.tsx            # Carte 3D + marqueurs agents (B-04)
│   │   └── order/[id].tsx     # Suivi commande temps réel (B-07)
│   └── genep/                 # Screens ravitailleurs
│       ├── _layout.tsx
│       ├── home.tsx           # Toggle service ON/OFF (B-02)
│       └── orders.tsx         # Liste commandes entrantes (B-07)
├── src/
│   ├── types/
│   │   └── index.ts           # Types partagés (User, Order, AgentPosition…)
│   ├── api/
│   │   └── client.ts          # Axios singleton + intercepteur JWT
│   ├── store/
│   │   ├── useAuthStore.ts    # token, user, setAuth, clearAuth
│   │   ├── usePositionsStore.ts  # positions agents temps réel (B-03)
│   │   └── useOrderStore.ts   # commande en cours (B-06/07)
│   ├── hooks/
│   │   ├── useSocket.ts       # Connexion WS + events (B-03)
│   │   └── useLocation.ts     # expo-location wrapper (B-03)
│   ├── lib/
│   │   └── distance.ts        # Haversine 3D — même logique que le back
│   ├── components/            # Composants réutilisables
│   └── screens/
│       └── HealthScreen.tsx   # Gate de validation B-00
```

## Conventions TypeScript
Suivre convention.md

## Gestion de l'état
```
useAuthStore    → token, user, role (persisté dans SecureStore)
usePositionsStore → agents: AgentPosition[] (WebSocket, en mémoire)
useOrderStore   → ordre en cours du client / liste pour le genep
```

## Variables d'environnement (.env.local)
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_MAPTILER_KEY=
```
⚠️ `EXPO_PUBLIC_*` est injecté dans le bundle — ne jamais y mettre de secrets.

## Commandes

### Développement
```bash
npm install --legacy-peer-deps      # Installer dépendances (SDK 54 requis)
npm start                           # Lancer serveur Expo
npm start -- --tunnel              # Mode tunnel (si pare-feu bloque)
npm run typecheck                  # Vérifier types TypeScript
```

### Build & Déploiement (EAS)
```bash
# Une seule fois : login et initialiser
eas login
eas init

# Build preview (développement avec QR code + Fast Refresh)
eas build --platform android --profile preview

# Build production (AAB pour Google Play)
eas build --platform android --profile production

# Voir les builds récentes
eas build --latest
```

**Voir [EAS_BUILD.md](./EAS_BUILD.md) pour le guide complet de débogage.**

## Important — EXPO_PUBLIC_API_URL en dev local
Utiliser l'IP LAN de la machine (pas localhost) :
```bash
ipconfig   # (Windows) → IPv4 de la carte WiFi, ex: 192.168.1.42
# Dans .env :
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

## Workflow typique

1. **Développement local (recommandé)** :
   ```bash
   npm start
   # Scanne le QR code avec Expo Go
   # Fast Refresh = rechargement instantané pour JS
   # Carte react-native-maps fonctionne immédiatement
   ```

2. **Build APK preview** (pour tester la version compilée) :
   ```bash
   eas build --platform android --profile preview
   # Installe sur Android physique
   # Voir [EAS_BUILD.md](./EAS_BUILD.md) pour le débogage
   ```

3. **Production** :
   ```bash
   # Nouvelle build production
   eas build --platform android --profile production

   # L'APK est prête à télécharger ou publier sur Google Play
   ```

## État d'avancement
- [x] B-00 : Socle Expo + HealthScreen
- [ ] B-01 : Auth Google + navigation conditionnelle
- [ ] B-02 : Écran ravitailleur + toggle service
- [ ] B-03 : WebSocket positions + store
- [ ] B-04 : Carte MapLibre 3D + pistes + marqueurs
- [ ] B-06 : Création commande GPS (tap sur carte)
- [ ] B-07 : Suivi commande temps réel
- [ ] B-08 : Dashboard admin
- [ ] B-09 : CRUD admin
