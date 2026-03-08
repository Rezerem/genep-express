import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod'
import { verifyJWT, verifyRole } from '../middleware/auth.js'

// ── Validation ──────────────────────────────────────────────────────────────

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
})

const updateAvailabilitySchema = z.object({
  available: z.boolean(),
})

// ── Route ──────────────────────────────────────────────────────────────────

export async function genepRoute(fastify: FastifyInstance): Promise<void> {
  const fp = fastify.withTypeProvider<ZodTypeProvider>()

  // POST /genep/profile — crée le profil GenepeExpress s'il n'existe pas
  fp.post<{ Body: z.infer<typeof createProfileSchema> }>(
    '/profile',
    {
      preHandler: [verifyJWT, verifyRole('GENEP')],
      schema: {
        body: createProfileSchema,
      },
    },
    async (request, reply) => {
      const { name } = request.body

      const genep = await fastify.prisma.genepeExpress.upsert({
        where: { userId: request.user.id },
        update: {},
        create: {
          userId: request.user.id,
          name,
        },
      })

      return reply.send({
        id: genep.id,
        name: genep.name,
        available: genep.available,
      })
    }
  )

  // PATCH /genep/available — met à jour la disponibilité
  fp.patch<{ Body: z.infer<typeof updateAvailabilitySchema> }>(
    '/available',
    {
      preHandler: [verifyJWT, verifyRole('GENEP')],
      schema: {
        body: updateAvailabilitySchema,
      },
    },
    async (request, reply) => {
      const { available } = request.body

      const genep = await fastify.prisma.genepeExpress.update({
        where: { userId: request.user.id },
        data: { available },
      })

      // Broadcast availability change via WebSocket
      fastify.io.emit('genep:availability', {
        id: genep.id,
        name: genep.name,
        available: genep.available,
      })

      return reply.send({ available })
    }
  )
}
