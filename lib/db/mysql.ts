import "server-only";

import mysql from "mysql2/promise";

/**
 * The connection to Bagisto's database.
 *
 * The legal domain lives in the same MySQL database Bagisto uses, in tables prefixed
 * `legal_`. One database rather than two is the whole point: a customer, their order
 * and the document that order paid for can be read in a single query, and there is no
 * pair of systems to keep in step.
 *
 * What this connection does NOT do is authenticate anyone. Sign-in goes through
 * Bagisto's own endpoint, because account status, suspension and password hashing are
 * Bagisto's to own — see lib/auth/session.ts.
 */

const REQUIRED = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"] as const;

/**
 * What may be bound to a placeholder.
 *
 * Spelled out rather than left as `unknown` so that passing an object or an array by
 * mistake is a type error here, rather than a driver serialising it into SQL in a
 * shape nobody intended. JSON columns take a string: stringify at the call site, so
 * it is visible that the value is JSON.
 */
export type Param = string | number | boolean | Date | Buffer | null;

export function isDatabaseConfigured(): boolean {
  return REQUIRED.every((key) => (process.env[key] ?? "").length > 0);
}

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool | null {
  if (!isDatabaseConfigured()) return null;

  pool ??= mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    // Money is read as strings and converted deliberately, never through a float.
    decimalNumbers: false,
    // Dates come back as written rather than shifted into the server's zone. The
    // application decides how to render a Bikram Sambat date; the driver should not
    // have an opinion about it.
    dateStrings: true,
  });

  return pool;
}

/** Rows from a SELECT. Returns an empty array when the database is unconfigured. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: Param[] = [],
): Promise<T[]> {
  const db = getPool();
  if (!db) return [];

  const [rows] = await db.query(sql, params);
  return rows as T[];
}

/** The first row, or null. */
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: Param[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** An INSERT, UPDATE or DELETE. Returns the number of rows affected. */
export async function execute(sql: string, params: Param[] = []): Promise<number> {
  const db = getPool();
  if (!db) return 0;

  const [result] = await db.execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows ?? 0;
}

/**
 * Call one of the stored procedures that hold the conduct rules.
 *
 * Each returns a single row with a `result` column, so an outcome is read rather than
 * an exception caught. `null` is a meaningful answer from several of them — from
 * legal_consume_quota it means the allowance is exhausted, which is not an error but
 * a decision to bill per use instead.
 *
 * Never wrap these in an outer transaction: each manages its own, because a FOR UPDATE
 * lock taken under autocommit is released at the end of the statement and would
 * guarantee nothing.
 */
export async function call<T = string>(
  procedure: string,
  params: Param[] = [],
): Promise<T | null> {
  const db = getPool();
  if (!db) return null;

  const placeholders = params.map(() => "?").join(", ");
  const [sets] = await db.query(`CALL \`${procedure}\`(${placeholders})`, params);

  // A CALL comes back as [resultSet, ...][], with an OkPacket appended.
  const rows = Array.isArray(sets) ? (sets[0] as Array<{ result: T | null }>) : [];
  return rows?.[0]?.result ?? null;
}
