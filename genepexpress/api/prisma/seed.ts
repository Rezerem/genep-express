import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'
import { createHash } from 'node:crypto'

const prisma = new PrismaClient()

// ⚠️  Dev only — en prod utiliser bcrypt
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main(): Promise<void> {
  console.log('🌱 Seeding...')

  // ── Utilisateurs ─────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'admin@genepexpress.dev' },
    update: {},
    create: {
      email: 'admin@genepexpress.dev',
      passwordHash: hashPassword('admin1234'),
      role: Role.ADMIN,
    },
  })

  const alex = await prisma.user.upsert({
    where: { email: 'alex@genepexpress.dev' },
    update: {},
    create: {
      email: 'alex@genepexpress.dev',
      passwordHash: hashPassword('test1234'),
      role: Role.GENEP,
    },
  })

  const marie = await prisma.user.upsert({
    where: { email: 'marie@genepexpress.dev' },
    update: {},
    create: {
      email: 'marie@genepexpress.dev',
      passwordHash: hashPassword('test1234'),
      role: Role.GENEP,
    },
  })

  // ── Agents ───────────────────────────────────────────────────────────────────

  await prisma.genepeExpress.upsert({
    where: { userId: alex.id },
    update: {},
    create: {
      userId: alex.id,
      name: 'Alex',
      lat: 45.9237,
      lng: 6.8694,
      altitude: 1850,
      available: true,
    },
  })

  await prisma.genepeExpress.upsert({
    where: { userId: marie.id },
    update: {},
    create: {
      userId: marie.id,
      name: 'Marie',
      lat: 45.9298,
      lng: 6.8752,
      altitude: 1920,
      available: true,
    },
  })

  // ── Produits ─────────────────────────────────────────────────────────────────

  const products = [
    { name: 'Chocolat chaud',         price: 4.5,  stock: 20 },
    { name: 'Café expresso',          price: 3.0,  stock: 30 },
    { name: 'Soupe de légumes',       price: 5.5,  stock: 15 },
    { name: 'Barre énergétique',      price: 2.5,  stock: 50 },
    { name: 'Eau 50cl',               price: 2.0,  stock: 40 },
    { name: 'Vin chaud',              price: 5.0,  stock: 25 },
    { name: 'Sandwich jambon-beurre', price: 6.5,  stock: 10 },
    { name: 'Chapka de secours',      price: 15.0, stock: 5  },
  ] as const

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } })
    if (!existing) {
      await prisma.product.create({ data: product })
    }
  }

  console.log('✅ Seed terminé')
  console.log('   admin@genepexpress.dev  /  admin1234')
  console.log('   alex@genepexpress.dev   /  test1234')
  console.log('   marie@genepexpress.dev  /  test1234')
}

main()
  .catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
