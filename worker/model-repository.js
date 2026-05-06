const MANIFEST_PUBLIC_ID = "chainandchisel/model-repository/index.json";
const IMAGE_PREFIX = "chainandchisel/model-repository/images";
const ARCHIVE_PREFIX = "chainandchisel/model-repository/archives";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ARCHIVE_EXTENSIONS = new Set(["zip"]);
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const ARCHIVE_MAX_BYTES = 75 * 1024 * 1024;

export async function handleModelRepository(request, env) {
  if (request.method === "OPTIONS") return emptyResponse("GET, POST, OPTIONS");
  if (request.method === "GET") {
    const manifest = await loadManifest(env);
    return jsonResponse({
      ok: true,
      manager_enabled: Boolean(String(env.MODEL_REPOSITORY_KEY || "").trim()),
      can_manage: hasValidManagerKey(request, env),
      manifest,
    });
  }
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }
  if (!hasValidManagerKey(request, env)) {
    return jsonResponse({ ok: false, error: "Manager key required." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }
  if (!body || body._loaded !== true) {
    return jsonResponse({ ok: false, error: "Repository data must be loaded before saving." }, 400);
  }

  try {
    const manifest = await saveManifest(env, normalizeManifest(body.manifest));
    return jsonResponse({ ok: true, manifest });
  } catch (error) {
    console.error("[chain-model-repository] save failed:", error);
    return jsonResponse({ ok: false, error: "Could not save model repository right now." }, 500);
  }
}

export async function handleModelRepositoryUpload(request, env) {
  if (request.method === "OPTIONS") return emptyResponse("POST, OPTIONS");
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }
  if (!hasValidManagerKey(request, env)) {
    return jsonResponse({ ok: false, error: "Manager key required." }, 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, error: "Expected multipart upload." }, 400);
  }

  const file = formData.get("file");
  const kind = String(formData.get("kind") || "image").trim().toLowerCase();
  const seriesSlug = String(formData.get("series_slug") || "").trim();
  const relativePath = String(formData.get("relative_path") || "").trim();
  if (!file || typeof file.arrayBuffer !== "function") {
    return jsonResponse({ ok: false, error: "No file provided." }, 400);
  }
  if (!seriesSlug) {
    return jsonResponse({ ok: false, error: "Series is required before upload." }, 400);
  }

  let fileBuffer;
  try {
    fileBuffer = await file.arrayBuffer();
  } catch {
    return jsonResponse({ ok: false, error: "Could not read upload." }, 400);
  }

  try {
    const asset = kind === "archive"
      ? await uploadArchive(env, {
          fileBuffer,
          mimeType: file.type,
          fileName: file.name,
          seriesSlug,
        })
      : await uploadImage(env, {
          fileBuffer,
          mimeType: file.type,
          fileName: file.name,
          seriesSlug,
          relativePath,
        });
    return jsonResponse({ ok: true, asset, kind });
  } catch (error) {
    const message = error && error.message ? error.message : "Upload failed.";
    const status = /not configured|required/i.test(message) ? 503 : 400;
    console.error("[chain-model-repository-upload]", error);
    return jsonResponse({ ok: false, error: message }, status);
  }
}

function hasValidManagerKey(request, env) {
  const required = String(env.MODEL_REPOSITORY_KEY || "").trim();
  if (!required) return false;
  const headerKey = String(request.headers.get("x-model-repo-key") || "").trim();
  return headerKey && headerKey === required;
}

function normalizeManifest(manifest) {
  const next = manifest && typeof manifest === "object" ? manifest : {};
  const series = Array.isArray(next.series) ? next.series : [];
  return {
    version: 1,
    updated_at: String(next.updated_at || ""),
    series: series.map((entry, index) => ({
      id: normalizeId(entry && entry.id, "series-" + String(index + 1)),
      slug: slugify(entry && (entry.slug || entry.title), "series-" + String(index + 1)),
      title: String(entry && entry.title || "Untitled Series").trim().slice(0, 120),
      description: String(entry && entry.description || "").trim().slice(0, 1600),
      created_at: String(entry && entry.created_at || ""),
      updated_at: String(entry && entry.updated_at || ""),
      images: Array.isArray(entry && entry.images) ? entry.images.map(normalizeImage).filter(Boolean) : [],
      archives: Array.isArray(entry && entry.archives) ? entry.archives.map(normalizeArchive).filter(Boolean) : [],
    })),
  };
}

