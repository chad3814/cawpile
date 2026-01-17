/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: ['.env', '.env.local'] });

module.exports = {
  migrations: {
    seed: 'tsx prisma/seed.ts'
  }
}
