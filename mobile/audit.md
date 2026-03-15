# Audit — Mobile (Expo)

Ce fichier trace les audits de qualité et les correctifs associés.
Consulter ce fichier avant toute modification structurelle du codebase mobile.

---

## [2026-03-15] Audit Mix JSX / Logic / Styles

### Problème
Le package `mobile/` mélange dans plusieurs fichiers trois niveaux de responsabilité :
- **JSX/Markup** — structure de l'interface
- **Logic JS** — état, effets, appels API, GPS, WebSocket
- **Styles** — objets inline ou StyleSheet

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/hooks/useGpsTracking.ts` | GPS watchPositionAsync + fallback polling + émission socket |
| `src/hooks/useOrderManagement.ts` | Handlers accept / refuse / en_route / delivered |
| `src/hooks/useMapInitialization.ts` | Permission localisation + fetch pistes GeoJSON |
| `src/services/socketHandlers.ts` | Enregistrement des événements socket → stores Zustand |
| `app/genep/home.styles.ts` | StyleSheet de `genep/home.tsx` (inline styles supprimés) |
| `app/auth/login.styles.ts` | StyleSheet de `auth/login.tsx` (inline styles supprimés) |
| `app/client/MapComponent/RecenterButton.tsx` | Composant bouton recentrer extrait de `Map.tsx` |
| `app/client/order/OrderTrackingScreen.styles.ts` | StyleSheet + `statusColors` + `statusLabels` |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/lib/distance.ts` | Export de `haversine2D` (était privée) |
| `src/store/usePositionsStore.ts` | Suppression du doublon Haversine local → import `haversine2D` |
| `src/hooks/useSocket.ts` | Connexion/lifecycle uniquement ; handlers délégués à `socketHandlers.ts` |
| `app/genep/home.tsx` | JSX seul (~120 lignes) ; logic extraite vers 2 hooks + styles |
| `app/auth/login.tsx` | Styles externalisés vers `login.styles.ts` |
| `app/client/MapComponent/Map.tsx` | Utilise `useMapInitialization` + `RecenterButton` importé |
| `app/client/order/OrderTrackingScreen.tsx` | StyleSheet + mappings déplacés vers fichier `.styles.ts` |
| `app/client/MapBottomSheet/MapBottomSheet.tsx` | Doublon Haversine remplacé par `haversine2D` (÷ 1000 pour km) |

### Ce qui n'a pas été séparé (intentionnel)

| Fichier | Raison |
|---|---|
| `app/client/MapContainer/MapContainer.tsx` | `useMemo` retourne du JSX — impossible à extraire d'un composant |
| `app/_layout.tsx`, `app/genep/_layout.tsx` | `style={{ flex: 1 }}` seul — sur-engineering de créer un fichier styles |
| `src/store/useAuthStore.ts` | `SecureStore` + état Zustand atomique — séparer introduit une race condition |
| `src/hooks/useHealthCheck.ts` | Hook pur, 52 lignes, concern unique |
| `src/api/client.ts` | Intercepteur JWT enregistré sur l'instance Axios à la création — circulaire si séparé |

---

## [2026-03-15] Fix — `Property 'calculateDistance' doesn't exist` (runtime)

**Timestamp :** 2026-03-15
**Contexte :** Après l'audit ci-dessus, l'exception apparaissait au runtime malgré 0 erreur TypeScript.

**Cause :** Cache Metro périmé. Le bundle compilé contenait encore l'ancienne version de
`MapBottomSheet.tsx` avec la fonction locale `calculateDistance`, supprimée lors du refactor.
`npm run typecheck` passe car il lit les sources, mais Metro sert le bundle mis en cache.

**Fix :**
```bash
npx expo start --clear
```
Le flag `--clear` purge le cache de transformation Metro et force un re-bundle complet.

**Règle à retenir :** Après tout refactor qui supprime des symboles (fonctions, variables),
toujours relancer Metro avec `--clear` si une erreur runtime signale un identifiant inexistant
alors que TypeScript ne rapporte rien.
