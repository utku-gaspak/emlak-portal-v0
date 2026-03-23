import fs from "node:fs";
import path from "node:path";

function fixMojibakeString(value) {
  if (typeof value !== "string") {
    return value;
  }

  if (!/[ÃÄÅâÂ]/.test(value)) {
    return value;
  }

  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function walk(value) {
  if (Array.isArray(value)) {
    return value.map(walk);
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      out[key] = walk(nestedValue);
    }
    return out;
  }

  return fixMojibakeString(value);
}

for (const file of ["locales/tr.json", "locales/en.json"]) {
  const absolutePath = path.resolve(file);
  const raw = fs.readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw);
  const fixed = walk(parsed);
  fs.writeFileSync(absolutePath, JSON.stringify(fixed, null, 2) + "\n", {
    encoding: "utf8"
  });
}
