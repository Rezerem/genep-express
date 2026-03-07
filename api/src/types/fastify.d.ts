import type { RedisClientType } from 'redis'
import type { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType
    prisma: PrismaClient
  }
}
