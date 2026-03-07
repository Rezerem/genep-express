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