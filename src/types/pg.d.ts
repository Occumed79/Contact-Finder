declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    ssl?: boolean | {
      rejectUnauthorized?: boolean;
    };
  }

  export interface QueryResult<Row = unknown> {
    rows: Row[];
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<Row = unknown>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
  }
}
