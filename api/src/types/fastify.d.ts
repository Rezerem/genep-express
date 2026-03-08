import type { RedisClientType } from 'redis'
import type { PrismaClient } from '@prisma/client'
import type { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType
    prisma: PrismaClient
    io: Server
  }
}
