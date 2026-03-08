import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod'
import { HealthReplySchema, type HealthReply } from '../types/health/schemas.js'

export async function healthRoute(fastify: FastifyInstance): Promise<void> {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        response: {
          200: HealthReplySchema,
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply): Promise<HealthReply> => {
      const result: HealthReply = {
        status: 'ok',
        db: 'unknown',
        redis: 'unknown',
        overpass: 'unknown',
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

      // ── Overpass API ──────────────────────────────────────────────────────────
      try {
        const overpassResponse = await fetch('https://overpass-api.de/api/status', {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })
        result.overpass = overpassResponse.ok ? 'ok' : 'error'
        if (result.overpass === 'error') result.status = 'degraded'
      } catch (err: unknown) {
        fastify.log.warn({ err }, 'Health check: Overpass API failed')
        result.overpass = 'error'
        result.status = 'degraded'
      }

      const statusCode = result.status === 'ok' ? 200 : 503
      return reply.code(statusCode).send(result)
    }
  )
}
