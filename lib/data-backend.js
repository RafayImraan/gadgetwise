import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeEnvValue } from "@/lib/env-utils";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "store-db.json");
const STORE_KEY = "store-db";
const backendMode = normalizeEnvValue(process.env.DATA_BACKEND, "json").toLowerCase();
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

async function ensureJsonDir() {
  await mkdir(DB_DIR, { recursive: true });
}

async function readJsonStore() {
  await ensureJsonDir();
  try {
    const raw = await readFile(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeJsonStore(value) {
  await ensureJsonDir();
  await writeFile(DB_FILE, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

let mongoDbPromise = null;

function stripMongoMeta(document) {
  const { _id, __position, ...rest } = document || {};
  return rest;
}

function hasSeparateMongoData(document) {
  if (!document || typeof document !== "object") {
    return false;
  }
  return Object.keys(ENTITY_COLLECTIONS).some((key) => Array.isArray(document[key]) && document[key].length > 0);
}

async function getMongoDb() {
  if (!mongoDbPromise) {
    mongoDbPromise = (async () => {
      const uri = normalizeEnvValue(process.env.MONGODB_URI, "");
      if (!uri) {
        throw new Error("MONGODB_URI is required when DATA_BACKEND=mongodb.");
      }

      let mongoModule;
      try {
        mongoModule = await import("mongodb");
      } catch (error) {
        throw new Error("Package 'mongodb' is required for DATA_BACKEND=mongodb.");
      }

      const dbName = normalizeEnvValue(process.env.MONGODB_DB, "nexanest") || "nexanest";
      const { MongoClient } = mongoModule;
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db(dbName);
      await Promise.all(
        Object.values(ENTITY_COLLECTIONS).map(async (name) => {
          const collection = db.collection(name);
          await collection.createIndex({ id: 1 }, { unique: true, sparse: true });
          await collection.createIndex({ __position: 1 });
        })
      );
      await db.collection("store_documents").createIndex({ key: 1 }, { unique: true });
      return db;
    })();
  }
  return mongoDbPromise;
}

async function readMongoSeparateCollections(db) {
  const result = {};
  await Promise.all(
    Object.entries(ENTITY_COLLECTIONS).map(async ([key, name]) => {
      const docs = await db.collection(name).find({}).sort({ __position: 1, _id: 1 }).toArray();
      result[key] = docs.map(stripMongoMeta);
    })
  );
  return result;
}

async function readMongoLegacyStore(db) {
  const document = await db.collection("store_documents").findOne({ key: STORE_KEY });
  if (!document || !document.value || typeof document.value !== "object") {
    return null;
  }
  return document.value || null;
}

async function writeMongoStore(value) {
  const db = await getMongoDb();
  const input = value && typeof value === "object" ? value : {};

  await Promise.all(
    Object.entries(ENTITY_COLLECTIONS).map(async ([key, name]) => {
      const collection = db.collection(name);
      const docs = Array.isArray(input[key]) ? input[key] : [];
      await collection.deleteMany({});
      if (docs.length) {
        await collection.insertMany(
          docs.map((item, index) => ({
            ...item,
            __position: index
          }))
        );
      }
    })
  );

  await db.collection("store_documents").deleteOne({ key: STORE_KEY });
}

async function readMongoStore() {
  const db = await getMongoDb();
  const separateData = await readMongoSeparateCollections(db);
  if (hasSeparateMongoData(separateData)) {
    return separateData;
  }

  const legacyValue = await readMongoLegacyStore(db);
  if (!legacyValue) {
    return null;
  }

  await writeMongoStore(legacyValue);
  return legacyValue;
}

export async function readStoreDocument() {
  if (backendMode === "mongodb") {
    return readMongoStore();
  }
  return readJsonStore();
}

export async function writeStoreDocument(value) {
  if (backendMode === "mongodb") {
    return writeMongoStore(value);
  }
  return writeJsonStore(value);
}

export function getDataBackendMode() {
  return backendMode;
}
