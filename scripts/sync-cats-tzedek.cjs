"use strict";

const fs = require("node:fs");
const path = require("node:path");

const tzedekRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(tzedekRoot, "src", "runtime");
const destRoot = path.resolve(tzedekRoot, "..", "cms-dotnet-cats-source", "wwwroot", "tzedek");

const requiredEntries = [
  "smlCompliance.js",
  "smlComplianceRunner.js",
  "assets"
];

function ensureSourceExists() {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Tzedek runtime source not found: ${sourceRoot}`);
  }

  for (const entry of requiredEntries) {
    const fullPath = path.join(sourceRoot, entry);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required runtime entry in source: ${fullPath}`);
    }
  }
}

function recreateDestination() {
  fs.rmSync(destRoot, { recursive: true, force: true });
  fs.mkdirSync(destRoot, { recursive: true });
}

function copyRuntime() {
  // Mirror all runtime entries so new Tzedek runtime files are picked up automatically.
  const entries = fs.readdirSync(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(sourceRoot, entry.name);
    const dst = path.join(destRoot, entry.name);
    fs.cpSync(src, dst, { recursive: true, force: true });
  }
}

function writeStamp() {
  const stamp = {
    syncedAtUtc: new Date().toISOString(),
    source: sourceRoot,
    mode: "full-runtime-mirror",
    requiredEntries
  };
  fs.writeFileSync(path.join(destRoot, "sync-metadata.json"), JSON.stringify(stamp, null, 2) + "\n", "utf8");
}

function main() {
  ensureSourceExists();
  recreateDestination();
  copyRuntime();
  writeStamp();

  console.log("Tzedek runtime synced to CATS:", destRoot);
}

main();
