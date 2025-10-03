import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.NODE_ENV === 'production' 
      ? process.env.TURSO_DATABASE_URL! 
      : './local.db'
  },
} satisfies Config;
