# Genep'express — API Backend

## Contexte projet
Application mobile de ravitaillement GPS sur pistes de ski.
Des agents mobiles (ravitailleurs) circulent sur les pistes avec un stock.
Les skieurs les localisent sur une carte 3D en temps réel et passent commande.
Modèle B2B — vendu aux stations. Pas de paiement in-app au MVP.

## Stack technique
- **Runtime** : Node.js 20 LTS
- **Langage** : TypeScript 5 strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Framework** : Fastify 4 (+ @fastify/jwt, @fastify/cors)
- **ORM** : Prisma 5 + PostgreSQL 16 + PostGIS 3.4 (Docker)
- **Cache** : Redis 7 (Docker) — TTL 10s sur positions GPS
- **Temps réel** : Socket.io 4
- **Push notifs** : Firebase Admin SDK (FCM)
- **Dev runner** : `tsx watch` (pas de compilation en dev)
- **Build prod** : `tsc` → `dist/`

## Architecture des dossiers
```
genepexpress-api/
├── src/
│   ├── server.ts              # Point d'entrée — boot Fastify
│   ├── types/
│   │   └── fastify.d.ts       # Augmentation FastifyInstance (prisma, redis)
│   ├── plugins/               # Plugins fp() enregistrés dans server.ts
│   │   ├── prisma.ts          # Décore fastify.prisma
│   │   ├── redis.ts           # Décore fastify.redis
│   │   └── socket.ts          # Init Socket.io (B-03)
│   ├── routes/                # Une feature = un fichier
│   │   ├── health.ts          # GET /health
│   │   ├── auth.ts            # POST /auth/login|refresh, GET /auth/me (B-01)
│   │   ├── genep.ts           # Ravitailleurs : status, FCM token (B-02)
│   │   ├── products.ts        # Catalogue public (B-05)
│   │   ├── orders.ts          # Commandes + transitions statut (B-06/07)
│   │   ├── map.ts             # Proxy Overpass + cache (B-04)
│   │   └── admin.ts           # Routes admin (B-08/09)
│   ├── middleware/
│   │   └── auth.ts            # verifyJWT, verifyRole(role) (B-01)
│   └── lib/
│       ├── firebase.ts        # Firebase Admin SDK init (B-07)
│       └── distance.ts        # Haversine 3D (B-04)
├── prisma/
│   ├── schema.prisma          # Modèles DB
│   └── seed.ts                # Données de test
├── tsconfig.json
├── package.json
└── .env.example
```

## Modèles Prisma
- **User** : `id, email, passwordHash, role (GENEP|ADMIN), active`
- **GenepeExpress** : `id, userId FK, name, lat, lng, altitude, available, fcmToken, updatedAt`
- **Product** : `id, name, price, imageUrl, available, stock`
- **Order** : `id, status (OrderStatus enum), items Json, meetLat, meetLng, clientFcmToken, genepId FK`

## Conventions TypeScript
Suivre strictement https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

- **Préférer `interface` à `type`** pour les shapes d'objets
- **Ne jamais utiliser `any`** — utiliser `unknown` puis narrower
- **Toujours typer les retours** des fonctions `async` : `Promise<void>`, `Promise<MyType>`
- **Erreurs** : `catch (err: unknown)` — ne pas assumer le type
- **Augmentation de module** : déclarée dans `src/types/fastify.d.ts`
- **Imports** : toujours avec extension `.js` (résolution NodeNext)

## Conventions Fastify
- Chaque route exporte une fonction `async (fastify: FastifyInstance): Promise<void>`
- Schéma JSON défini inline sur chaque route pour la validation + sérialisation
- Décorateurs enregistrés via `fastify-plugin` (fp) pour qu'ils soient visibles globalement
- Erreurs : `reply.code(4xx).send({ error: 'message' })` — pas de throw brut
- Logs : `fastify.log.info/warn/error()` — jamais `console.log`

## Redis — conventions clés
```
location:{genepId}  →  {"lat": 0.0, "lng": 0.0, "altitude": 0.0}  TTL 10s
pistes:{bboxHash}   →  GeoJSON string                              TTL 300s
```

## WebSocket — events Socket.io (B-03)
```
agent:position     emit ravitailleur→serveur  {lat, lng, altitude}
positions:update   broadcast serveur→clients  {agents: AgentPosition[]}
order:status       broadcast serveur→client   {orderId, status}
```
Auth WS : JWT dans `socket.handshake.auth.token`

## Variables d'environnement
```
PORT=3000
NODE_ENV=development
JWT_SECRET=
DATABASE_URL="postgresql://user:pass@localhost:5432/genepexpress"
REDIS_URL="redis://localhost:6379"
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

## Commandes
```powershell
npm run dev                        # tsx watch — hot reload sans compilation
npm run typecheck                  # tsc --noEmit — vérification types
npm run build                      # compile vers dist/
npx prisma migrate dev --name xxx  # créer une migration
npm run db:seed                    # seeder (tsx prisma/seed.ts)
npx prisma studio                  # UI DB sur :5555
docker ps                          # vérifier genep-db + genep-redis UP
docker exec -it genep-redis redis-cli ping
```

## État d'avancement
- [x] B-00 : Socle Fastify + DB + Redis
- [ ] B-01 : Auth JWT
- [ ] B-02 : Profil ravitailleur + FCM
- [ ] B-03 : WebSocket GPS
- [ ] B-04 : Carte MapLibre + Overpass
- [ ] B-05 : Catalogue produits
- [ ] B-06 : Création commande
- [ ] B-07 : Gestion commande + statuts RT
- [ ] B-08 : Dashboard admin
- [ ] B-09 : CRUD admin
