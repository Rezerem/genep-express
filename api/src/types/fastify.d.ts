import type { PrismaClient } from '@prisma/client'
import type { RedisClientType } from 'redis'

// Augmente le type FastifyInstance pour inclure nos décorations
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    redis: RedisClientType
  }
}
