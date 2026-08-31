#!/usr/bin/env node
/**
 * @fileoverview Deploy built Hugo site to IPFS via Pinata SDK.
 * 
 * Usage:
 *   node scripts/deploy-ipfs.cjs
 * 
 * Environment:
 *   PINATA_JWT    — Pinata JWT API key (required)
 *   PINATA_GATEWAY — Custom gateway domain (optional)
 * 
 * Output:
 *   ipfs://<cid> — the IPFS content identifier
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PINATA_JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

// Recursive file collection (no external deps)
function collectFiles(dir, base = '') {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectFiles(full, rel));
    } else {
      result.push({ full, rel });
    }
  }
  return result;
}

async function deploy() {
  if (!PINATA_JWT) {
    console.error('ERROR: PINATA_JWT not set');
    process.exit(1);
  }
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('ERROR: public/ not found. Run hugo build first.');
    process.exit(1);
  }

  const files = collectFiles(PUBLIC_DIR);
  console.log(`Found ${files.length} files in public/`);

  // Build multipart body manually (no form-data dependency)
  const boundary = '----IPFS' + Date.now().toString(36);
  const parts = [];

  function addField(name, value) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ));
  }

  function addFile(fileRel, filePath) {
    const content = fs.readFileSync(filePath);
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileRel}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    ));
    parts.push(content);
    parts.push(Buffer.from('\r\n'));
  }

  for (const f of files) {
    addFile(f.rel, f.full);
  }

  addField('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  addField('pinataMetadata', JSON.stringify({
    name: 'dominicusin-github-io',
    keyvalues: { deployed: new Date().toISOString(), source: 'github-actions' }
  }));

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  console.log(`Uploading ${Math.round(body.length / 1024 / 1024)}MB to Pinata...`);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    },
    body
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Pinata error ${res.status}: ${err}`);
    process.exit(1);
  }

  const data = await res.json();
  const cid = data.IpfsHash;

  console.log(`\n✅ Deployed to IPFS`);
  console.log(`   CID:      ipfs://${cid}`);
  console.log(`   Gateway:  https://${GATEWAY}/ipfs/${cid}`);
  console.log(`   CID file: .ipfs-cid`);

  fs.writeFileSync(path.join(__dirname, '..', '.ipfs-cid'), cid);
}

deploy().catch(e => { console.error(e); process.exit(1); });
