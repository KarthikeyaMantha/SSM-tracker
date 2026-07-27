import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Force Vercel to include the SQLite database file in the serverless bundle
if (process.env.NODE_ENV === "production") {
  path.join(process.cwd(), "prisma/dev.db");
}

let databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

// On Vercel, copy the read-only bundled DB to the writable /tmp directory at runtime
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  const bundledDbPath = path.join(process.cwd(), "prisma/dev.db");
  const writableDbPath = "/tmp/dev.db";

  try {
    if (fs.existsSync(bundledDbPath)) {
      if (!fs.existsSync(writableDbPath)) {
        fs.copyFileSync(bundledDbPath, writableDbPath);
      }
      databaseUrl = `file:${writableDbPath}`;
    }
  } catch (error) {
    console.error("Failed to copy database to /tmp:", error);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
