import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { z } from 'zod'
import { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

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

function transformOverpassToGeoJSON(data: unknown, cacheKey: string, fastifyLog: any): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = []

  if (!data || typeof data !== 'object') {
    fastifyLog.warn(`[Pistes Parsing] Invalid data type for ${cacheKey}`)
    return { type: 'FeatureCollection', features }
  }

  const d = data as any
  let waysProcessed = 0
  let relationsProcessed = 0
  let waysSkipped = 0
  let relationsSkipped = 0

  // Process ways
  if (Array.isArray(d.ways)) {
    d.ways.forEach((way: any) => {
      if (!way.geometry || !Array.isArray(way.geometry) || way.geometry.length < 2) {
        waysSkipped++
        return
      }

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
      waysProcessed++
    })
  }

  // Process relations
  if (Array.isArray(d.relations)) {
    d.relations.forEach((relation: any) => {
      if (!relation.geometry || !Array.isArray(relation.geometry) || relation.geometry.length < 2) {
        relationsSkipped++
        return
      }

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
      relationsProcessed++
    })
  }

  fastifyLog.info(
    `[Pistes Parsing] ${cacheKey}: processed=${waysProcessed} ways + ${relationsProcessed} relations, skipped=${waysSkipped} ways + ${relationsSkipped} relations`
  )

  return {
    type: 'FeatureCollection',
    features,
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const PISTES_CACHE_TTL_S = 30 * 60  // 30 minutes

// ── Load Static Data ────────────────────────────────────────────────────────

let staticPistesData: GeoJSONFeatureCollection | null = null

function loadStaticPistesData(): void {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const dataPath = path.join(__dirname, '../data/pistes-static.geojson')

    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8')
      const rawData = JSON.parse(fileContent) as GeoJSONFeatureCollection

      // Transform properties: copy piste:* tags to top-level properties
      staticPistesData = {
        type: 'FeatureCollection',
        features: rawData.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            // Rename piste:difficulty to difficulty
            difficulty: (feature.properties as any)?.['piste:difficulty'],
            type: (feature.properties as any)?.['piste:type'],
            grooming: (feature.properties as any)?.['piste:grooming'],
            status: (feature.properties as any)?.['piste:status'],
          }
        }))
      }

      console.log(`[Pistes Static] Loaded ${staticPistesData.features.length} features from static file`)
    } else {
      console.warn(`[Pistes Static] No static data file found at ${dataPath}`)
      console.warn(`[Pistes Static] Run: npm run download-pistes`)
      staticPistesData = { type: 'FeatureCollection', features: [] }
    }
  } catch (err: unknown) {
    console.error(`[Pistes Static] Error loading data:`, err instanceof Error ? err.message : String(err))
    staticPistesData = { type: 'FeatureCollection', features: [] }
  }
}

/**
 * Filter GeoJSON features by bounding box
 * Returns only features with coordinates within the bbox
 */
function filterPistesByBbox(
  features: GeoJSONFeature[],
  south: number,
  west: number,
  north: number,
  east: number
): GeoJSONFeature[] {
  return features.filter(feature => {
    if (feature.geometry.type !== 'LineString') return false

    // Check if any coordinate is within bbox
    return feature.geometry.coordinates.some(
      ([lon, lat]) => lon >= west && lon <= east && lat >= south && lat <= north
    )
  })
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function mapRoute(fastify: FastifyInstance): Promise<void> {
  // Load static piste data on route initialization
  loadStaticPistesData()

  // GET /map/pistes — serve static piste data filtered by bbox
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

      try {
        // Ensure data is loaded
        if (!staticPistesData) {
          loadStaticPistesData()
        }

        if (!staticPistesData || staticPistesData.features.length === 0) {
          fastify.log.warn(`[Pistes Static] No static data available`)
          return reply.send({ type: 'FeatureCollection', features: [] })
        }

        // Filter by bbox
        const startTime = Date.now()
        const filteredFeatures = filterPistesByBbox(
          staticPistesData.features,
          south,
          west,
          north,
          east
        )
        const duration = Date.now() - startTime

        const response: GeoJSONFeatureCollection = {
          type: 'FeatureCollection',
          features: filteredFeatures,
        }

        fastify.log.info(
          `[Pistes Static] Bbox (${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)}): returned ${filteredFeatures.length}/${staticPistesData.features.length} features (${duration}ms)`
        )

        return reply.send(response)
      } catch (err: unknown) {
        fastify.log.error(`[Pistes] Error: ${err instanceof Error ? err.message : String(err)}`)
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