function normalizeImage(image, index) {
  if (!image || !image.url) return null;
  return {
    id: normalizeId(image.id, "image-" + String(index || 0)),
    url: sanitizeHttpUrl(image.url),
    public_id: String(image.public_id || "").trim().slice(0, 240),
    file_name: normalizeFileName(image.file_name, "image"),
    folder_path: normalizeFolderPath(image.folder_path),
    title: String(image.title || "").trim().slice(0, 120),
    description: String(image.description || "").trim().slice(0, 600),
    cropX: clampPercent(image.cropX, 50),
    cropY: clampPercent(image.cropY, 50),
    zoom: clampZoom(image.zoom, 1),
    mime_type: String(image.mime_type || "").trim().slice(0, 80),
    bytes: normalizeBytes(image.bytes),
    created_at: String(image.created_at || ""),
  };
}

function normalizeArchive(archive, index) {
  if (!archive || !archive.url) return null;
  return {
    id: normalizeId(archive.id, "archive-" + String(index || 0)),
    url: sanitizeHttpUrl(archive.url),
    public_id: String(archive.public_id || "").trim().slice(0, 240),
    file_name: normalizeFileName(archive.file_name, "series.zip"),
    mime_type: String(archive.mime_type || "").trim().slice(0, 80),
    bytes: normalizeBytes(archive.bytes),
    created_at: String(archive.created_at || ""),
  };
}

async function loadManifest(env) {
  if (!hasCloudinary(env)) return emptyManifest();
  const asset = await findRawAsset(env, MANIFEST_PUBLIC_ID);
  if (!asset || !asset.url) return emptyManifest();
  try {
    const response = await fetch(asset.url + (asset.url.includes("?") ? "&" : "?") + "ts=" + Date.now());
    if (!response.ok) throw new Error("Manifest fetch failed: " + response.status);
    const payload = await response.json();
    return normalizeManifest(payload);
  } catch (error) {
    console.error("[chain-model-repository] load failed:", error);
    return emptyManifest();
  }
}

async function saveManifest(env, manifest) {
  if (!hasCloudinary(env)) throw new Error("Model repository storage is not configured.");
  const normalized = normalizeManifest(manifest);
  normalized.updated_at = new Date().toISOString();
  await uploadBinary(env, {
    endpoint: cloudinaryEndpoint(env, "raw"),
    publicId: MANIFEST_PUBLIC_ID,
    fileBuffer: new TextEncoder().encode(JSON.stringify(normalized, null, 2)).buffer,
    mimeType: "application/json",
    fileName: "index.json",
  });
  return normalized;
}

async function uploadImage(env, options) {
  if (!hasCloudinary(env)) throw new Error("Image storage is not configured.");
  const safeMime = String(options && options.mimeType || "").trim().toLowerCase();
  if (!IMAGE_MIME_TYPES.has(safeMime)) throw new Error("Use JPEG, PNG, WebP, or GIF images only.");
  if (!(options.fileBuffer instanceof ArrayBuffer) || !options.fileBuffer.byteLength) throw new Error("Empty image file.");
  if (options.fileBuffer.byteLength > IMAGE_MAX_BYTES) throw new Error("Image too large. Maximum 8 MB.");

  const assetId = randomHex(8);
  const publicId = `${IMAGE_PREFIX}/${slugify(options.seriesSlug, "series")}/${assetId}`;
  const payload = await uploadBinary(env, {
    endpoint: cloudinaryEndpoint(env, "image"),
    publicId,
    fileBuffer: options.fileBuffer,
    mimeType: safeMime,
    fileName: normalizeFileName(options.fileName, "model-image"),
  });
  return {
    id: assetId,
    url: String(payload.secure_url || "").trim(),
    public_id: String(payload.public_id || publicId).trim(),
    file_name: normalizeFileName(options.fileName, "model-image"),
    folder_path: normalizeFolderPath(options.relativePath),
    title: "",
    description: "",
    cropX: 50,
    cropY: 50,
    zoom: 1,
    mime_type: safeMime,
    bytes: normalizeBytes(options.fileBuffer.byteLength),
    created_at: new Date().toISOString(),
  };
}

