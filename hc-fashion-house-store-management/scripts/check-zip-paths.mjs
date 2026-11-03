// Lists a ZIP's entry names and fails if any uses "\" as a folder separator.
// Many unzip tools treat "\" as part of the file name, so a ZIP made by
// Windows PowerShell's Compress-Archive unpacks as flat files named
// "folder\file". For an HC Fashion House release ZIP it also checks the
// layout the launcher relies on. Usage:
//   node scripts/check-zip-paths.mjs release-build/HC-Fashion-House-v1.0.0.zip
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/check-zip-paths.mjs <file.zip>'); process.exit(1); }
const b = readFileSync(file);

// Entry names from the central directory (ZIP64 end records included).
const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) { console.error('Not a ZIP: no central directory.'); process.exit(1); }
let count = b.readUInt16LE(eocd + 10);
let p = b.readUInt32LE(eocd + 16);
if (count === 0xffff || p === 0xffffffff) {
  const loc = eocd - 20;
  if (loc < 0 || b.readUInt32LE(loc) !== 0x07064b50) { console.error('ZIP64 end record missing.'); process.exit(1); }
  const z64 = Number(b.readBigUInt64LE(loc + 8));
  count = Number(b.readBigUInt64LE(z64 + 32));
  p = Number(b.readBigUInt64LE(z64 + 48));
}
const names = [];
for (let i = 0; i < count; i++) {
  if (b.readUInt32LE(p) !== 0x02014b50) { console.error('Corrupt central directory.'); process.exit(1); }
  const n = b.readUInt16LE(p + 28); const e = b.readUInt16LE(p + 30); const c = b.readUInt16LE(p + 32);
  names.push(b.subarray(p + 46, p + 46 + n).toString());
  p += 46 + n + e + c;
}

const bad = names.filter((x) => x.includes('\\'));
console.log(`${names.length} entries, ${bad.length} with "\\"`);
console.log(names.slice(0, 3).join('\n'));
if (!names.length || bad.length) { console.error(bad.slice(0, 5).join('\n')); process.exit(1); }

if (/^HC-Fashion-House-v\d+\.\d+\.\d+(?:-FAILED)?\.zip$/i.test(basename(file))) {
  const root = 'HC-Fashion-House/';
  const problems = [];
  const stray = names.filter((x) => !x.startsWith(root));
  if (stray.length) problems.push(`entries outside ${root}, e.g. ${stray[0]}`);
  for (const need of ['HC Fashion House - WINDOWS.hta', '_system/server.js', '_system/node/node.exe', '_system/node_modules/express/package.json']) {
    if (!names.includes(root + need)) problems.push(`missing ${root}${need}`);
  }
  const unix = names.filter((x) => /\.(sh|command|bash)$/i.test(x));
  if (unix.length) problems.push(`Mac/Linux file in a Windows-only release: ${unix[0]}`);
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log('Release layout OK');
}
