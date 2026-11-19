import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.PGLITE_DIR ?? path.resolve(here, '../.pglite-data');
const port = Number(process.env.PG_PORT ?? 5433);
const host = process.env.PG_HOST ?? '127.0.0.1';

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({
  db,
  port,
  host,
  maxConnections: 10,
});

await server.start();
console.log(`🐘 Local PostgreSQL (PGlite) listening on ${host}:${port} (data: ${dataDir})`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
