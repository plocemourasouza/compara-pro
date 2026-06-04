import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Create the adapter (and its pg pool) lazily, only when a new client is built.
// Otherwise every dev hot-reload would build — and leak — a fresh pool.
// keepAlive + proactive idle timeout prevent stale "ConnectionClosed" errors
// when Postgres (e.g. in Docker) drops idle pooled connections.
function createPrisma(): PrismaClient {
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
		keepAlive: true,
		max: 10,
		idleTimeoutMillis: 20_000,
		connectionTimeoutMillis: 10_000,
	});
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
