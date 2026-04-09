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

  // GET /health/pistes-debug — Debug endpoint for missing pistes
  fastify.get('/health/pistes-debug', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redisConnected = (await fastify.redis.ping()) === 'PONG'

      // Get sample cache keys
      const cacheKeys = await fastify.redis.keys('pistes:*')
      const cacheSamples = []

      for (const key of cacheKeys.slice(0, 3)) {
        const ttl = await fastify.redis.ttl(key)
        const data = await fastify.redis.get(key)
        if (data) {
          const parsed = JSON.parse(data)
          cacheSamples.push({
            key,
            ttl_remaining_s: ttl,
            features_count: parsed.features?.length || 0,
          })
        }
      }

      // Check Overpass API status
      let overpassStatus = 'unknown'
      try {
        const statusResponse = await fetch('https://overpass-api.de/api/status', {
          signal: AbortSignal.timeout(5000),
        })
        overpassStatus = statusResponse.ok ? 'ok' : 'error'
      } catch (err: unknown) {
        overpassStatus = 'unreachable'
      }

      const debugInfo = {
        overpass_status: overpassStatus,
        redis_connected: redisConnected,
        cache_keys_total: cacheKeys.length,
        cache_samples: cacheSamples,
        timestamp: new Date().toISOString(),
      }

      return reply.send(debugInfo)
    } catch (err: unknown) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Debug endpoint error' })
    }
  })
}
