import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import zlib from "zlib";

// We'll create a ZIP manually using JSZip-like approach via raw bytes
// Use Node's built-in zip support through the archiver approach

const root = "/home/runner/workspace";
const output = "/tmp/boost-community-full.zip";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", ".expo", "android", "ios",
  ".pnpm-store", "__pycache__", ".cache", ".local"
]);

const SKIP_PATHS = [];

function shouldSkip(relPath) {
  for (const skip of SKIP_PATHS) {
    if (relPath.startsWith(skip)) return true;
  }
  return false;
}

function collectFiles(dir, base = "") {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return results; }

  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (shouldSkip(relPath)) continue;
      results.push(...collectFiles(path.join(dir, entry.name), relPath));
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".log") || entry.name.endsWith(".pyc")) continue;
      results.push({ abs: path.join(dir, entry.name), rel: relPath });
    }
  }
  return results;
}

// Build a proper ZIP file using raw bytes
function uint16LE(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}
function uint32LE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
}

function dosDateTime(date) {
  const d = date || new Date();
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  return { dosDate, dosTime };
}

function crc32(buf) {
  const table = makeCRC32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable = null;
function makeCRC32Table() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }
  return crcTable;
}

async function main() {
  console.log("Collecting files...");
  const files = collectFiles(root);
  console.log(`Found ${files.length} files`);

  const chunks = [];
  const centralDir = [];
  let offset = 0;

  for (const { abs, rel } of files) {
    let data;
    try {
      data = fs.readFileSync(abs);
    } catch { continue; }

    const compressed = zlib.deflateRawSync(data, { level: 6 });
    const useCompressed = compressed.length < data.length;
    const finalData = useCompressed ? compressed : data;
    const method = useCompressed ? 8 : 0;

    const crc = crc32(data);
    const nameBytes = Buffer.from(rel, "utf8");
    const { dosDate, dosTime } = dosDateTime(new Date());

    // Local file header
    const localHeader = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // signature
      uint16LE(20),           // version needed
      uint16LE(0),            // flags
      uint16LE(method),       // compression
      uint16LE(dosTime),
      uint16LE(dosDate),
      uint32LE(crc),
      uint32LE(finalData.length),
      uint32LE(data.length),
      uint16LE(nameBytes.length),
      uint16LE(0),            // extra length
      nameBytes,
    ]);

    chunks.push(localHeader, finalData);

    // Central directory entry
    centralDir.push({
      nameBytes,
      method,
      dosTime,
      dosDate,
      crc,
      compressedSize: finalData.length,
      uncompressedSize: data.length,
      offset,
    });

    offset += localHeader.length + finalData.length;
  }

  // Write central directory
  const cdStart = offset;
  for (const e of centralDir) {
    const entry = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]), // signature
      uint16LE(20),           // version made by
      uint16LE(20),           // version needed
      uint16LE(0),            // flags
      uint16LE(e.method),
      uint16LE(e.dosTime),
      uint16LE(e.dosDate),
      uint32LE(e.crc),
      uint32LE(e.compressedSize),
      uint32LE(e.uncompressedSize),
      uint16LE(e.nameBytes.length),
      uint16LE(0),            // extra
      uint16LE(0),            // comment
      uint16LE(0),            // disk start
      uint16LE(0),            // internal attr
      uint32LE(0),            // external attr
      uint32LE(e.offset),
      e.nameBytes,
    ]);
    chunks.push(entry);
    offset += entry.length;
  }

  const cdSize = offset - cdStart;

  // End of central directory
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    uint16LE(0), uint16LE(0),
    uint16LE(centralDir.length),
    uint16LE(centralDir.length),
    uint32LE(cdSize),
    uint32LE(cdStart),
    uint16LE(0),
  ]);
  chunks.push(eocd);

  fs.writeFileSync(output, Buffer.concat(chunks));
  const size = fs.statSync(output).size;
  console.log(`✅ ZIP created: ${output}`);
  console.log(`   Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Files: ${centralDir.length}`);
}

main().catch(console.error);
