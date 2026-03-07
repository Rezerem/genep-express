import type { FastifyInstance } from 'fastify'
import type { LoginTicket } from 'google-auth-library'
import { OAuth2Client } from 'google-auth-library'
import { verifyJWT } from '../middleware/auth.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ── Types ──────────────────────────────────────────────────────────────────────

interface GoogleBody {
  idToken: string
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function authRoute(fastify: FastifyInstance): Promise<void> {

  // POST /auth/google — échange un ID token Google contre nos JWT
  fastify.post<{ Body: GoogleBody }>('/auth/google', {
    schema: {
      body: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { idToken } = request.body

    let googleId: string
    let email: string

    try {
      const ticket = (await googleClient.verifyIdToken({
        idToken,
        ...(process.env.GOOGLE_CLIENT_ID !== undefined && {
          audience: process.env.GOOGLE_CLIENT_ID,
        }),
      })) as LoginTicket
      const payload = ticket.getPayload()
      if (!payload?.sub || !payload.email) {
        return reply.code(401).send({ error: 'Invalid Google token' })
      }
      googleId = payload.sub
      email = payload.email
    } catch {
      return reply.code(401).send({ error: 'Invalid Google token' })
    }

    // Seuls les comptes Gmail sont acceptés
    if (!email.endsWith('@gmail.com')) {
      return reply.code(403).send({ error: 'Only Gmail accounts are allowed' })
    }

    const user = await fastify.prisma.user.upsert({
      where: { googleId },
      update: { email },
      create: { googleId, email },
    })

    if (!user.active) {
      return reply.code(403).send({ error: 'Account disabled' })
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role }

    const token = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' })

    return reply.send({ token, user: tokenPayload })
  })

  // GET /auth/me — profil de l'utilisateur connecté
  fastify.get('/auth/me', { preHandler: verifyJWT }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, role: true, active: true, createdAt: true },
    })

    if (!user) return reply.code(404).send({ error: 'User not found' })

    return reply.send(user)
  })
}
