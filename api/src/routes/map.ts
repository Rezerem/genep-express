import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { z } from 'zod'
import { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod'

// ── Types ──────────────────────────────────────────────────────────────────────

interface OverpassNode {
  id: number
  lat: number
  lon: number
}

interface OverpassRelationMember {
  type: 'node' | 'way' | 'relation'
  ref: number
  role: string
}

interface OverpassWay {
  id: number
  nodes: number[]
  tags: Record<string, string>
  geometry?: OverpassNode[]
}

interface OverpassRelation {
  id: number
  members: OverpassRelationMember[]
  tags: Record<string, string>
  geometry?: OverpassNode[]
}

interface OverpassResponse {
  nodes: OverpassNode[]
  ways: OverpassWay[]
  relations: OverpassRelation[]
}

interface GeoJSONProperties {
  name?: string
  difficulty?: string
  type?: string
  grooming?: string
  status?: string
  id: string
}

interface GeoJSONLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONLineString
  properties: GeoJSONProperties
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// ── Validation ──────────────────────────────────────────────────────────

const bboxSchema = z.object({
  south: z.coerce.number().min(-90).max(90),
  west: z.coerce.number().min(-180).max(180),
  north: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
})

// ── Utilities ──────────────────────────────────────────────────────────────

function hashBbox(south: number, west: number, north: number, east: number): string {
  const str = `${south},${west},${north},${east}`
  return createHash('md5').update(str).digest('hex').substring(0, 12)
}

function buildOverpassQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bbox = `${south},${west},${north},${east}`
  return `[out:json][timeout:15];
(
  way["piste:type"~"downhill|nordic|skitour"](${bbox});
  relation["piste:type"~"downhill|nordic|skitour"](${bbox});
);
out geom;`
}

function transformOverpassToGeoJSON(data: unknown): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = []

  if (!data || typeof data !== 'object') {
    return { type: 'FeatureCollection', features }
  }

  const d = data as any

  // Process ways
  if (Array.isArray(d.ways)) {
    d.ways.forEach((way: any) => {
      if (!way.geometry || !Array.isArray(way.geometry) || way.geometry.length < 2) return

      const coordinates = way.geometry.map((node: any) => [node.lon, node.lat] as [number, number])

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          id: `way-${way.id}`,
          name: way.tags?.name,
          difficulty: way.tags?.['piste:difficulty'],
          type: way.tags?.['piste:type'],
          grooming: way.tags?.['piste:grooming'],
          status: way.tags?.['piste:status'],
        },
      })
    })
  }

  // Process relations
  if (Array.isArray(d.relations)) {
    d.relations.forEach((relation: any) => {
      if (!relation.geometry || !Array.isArray(relation.geometry) || relation.geometry.length < 2) return

      const coordinates = relation.geometry.map((node: any) => [node.lon, node.lat] as [number, number])

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          id: `relation-${relation.id}`,
          name: relation.tags?.name,
          difficulty: relation.tags?.['piste:difficulty'],
          type: relation.tags?.['piste:type'],
          grooming: relation.tags?.['piste:grooming'],
          status: relation.tags?.['piste:status'],
        },
      })
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const PISTES_CACHE_TTL_S = 30 * 60  // 30 minutes

// ── Route Handler ──────────────────────────────────────────────────────────

export async function mapRoute(fastify: FastifyInstance): Promise<void> {
  // GET /map/pistes — proxy Overpass API avec cache Redis
  fastify.withTypeProvider<ZodTypeProvider>().get<{ Querystring: z.infer<typeof bboxSchema> }>(
    '/pistes',
    {
      schema: {
        querystring: bboxSchema,
      },
    },
    async (request, reply) => {
      const parsed = bboxSchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid bounding box parameters' })
      }

      const { south, west, north, east } = parsed.data

      // Cache key
      const cacheKey = `pistes:${hashBbox(south, west, north, east)}`

      try {
        // Check cache
        const cached = await fastify.redis.get(cacheKey)
        if (cached) {
          fastify.log.info(`Cache hit: ${cacheKey}`)
          return reply.send(JSON.parse(cached))
        }

        // Query Overpass API
        const query = buildOverpassQuery(south, west, north, east)
        const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        })

        if (!overpassResponse.ok) {
          fastify.log.error(`Overpass API error: ${overpassResponse.status}`)
          return reply.code(503).send({ error: 'Map service temporarily unavailable' })
        }

        const overpassData = (await overpassResponse.json()) as OverpassResponse

        // Transform to GeoJSON
        const geojson = transformOverpassToGeoJSON(overpassData)

        // Cache for 30 minutes
        await fastify.redis.setEx(cacheKey, PISTES_CACHE_TTL_S, JSON.stringify(geojson))

        return reply.send(geojson)
      } catch (err: unknown) {
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // GET /map/agents — liste des agents actifs depuis Redis
  fastify.get('/agents', async (_request, reply) => {
    try {
      const redis = fastify.redis
      const keys = await redis.keys('location:*')

      if (keys.length === 0) {
        return reply.send([])
      }

      const agents = []

      for (const key of keys) {
        const genepId = key.replace('location:', '')
        const locationData = await redis.get(key)

        if (!locationData) continue

        try {
          const position = JSON.parse(locationData)

          // Join with Prisma for name and availability
          const genep = await fastify.prisma.genepeExpress.findUnique({
            where: { id: genepId },
            select: { name: true, available: true },
          })

          if (!genep) continue

          agents.push({
            id: genepId,
            name: genep.name,
            lat: position.lat,
            lng: position.lng,
            altitude: position.altitude,
            available: genep.available,
          })
        } catch (parseErr: unknown) {
          fastify.log.warn(`Failed to parse location data for ${genepId}`)
        }
      }

      return reply.send(agents)
    } catch (err: unknown) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })
}
