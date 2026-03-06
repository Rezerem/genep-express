import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding...')

  // ── Utilisateurs (Google OAuth) ───────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'ucrucy@oxyl.fr' },
    update: {},
    create: {
      email: 'ucrucy@oxyl.fr',
      googleId: 'google-dev-admin-000',
      role: Role.ADMIN,
    },
  })

  // ── Agents ───────────────────────────────────────────────────────────────────
}

main()
  .catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
