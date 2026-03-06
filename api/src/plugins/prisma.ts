import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV !== 'production'
      ? ['query', 'warn', 'error']
      : ['error'],
  })

  await prisma.$connect()
  fastify.log.info('Prisma connected to PostgreSQL')

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async (): Promise<void> => {
    await prisma.$disconnect()
    fastify.log.info('Prisma disconnected')
  })
}

export default fp(prismaPlugin, { name: 'prisma' })
