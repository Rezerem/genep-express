import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import {
  ZodTypeProvider,
  createSerializerCompiler,
  createValidatorCompiler,
} from '@marcalexiei/fastify-type-provider-zod'

import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import { healthRoute } from './routes/health.js'
import { authRoute } from './routes/auth.js'

// ── Types ─────────────────────────────────────────────────────────────────────

// Utilisé pour l'augmentation du JWT (B-01) — authentification Google OAuth
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; role: 'GENEP' | 'ADMIN' }
    user: { id: string; email: string; role: 'GENEP' | 'ADMIN' }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

const fastify = Fastify({
  logger:
      process.env.NODE_ENV !== 'production'
          ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
          : true,
}).withTypeProvider<ZodTypeProvider>()


fastify.setValidatorCompiler(createValidatorCompiler())
fastify.setSerializerCompiler(createSerializerCompiler())

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
await fastify.register(authRoute)

// ── Boot ──────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3000

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
} catch (err: unknown) {
  fastify.log.error(err)
  process.exit(1)
}