async function uploadArchive(env, options) {
  if (!hasCloudinary(env)) throw new Error("Archive storage is not configured.");
  if (!(options.fileBuffer instanceof ArrayBuffer) || !options.fileBuffer.byteLength) throw new Error("Empty archive file.");
  if (options.fileBuffer.byteLength > ARCHIVE_MAX_BYTES) throw new Error("Archive too large. Maximum 75 MB.");

  const fileName = normalizeFileName(options.fileName, "series.zip");
  const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  if (!ARCHIVE_EXTENSIONS.has(extension)) throw new Error("Use ZIP archives only.");

  const assetId = randomHex(8);
  const publicId = `${ARCHIVE_PREFIX}/${slugify(options.seriesSlug, "series")}/${assetId}-${fileName}`;
  const payload = await uploadBinary(env, {
    endpoint: cloudinaryEndpoint(env, "raw"),
    publicId,
    fileBuffer: options.fileBuffer,
    mimeType: String(options.mimeType || "application/zip").trim() || "application/zip",
    fileName,
  });
  return {
    id: assetId,
    url: String(payload.secure_url || "").trim(),
    public_id: String(payload.public_id || publicId).trim(),
    file_name: fileName,
    mime_type: String(options.mimeType || "application/zip").trim() || "application/zip",
    bytes: normalizeBytes(options.fileBuffer.byteLength),
    created_at: new Date().toISOString(),
  };
}

async function findRawAsset(env, publicId) {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/raw/upload?prefix=${encodeURIComponent(publicId)}&max_results=10`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`)}`,
        },
      }
    );
    if (!response.ok) throw new Error("Cloudinary resource lookup failed: " + response.status);
    const payload = await response.json();
    const resources = Array.isArray(payload && payload.resources) ? payload.resources : [];
    return resources.find((resource) => {
      const resourcePublicId = String(resource && resource.public_id || "");
      const format = String(resource && resource.format || "");
      return resourcePublicId === publicId || (format && `${resourcePublicId}.${format}` === publicId);
    }) || null;
  } catch (error) {
    console.error("[chain-model-repository] find raw asset failed:", error);
    return null;
  }
}

async function uploadBinary(env, options) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sha1Hex(`overwrite=true&public_id=${options.publicId}&timestamp=${timestamp}` + env.CLOUDINARY_API_SECRET);
  const formData = new FormData();
  formData.append("file", new Blob([options.fileBuffer], { type: options.mimeType }), options.fileName);
  formData.append("api_key", env.CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("public_id", options.publicId);
  formData.append("overwrite", "true");
  formData.append("signature", signature);

  const response = await fetch(options.endpoint, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok || !payload.secure_url) {
    console.error("[chain-model-repository] upload failed:", JSON.stringify(payload));
    throw new Error("Upload failed.");
  }
  return payload;
}

function cloudinaryEndpoint(env, resourceType) {
  return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
}

function hasCloudinary(env) {
  return Boolean(
    String(env.CLOUDINARY_CLOUD_NAME || "").trim() &&
    String(env.CLOUDINARY_API_KEY || "").trim() &&
    String(env.CLOUDINARY_API_SECRET || "").trim()
  );
}

function emptyManifest() {
  return { version: 1, updated_at: "", series: [] };
}

function normalizeId(value, fallback) {
  const cleaned = String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return cleaned || fallback;
}

function normalizeFileName(value, fallback) {
  const cleaned = String(value || "").trim().replace(/[<>:"\\|?*\u0000-\u001F]/g, "_").slice(0, 180);
  return cleaned || fallback;
}

function normalizeFolderPath(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => normalizeFileName(part, "").trim())
    .filter(Boolean)
    .join("/")
    .slice(0, 260);
}

function normalizeBytes(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function sanitizeHttpUrl(value) {
  const url = String(value || "").trim().slice(0, 500);
  return /^https?:\/\//i.test(url) ? url : "";
}

function clampPercent(value, fallback) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : Number(fallback);
  return Number.isFinite(safe) ? Math.max(0, Math.min(100, Math.round(safe * 100) / 100)) : 50;
}

function clampZoom(value, fallback) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : Number(fallback);
  return Number.isFinite(safe) ? Math.max(1, Math.min(2.5, Math.round(safe * 100) / 100)) : 1;
}

function slugify(value, fallback) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || String(fallback || "series");
}

async function sha1Hex(str) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function emptyResponse(methods) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "Content-Type, x-model-repo-key",
      "Cache-Control": "no-store",
    },
  });
}

