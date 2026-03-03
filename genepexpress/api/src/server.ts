import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import { healthRoute } from './routes/health.js'

// ── Types ─────────────────────────────────────────────────────────────────────

// Utilisé pour l'augmentation du JWT (B-01)
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: 'GENEP' | 'ADMIN' }
    user: { id: string; role: 'GENEP' | 'ADMIN' }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

const fastify = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// ── Plugins ───────────────────────────────────────────────────────────────────

await fastify.register(cors, {
  origin: true, // À restreindre en production
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
})

await fastify.register(prismaPlugin)
await fastify.register(redisPlugin)

// ── Routes ────────────────────────────────────────────────────────────────────

await fastify.register(healthRoute)

// ── Boot ──────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3000

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
} catch (err: unknown) {
  fastify.log.error(err)
  process.exit(1)
}
