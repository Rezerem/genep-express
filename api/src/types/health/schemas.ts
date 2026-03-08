import { z } from 'zod'

export const HealthStatusSchema = z.enum(['ok', 'degraded'])
export const HealthCheckSchema = z.enum(['ok', 'error', 'unknown'])

export const HealthReplySchema = z.object({
  status: HealthStatusSchema,
  db: HealthCheckSchema,
  redis: HealthCheckSchema,
  overpass: HealthCheckSchema,
  uptime: z.number().int().nonnegative(),
})

export type HealthReply = z.infer<typeof HealthReplySchema>
export type HealthStatus = z.infer<typeof HealthStatusSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
