import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { docxText } from "../src/docx.js";

// Smallest zip a reader would accept: local headers, central directory, end record.
function zip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, content, store] of files) {
    const nameBuf = Buffer.from(name);
    const raw = Buffer.from(content);
    const data = store ? raw : zlib.deflateRawSync(raw);
    const method = store ? 0 : 8;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const para = (...runs) => `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>${runs.map((r) => `<w:r><w:t xml:space="preserve">${r}</w:t></w:r>`).join("")}</w:p>`;
const documentXml = `<?xml version="1.0"?><w:document><w:body>
  ${para("Experience")}
  ${para("Built APIs in ", "Node.js &amp; C#")}
  <w:p><w:r><w:t>Cut latency 40%</w:t><w:tab/><w:t>2023</w:t></w:r></w:p>
  ${para("Skills")}
  ${para("React, SQL")}
</w:body></w:document>`;

test("reads paragraphs, runs, tabs and entities out of a .docx", () => {
  const buf = zip([["[Content_Types].xml", "<Types/>", true], ["word/document.xml", documentXml]]);
  assert.equal(docxText(buf), "Experience\nBuilt APIs in Node.js & C#\nCut latency 40%\t2023\nSkills\nReact, SQL");
});

test("non-Word zips and non-zips say what is wrong", () => {
  assert.throws(() => docxText(zip([["readme.txt", "hi"]])), /word\/document\.xml is missing/);
  assert.throws(() => docxText(Buffer.from("plain text, not a zip at all")), /no zip directory/);
});

test("the CLI scores a .docx resume and refuses a PDF with advice", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-lens-"));
  const file = path.join(dir, "resume.docx");
  fs.writeFileSync(file, zip([["word/document.xml", documentXml]]));
  const ok = spawnSync(process.execPath, ["src/cli.js", "--input", file, "--format", "summary"], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /Overall Score: \d+/);
  const pdf = spawnSync(process.execPath, ["src/cli.js", "--input", path.join(dir, "cv.pdf")], { encoding: "utf8" });
  assert.equal(pdf.status, 1);
  assert.match(pdf.stderr, /Save the resume as \.docx or plain text/);
});
