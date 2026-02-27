import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif"
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function ensureFolderName(value, fallback = "misc") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

function getFileExt(file) {
  const byMime = MIME_TO_EXT[String(file?.type || "").toLowerCase()];
  if (byMime) {
    return byMime;
  }

  const name = String(file?.name || "");
  const idx = name.lastIndexOf(".");
  if (idx !== -1 && idx < name.length - 1) {
    return name.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  }
  return "jpg";
}

function toFileArray(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

export async function saveUploadedImage(file, folder = "misc") {
  if (!file || typeof file.arrayBuffer !== "function") {
    return "";
  }
  if (!String(file.type || "").startsWith("image/")) {
    return "";
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return "";
  }

  const safeFolder = ensureFolderName(folder);
  const ext = getFileExt(file);
  const fileName = `${Date.now()}-${randomId()}.${ext}`;
  const relativeDir = path.join("uploads", safeFolder);
  const targetDir = path.join(process.cwd(), "public", relativeDir);
  const targetFile = path.join(targetDir, fileName);

  await mkdir(targetDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(targetFile, buffer);

  return `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;
}

export async function saveUploadedImages(input, folder = "misc", limit = 5) {
  const files = toFileArray(input).filter(Boolean).slice(0, Math.max(1, limit));
  const urls = [];

  for (const file of files) {
    const url = await saveUploadedImage(file, folder);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}
