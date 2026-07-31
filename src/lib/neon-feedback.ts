import { Pool } from "pg";
import type { FeedbackEntry } from "../types/search";

type GlobalWithContactFinderPool = typeof globalThis & {
  __contactFinderPool?: Pool;
};

type FeedbackRow = {
  value: string;
  type: FeedbackEntry["type"];
  organization: string;
  verdict: FeedbackEntry["verdict"];
  timestamp: Date | string;
};

const globalForPool = globalThis as GlobalWithContactFinderPool;

function getDatabaseUrl(): string | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  return databaseUrl && databaseUrl.length > 0 ? databaseUrl : null;
}

function makeKey(value: string): string {
  return value.trim().toLowerCase();
}

function getPool(): Pool | null {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  if (!globalForPool.__contactFinderPool) {
    const sslDisabled = /sslmode=disable/i.test(databaseUrl);

    globalForPool.__contactFinderPool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
    });
  }

  return globalForPool.__contactFinderPool;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS contact_feedback (
          id BIGSERIAL PRIMARY KEY,
          value TEXT NOT NULL,
          value_key TEXT,
          type TEXT NOT NULL CHECK (type IN ('email', 'linkedin', 'employee')),
          organization TEXT NOT NULL,
          organization_key TEXT,
          verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE contact_feedback ADD COLUMN IF NOT EXISTS value_key TEXT;
        ALTER TABLE contact_feedback ADD COLUMN IF NOT EXISTS organization_key TEXT;

        UPDATE contact_feedback
        SET value_key = lower(value)
        WHERE value_key IS NULL;

        UPDATE contact_feedback
        SET organization_key = lower(organization)
        WHERE organization_key IS NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS contact_feedback_unique_value_org
          ON contact_feedback (value_key, organization_key);

        CREATE INDEX IF NOT EXISTS contact_feedback_organization_lookup
          ON contact_feedback (organization_key, updated_at DESC);
      `)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  await schemaReady;
  return true;
}

function normalizeEntry(entry: FeedbackEntry): FeedbackEntry {
  return {
    value: entry.value.trim(),
    type: entry.type,
    organization: entry.organization.trim(),
    verdict: entry.verdict,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
}

function toFeedbackEntry(row: FeedbackRow): FeedbackEntry {
  return {
    value: row.value,
    type: row.type,
    organization: row.organization,
    verdict: row.verdict,
    timestamp: new Date(row.timestamp).toISOString(),
  };
}

function clampLimit(limit: number): number {
  return Math.min(Math.max(Math.trunc(limit), 1), 10_000);
}

export function isNeonConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

export async function saveFeedbackEntry(entry: FeedbackEntry): Promise<FeedbackEntry> {
  const normalized = normalizeEntry(entry);
  const pool = getPool();

  if (!pool || !(await ensureSchema())) {
    throw new Error("DATABASE_URL is not configured");
  }

  const result = await pool.query<FeedbackRow>(
    `
      INSERT INTO contact_feedback (
        value,
        value_key,
        type,
        organization,
        organization_key,
        verdict,
        timestamp,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (value_key, organization_key)
      DO UPDATE SET
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        organization = EXCLUDED.organization,
        verdict = EXCLUDED.verdict,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW()
      RETURNING value, type, organization, verdict, timestamp;
    `,
    [
      normalized.value,
      makeKey(normalized.value),
      normalized.type,
      normalized.organization,
      makeKey(normalized.organization),
      normalized.verdict,
      normalized.timestamp,
    ]
  );

  return toFeedbackEntry(result.rows[0]);
}

export async function getFeedbackEntries(limit = 50): Promise<FeedbackEntry[]> {
  const pool = getPool();

  if (!pool || !(await ensureSchema())) {
    return [];
  }

  const safeLimit = clampLimit(limit);
  const result = await pool.query<FeedbackRow>(
    `
      SELECT value, type, organization, verdict, timestamp
      FROM contact_feedback
      ORDER BY updated_at DESC, timestamp DESC
      LIMIT $1;
    `,
    [safeLimit]
  );

  return result.rows.map(toFeedbackEntry);
}

export async function getFeedbackEntriesForOrganization(
  organization: string,
  limit = 10_000
): Promise<FeedbackEntry[]> {
  const pool = getPool();

  if (!pool || !(await ensureSchema())) {
    return [];
  }

  const organizationKey = makeKey(organization);
  const safeLimit = clampLimit(limit);
  const result = await pool.query<FeedbackRow>(
    `
      SELECT value, type, organization, verdict, timestamp
      FROM contact_feedback
      WHERE organization_key = $1
      ORDER BY updated_at DESC, timestamp DESC
      LIMIT $2;
    `,
    [organizationKey, safeLimit]
  );

  return result.rows.map(toFeedbackEntry);
}
