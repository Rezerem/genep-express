import fp from 'fastify-plugin'
import { createClient } from 'redis'
import type { FastifyInstance } from 'fastify'

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  })

  client.on('error', (err: Error) => {
    fastify.log.error({ err }, 'Redis client error')
  })

  client.on('reconnecting', () => {
    fastify.log.warn('Redis reconnecting...')
  })

  await client.connect()
  fastify.log.info('Redis connected')

  // Le cast est nécessaire car createClient() retourne un type générique
  // RedisClientType représente le client connecté avec toutes les commandes typées
  fastify.decorate('redis', client as Parameters<typeof fastify.decorate<'redis'>>[1])

  fastify.addHook('onClose', async (): Promise<void> => {
    await client.quit()
    fastify.log.info('Redis disconnected')
  })
}

export default fp(redisPlugin, { name: 'redis' })
