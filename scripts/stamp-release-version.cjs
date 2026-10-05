#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const releaseVersion = String(packageJson.releaseVersion || "").trim();

if (!/^\d{4}\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[01])\.\d{2}$/.test(releaseVersion)) {
  console.error(`Invalid package.json releaseVersion: ${releaseVersion || "(empty)"}`);
  process.exit(1);
}

const [year, month, day, attempt] = releaseVersion.split(".");
const manifestVersion = `${year}.${Number(month)}.${Number(day)}.${Number(attempt)}`;

const manifestPath = path.join(repoRoot, "extension", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.version = manifestVersion;
manifest.version_name = releaseVersion;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Stamped extension/manifest.json → ${manifestVersion} / ${releaseVersion}`);

const runnerPath = path.join(repoRoot, "src", "runtime", "smlComplianceRunner.js");
const runnerSource = fs.readFileSync(runnerPath, "utf8");
const versionPattern = /const TZEDEK_VERSION = "[^"]*";/g;
const matches = [...runnerSource.matchAll(versionPattern)];
if (matches.length !== 1) {
  console.error("Expected exactly one TZEDEK_VERSION in src/runtime/smlComplianceRunner.js");
  process.exit(1);
}
fs.writeFileSync(
  runnerPath,
  runnerSource.replace(versionPattern, `const TZEDEK_VERSION = "${releaseVersion}";`)
);
console.log(`Stamped src/runtime/smlComplianceRunner.js → ${releaseVersion}`);

const installerPath = path.join(repoRoot, "bookmarklet", "compliance-bookmarklet.js");
const installerSource = fs.readFileSync(installerPath, "utf8");
if ([...installerSource.matchAll(versionPattern)].length !== 1) {
  throw new Error("Expected exactly one TZEDEK_VERSION in the bookmarklet installer");
}
fs.writeFileSync(installerPath, installerSource.replace(versionPattern, `const TZEDEK_VERSION = "${releaseVersion}";`));

for (const script of ["extension:sync", "demo:sync"]) {
  execFileSync("npm", ["run", script], { cwd: repoRoot, stdio: "inherit" });
}

console.log(`Version lock stamped to ${releaseVersion}`);
