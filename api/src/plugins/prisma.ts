import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../adapter/prisma-adapter.js'

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {

  await prisma.$connect()
  fastify.log.info('Prisma connected to PostgreSQL')

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async (): Promise<void> => {
    await prisma.$disconnect()
    fastify.log.info('Prisma disconnected')
  })
}

export default fp(prismaPlugin, { name: 'prisma' })
