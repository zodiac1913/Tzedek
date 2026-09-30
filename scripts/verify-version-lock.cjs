#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const releaseVersion = String(packageJson.releaseVersion || "").trim();
const [year, month, day, attempt] = releaseVersion.split(".");
const expectedManifestVersion = `${year}.${Number(month)}.${Number(day)}.${Number(attempt)}`;

const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "extension", "manifest.json"), "utf8"));
const runnerPaths = [
  "src/runtime/smlComplianceRunner.js",
  "extension/page/smlComplianceRunner.js",
  "demo/page/smlComplianceRunner.js"
];

const errors = [];

if (manifest.version_name !== releaseVersion) {
  errors.push(`extension/manifest.json version_name is ${manifest.version_name}, expected ${releaseVersion}`);
}
if (manifest.version !== expectedManifestVersion) {
  errors.push(`extension/manifest.json version is ${manifest.version}, expected ${expectedManifestVersion}`);
}

for (const relativePath of runnerPaths) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  const match = source.match(/const TZEDEK_VERSION = "([^"]*)";/);
  const found = match ? match[1] : "(missing)";
  if (found !== releaseVersion) {
    errors.push(`${relativePath} TZEDEK_VERSION is ${found}, expected ${releaseVersion}`);
  }
}

if (errors.length) {
  console.error("Version lock failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("Run: npm run version:stamp");
  process.exit(1);
}

console.log(`Version lock ok: ${releaseVersion}`);
