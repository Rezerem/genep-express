import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'

interface SocketAuthToken {
  id: string
  email: string
  role: 'GENEP' | 'ADMIN'
}

interface AgentPosition {
  id: string
  name: string
  lat: number
  lng: number
  altitude: number
  available: boolean
}

async function socketPlugin(fastify: FastifyInstance): Promise<void> {
  // Create Socket.io server attached to fastify.server
  const io = new Server(fastify.server, {
    cors: {
      origin: true,
    },
  })

  // Middleware: verify JWT from socket.handshake.auth.token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Missing authentication token'))
      }

      const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET ?? 'dev_secret_change_me'
      ) as SocketAuthToken

      // Attach user data to socket for later use
      ;(socket as any).user = decoded
      next()
    } catch (err: unknown) {
      next(new Error('Invalid token'))
    }
  })

  // Handle client connections
  io.on('connection', (socket) => {
    const user = (socket as any).user as SocketAuthToken
    fastify.log.info(
      { userId: user.id, role: user.role },
      `Socket connected: ${socket.id}`
    )

    // Listen for agent position updates (GENEP only)
    socket.on('agent:position', async (payload: unknown) => {
      try {
        // Verify user is a GENEP
        if (user.role !== 'GENEP') {
          fastify.log.warn(
            { userId: user.id, role: user.role },
            'Non-GENEP user tried to emit position'
          )
          return
        }

        // Validate payload
        const position = payload as Record<string, unknown>
        if (
          typeof position.lat !== 'number' ||
          typeof position.lng !== 'number' ||
          typeof position.altitude !== 'number'
        ) {
          fastify.log.warn(
            { userId: user.id },
            'Invalid position payload'
          )
          return
        }

        // Get GENEP ID from user
        const genep = await fastify.prisma.genepeExpress.findFirst({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!genep) {
          fastify.log.warn({ userId: user.id }, 'GENEP profile not found')
          return
        }

        // Store position in Redis with 10s TTL
        const key = `location:${genep.id}`
        const positionData = JSON.stringify({
          lat: position.lat,
          lng: position.lng,
          altitude: position.altitude,
        })

        await fastify.redis.setEx(key, 10, positionData)
        fastify.log.debug(
          { genepId: genep.id, position },
          'Position stored in Redis'
        )
      } catch (err: unknown) {
        fastify.log.error(
          { err, userId: user.id },
          'Error handling agent:position'
        )
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      fastify.log.info(
        { userId: user.id },
        `Socket disconnected: ${socket.id}`
      )
    })
  })

  // Broadcast positions every 10 seconds
  const broadcastInterval = setInterval(async () => {
    try {
      const keys = await fastify.redis.keys('location:*')

      if (keys.length === 0) {
        io.emit('positions:update', { agents: [] })
        return
      }

      const genepIds = keys.map((k) => k.replace('location:', ''))

      // Batch Prisma query for better performance
      const geneps = await fastify.prisma.genepeExpress.findMany({
        where: { id: { in: genepIds } },
        select: { id: true, name: true, available: true },
      })
      const genepMap = new Map<string, { id: string; name: string; available: boolean }>(
        geneps.map((g: { id: string; name: string; available: boolean }) => [g.id, g])
      )

      const agents = (
        await Promise.all(
          keys.map(async (key): Promise<AgentPosition | null> => {
            const genepId = key.replace('location:', '')
            const raw = await fastify.redis.get(key)
            if (!raw) return null

            try {
              const position = JSON.parse(raw) as {
                lat: number
                lng: number
                altitude: number
              }
              const genep = genepMap.get(genepId)
              if (!genep || !genep.name) return null

              return {
                id: genepId,
                name: genep.name as string,
                lat: position.lat,
                lng: position.lng,
                altitude: position.altitude,
                available: genep.available as boolean,
              }
            } catch (parseErr: unknown) {
              fastify.log.warn(
                { genepId },
                'Failed to parse position data'
              )
              return null
            }
          })
        )
      ).filter((agent): agent is AgentPosition => agent !== null)

      io.emit('positions:update', { agents })
    } catch (err: unknown) {
      fastify.log.error(err, 'Error broadcasting positions')
    }
  }, 10000)

  // Decorate fastify with io instance
  fastify.decorate('io', io)

  // Cleanup on server close
  fastify.addHook('onClose', async (): Promise<void> => {
    clearInterval(broadcastInterval)
    await new Promise<void>((resolve) => {
      io.close(() => {
        fastify.log.info('Socket.io server closed')
        resolve()
      })
    })
  })
}

export default fp(socketPlugin, { name: 'socket' })
