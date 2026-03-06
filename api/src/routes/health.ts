import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

interface HealthReply {
  status: 'ok' | 'degraded'
  db: 'ok' | 'error' | 'unknown'
  redis: 'ok' | 'error' | 'unknown'
  uptime: number
}

export async function healthRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok', 'degraded'] },
              db:     { type: 'string', enum: ['ok', 'error', 'unknown'] },
              redis:  { type: 'string', enum: ['ok', 'error', 'unknown'] },
              uptime: { type: 'number' },
            },
            required: ['status', 'db', 'redis', 'uptime'],
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply): Promise<HealthReply> => {
      const result: HealthReply = {
        status: 'ok',
        db: 'unknown',
        redis: 'unknown',
        uptime: Math.floor(process.uptime()),
      }

      // ── PostgreSQL ───────────────────────────────────────────────────────────
      try {
        await fastify.prisma.$queryRaw`SELECT 1`
        result.db = 'ok'
      } catch (err: unknown) {
        fastify.log.error({ err }, 'Health check: DB failed')
        result.db = 'error'
        result.status = 'degraded'
      }

      // ── Redis ────────────────────────────────────────────────────────────────
      try {
        const pong = await fastify.redis.ping()
        result.redis = pong === 'PONG' ? 'ok' : 'error'
        if (result.redis === 'error') result.status = 'degraded'
      } catch (err: unknown) {
        fastify.log.error({ err }, 'Health check: Redis failed')
        result.redis = 'error'
        result.status = 'degraded'
      }

      const statusCode = result.status === 'ok' ? 200 : 503
      return reply.code(statusCode).send(result)
    }
  )
}
