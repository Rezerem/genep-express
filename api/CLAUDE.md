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

## Architecture Dossier
Voir fichier Architecture.md

## Modèles Prisma
- **User** : `id, email (Gmail), googleId (Google OAuth subject), role (GENEP|ADMIN), active`
- **GenepeExpress** : `id, userId FK, name, lat, lng, altitude, available, fcmToken, updatedAt`
- **Order** : `id, status (OrderStatus enum), meetLat, meetLng, genepId FK` — une commande = un point GPS ("viens ici")

## Conventions TypeScript
Suivre fichier Conventions.md

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
