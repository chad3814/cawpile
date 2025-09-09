/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv/config');

module.exports = {
  migrations: {
    seed: 'tsx prisma/seed.ts'
  }
}
