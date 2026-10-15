import zlib from "node:zlib";

// Plain text from a .docx using only node:zlib. A .docx is a zip archive; the
// body is word/document.xml, where each paragraph is a <w:p> and the text
// sits in <w:t> runs. Paragraph ends become newlines so headings stay on
// their own lines, which section detection relies on.

function findEntry(buf, name) {
  // The end-of-central-directory record is in the last 64 KiB + 22 bytes.
  const start = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= start; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a .docx file (no zip directory found).");
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(at) !== 0x02014b50) break;
    const method = buf.readUInt16LE(at + 10);
    const size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28);
    const extraLen = buf.readUInt16LE(at + 30);
    const commentLen = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const entryName = buf.toString("utf8", at + 46, at + 46 + nameLen);
    if (entryName === name) {
      const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(dataStart, dataStart + size);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Unsupported compression in ${name}.`);
    }
    at += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("Not a Word document (word/document.xml is missing).");
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[ref] ?? whole;
  });
}

const PIECES = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:(?:br|cr)\b[^>]*\/>|<\/w:p>/g;

export function docxText(buffer) {
  const xml = findEntry(Buffer.from(buffer), "word/document.xml").toString("utf8");
  let text = "";
  for (const m of xml.matchAll(PIECES)) {
    if (m[1] !== undefined) text += decode(m[1]);
    else if (m[0] === "<w:tab/>") text += "\t";
    else text += "\n";
  }
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
