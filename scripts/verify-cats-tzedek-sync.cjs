"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const tzedekRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(tzedekRoot, "src", "runtime");
const destRoot = path.resolve(tzedekRoot, "..", "cms-dotnet-cats-source", "wwwroot", "tzedek");

const requiredEntries = [
  "smlCompliance.js",
  "smlComplianceRunner.js",
  "assets"
];

const ignoredDestinationFiles = new Set([
  "sync-metadata.json"
]);

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function collectAllFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const children = fs.readdirSync(current, { withFileTypes: true });
    for (const child of children) {
      const childFullPath = path.join(current, child.name);
      if (child.isDirectory()) {
        stack.push(childFullPath);
      } else if (child.isFile()) {
        files.push(path.relative(root, childFullPath).replaceAll("\\", "/"));
      }
    }
  }

  files.sort();
  return files;
}

function ensureRootExists(rootPath, label) {
  if (!fs.existsSync(rootPath)) {
    throw new Error(`${label} path not found: ${rootPath}`);
  }
}

function main() {
  ensureRootExists(sourceRoot, "Tzedek runtime source");
  ensureRootExists(destRoot, "CATS runtime destination");

  const sourceMissing = [];
  const destMissing = [];

  for (const entry of requiredEntries) {
    const sourceEntryPath = path.join(sourceRoot, entry);
    const destEntryPath = path.join(destRoot, entry);
    if (!fs.existsSync(sourceEntryPath)) sourceMissing.push(entry);
    if (!fs.existsSync(destEntryPath)) destMissing.push(entry);
  }

  if (sourceMissing.length > 0) {
    throw new Error(`Missing required source entries: ${sourceMissing.join(", ")}`);
  }

  if (destMissing.length > 0) {
    throw new Error(`Missing required destination entries: ${destMissing.join(", ")}`);
  }

  const sourceFiles = collectAllFiles(sourceRoot);
  const destFiles = collectAllFiles(destRoot)
    .filter((file) => !ignoredDestinationFiles.has(file));

  const sourceSet = new Set(sourceFiles);
  const destSet = new Set(destFiles);

  const onlyInSource = sourceFiles.filter((file) => !destSet.has(file));
  const onlyInDest = destFiles.filter((file) => !sourceSet.has(file));

  const hashMismatches = [];
  for (const file of sourceFiles) {
    if (!destSet.has(file)) continue;

    const sourceHash = sha256(path.join(sourceRoot, file));
    const destHash = sha256(path.join(destRoot, file));
    if (sourceHash !== destHash) {
      hashMismatches.push(file);
    }
  }

  if (onlyInSource.length === 0 && onlyInDest.length === 0 && hashMismatches.length === 0) {
    console.log("Tzedek→CATS runtime sync is valid.");
    return;
  }

  if (onlyInSource.length > 0) {
    console.error("Files in source but not in CATS destination:");
    onlyInSource.forEach((file) => console.error(`  - ${file}`));
  }

  if (onlyInDest.length > 0) {
    console.error("Files in CATS destination but not in source:");
    onlyInDest.forEach((file) => console.error(`  - ${file}`));
  }

  if (hashMismatches.length > 0) {
    console.error("Files with mismatched hashes (out of sync):");
    hashMismatches.forEach((file) => console.error(`  - ${file}`));
  }

  process.exit(1);
}

main();
