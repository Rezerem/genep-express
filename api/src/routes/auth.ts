 import type { FastifyInstance } from 'fastify'
import type { LoginTicket } from 'google-auth-library'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ── Types ──────────────────────────────────────────────────────────────────────

interface GoogleBody {
  idToken: string
}

const devLoginSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CLIENT', 'GENEP', 'ADMIN']).optional().default('CLIENT'),
})

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

  // POST /auth/dev — Development-only endpoint for testing without Google OAuth
  fastify.post<{ Body: z.infer<typeof devLoginSchema> }>('/auth/dev', {
    schema: { body: devLoginSchema },
  }, async (request, reply) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return reply.code(403).send({ error: 'Dev endpoint not available in production' })
    }

    const { email, role: roleInput = 'CLIENT' } = request.body

    // Create or get test user
    // Only set role on creation, not on update (preserve existing role)
    const user = await fastify.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, googleId: `dev-${email}`, role: roleInput as any },
    })

    if (!user.active) {
      return reply.code(403).send({ error: 'Account disabled' })
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role }
    const token = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' })

    fastify.log.info({ email, role: user.role }, 'Development login created')

    return reply.send({ token, user: tokenPayload })
  })
}
