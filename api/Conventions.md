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