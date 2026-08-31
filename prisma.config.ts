import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 chuyển connection string ra khỏi schema.prisma và không tự nạp .env,
// nên nạp thủ công bằng API sẵn có của Node.
process.loadEnvFile(path.join(process.cwd(), '.env'))

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url: env('DATABASE_URL') },
  migrations: { seed: 'npx tsx ./prisma/seed.ts' },
})
