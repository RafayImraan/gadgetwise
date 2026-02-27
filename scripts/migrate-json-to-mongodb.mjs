import { readFile } from "node:fs/promises";
import path from "node:path";

async function loadEnvFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const index = trimmed.indexOf("=");
      if (index <= 0) {
        return;
      }
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

await loadEnvFile(path.join(process.cwd(), ".env.local"));
await loadEnvFile(path.join(process.cwd(), ".env"));

const uri = String(process.env.MONGODB_URI || "").trim();
if (!uri) {
  console.error("Missing MONGODB_URI. Set it before running this migration.");
  process.exit(1);
}

let mongoModule;
try {
  mongoModule = await import("mongodb");
} catch (error) {
  console.error("Missing dependency 'mongodb'. Run: npm install mongodb");
  process.exit(1);
}

const dbName = String(process.env.MONGODB_DB || "nexanest").trim() || "nexanest";
const DB_FILE = path.join(process.cwd(), "data", "store-db.json");
const ENTITY_COLLECTIONS = {
  categories: "categories",
  products: "products",
  orders: "orders",
  contactMessages: "contact_messages",
  newsletterSubscribers: "newsletter_subscribers",
  customers: "customers",
  adminAuditLogs: "admin_audit_logs",
  heroCards: "hero_cards",
  testimonials: "testimonials"
};

let jsonData;
try {
  const raw = await readFile(DB_FILE, "utf8");
  jsonData = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read ${DB_FILE}:`, error.message);
  process.exit(1);
}

const { MongoClient } = mongoModule;
const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  await Promise.all(
    Object.entries(ENTITY_COLLECTIONS).map(async ([key, name]) => {
      const collection = db.collection(name);
      const docs = Array.isArray(jsonData?.[key]) ? jsonData[key] : [];
      await collection.deleteMany({});
      if (docs.length) {
        await collection.insertMany(
          docs.map((item, index) => ({
            ...item,
            __position: index
          }))
        );
      }
      await collection.createIndex({ id: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ __position: 1 });
    })
  );
  await db.collection("store_documents").deleteMany({});
  console.log("Migration complete: JSON store copied into separate MongoDB collections.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
