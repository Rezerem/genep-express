import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ZodTypeProvider } from '@marcalexiei/fastify-type-provider-zod'
import { verifyJWT, verifyRole } from '../middleware/auth.js'

// ── Validation ──────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  genepId: z.string().min(1),
  meetLat: z.number(),
  meetLng: z.number(),
})

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'en_route', 'delivered', 'cancelled']),
})

// ── Route ──────────────────────────────────────────────────────────────────

export async function ordersRoute(fastify: FastifyInstance): Promise<void> {
  const fp = fastify.withTypeProvider<ZodTypeProvider>()

  // POST /orders — client créé une commande
  fp.post<{ Body: z.infer<typeof createOrderSchema> }>(
    '/',
    {
      preHandler: [verifyJWT, verifyRole('CLIENT')],
      schema: {
        body: createOrderSchema,
      },
    },
    async (request, reply) => {
      const { genepId, meetLat, meetLng } = request.body

      // Vérifier que le genep existe et est disponible
      const genep = await fastify.prisma.genepeExpress.findUnique({
        where: { id: genepId },
        select: { userId: true, available: true },
      })

      if (!genep) {
        return reply.code(404).send({ error: 'Genep not found' })
      }

      if (!genep.available) {
        return reply.code(409).send({ error: 'Genep is not available' })
      }

      // Créer la commande
      const order = await fastify.prisma.order.create({
        data: {
          genepId,
          clientId: request.user.id,
          meetLat,
          meetLng,
        },
      })

      // Émettre l'événement order:new au genep via sa room personnelle
      fastify.io.to(`user:${genep.userId}`).emit('order:new', {
        orderId: order.id,
        clientId: order.clientId,
        meetLat: order.meetLat,
        meetLng: order.meetLng,
        createdAt: order.createdAt,
      })

      return reply.code(201).send(order)
    }
  )

  // PATCH /orders/:id/status — genep met à jour le statut
  fp.patch<{ Params: { id: string }; Body: z.infer<typeof updateOrderStatusSchema> }>(
    '/:id/status',
    {
      preHandler: [verifyJWT, verifyRole('GENEP')],
      schema: {
        body: updateOrderStatusSchema,
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { status } = request.body

      // Récupérer la commande
      const order = await fastify.prisma.order.findUnique({
        where: { id },
        select: { genepId: true, clientId: true },
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      // Vérifier que le genep connecté est le bon
      const genep = await fastify.prisma.genepeExpress.findFirst({
        where: { userId: request.user.id },
        select: { id: true },
      })

      if (!genep || genep.id !== order.genepId) {
        return reply.code(403).send({ error: 'Not authorized to update this order' })
      }

      // Mettre à jour le statut
      const updated = await fastify.prisma.order.update({
        where: { id },
        data: { status },
      })

      // Émettre l'événement order:status au client via sa room personnelle
      fastify.io.to(`user:${order.clientId}`).emit('order:status', {
        orderId: id,
        status,
      })

      return reply.send(updated)
    }
  )

  // GET /orders/:id — client ou genep assigné peut récupérer les détails
  fp.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [verifyJWT],
      schema: {
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const order = await fastify.prisma.order.findUnique({
        where: { id },
        include: {
          genep: {
            select: { name: true },
          },
        },
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      // Vérifier l'accès : soit client qui a passé la commande, soit genep assigné
      const userIsClient = request.user.id === order.clientId
      const userIsGenep = await fastify.prisma.genepeExpress.findFirst({
        where: { userId: request.user.id, id: order.genepId },
        select: { id: true },
      })

      if (!userIsClient && !userIsGenep) {
        return reply.code(403).send({ error: 'Not authorized to access this order' })
      }

      return reply.send(order)
    }
  )
}
