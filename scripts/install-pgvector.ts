#!/usr/bin/env tsx
// ─── INSTALL PGVECTOR EXTENSION ───

import pg from 'pg'

const { Client } = pg

async function installPgvector(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  
  try {
    console.log('=== PGVECTOR INSTALLATION START ===\n')
    console.log('Connecting to database...')
    await client.connect()
    console.log('✓ Connected to database\n')

    console.log('Installing pgvector extension...')
    await client.query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('✓ pgvector extension installed\n')

    console.log('Verifying installation...')
    const result = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'")
    if (result.rows.length > 0) {
      console.log('✓ pgvector extension is active\n')
    } else {
      console.log('❌ pgvector extension not found\n')
      process.exit(1)
    }

    console.log('=== PGVECTOR INSTALLATION COMPLETE ===')
  } catch (error) {
    console.error('Error installing pgvector:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

installPgvector().catch(e => {
  console.error('Installation failed:', e)
  process.exit(1)
})
