import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Role } from '@prisma/client'

export async function verifyJWT(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
}

export function verifyRole(role: Role) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (request.user.role !== role) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }
}
