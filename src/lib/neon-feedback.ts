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
          type TEXT NOT NULL CHECK (type IN ('email', 'linkedin', 'employee')),
          organization TEXT NOT NULL,
          verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS contact_feedback_unique_value_org
          ON contact_feedback (lower(value), lower(organization));
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
      INSERT INTO contact_feedback (value, type, organization, verdict, timestamp, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (lower(value), lower(organization))
      DO UPDATE SET
        type = EXCLUDED.type,
        verdict = EXCLUDED.verdict,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW()
      RETURNING value, type, organization, verdict, timestamp;
    `,
    [
      normalized.value,
      normalized.type,
      normalized.organization,
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

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 2_000);
  const result = await pool.query<FeedbackRow>(
    `
      SELECT value, type, organization, verdict, timestamp
      FROM contact_feedback
      ORDER BY timestamp DESC
      LIMIT $1;
    `,
    [safeLimit]
  );

  return result.rows.map(toFeedbackEntry);
}
