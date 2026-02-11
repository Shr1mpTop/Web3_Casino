/**
 * Build script to copy tarot card images to public directory for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '..', 'resources', 'Tarot Playing Cards', 'PNG');
const TARGET_DIR = path.join(__dirname, 'public', 'cards');

console.log('🃏 Copying tarot card images for production build...');

// Create target directory
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`✅ Created directory: ${TARGET_DIR}`);
}

// Copy all PNG files
const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.png'));
let copied = 0;

for (const file of files) {
  const src = path.join(SOURCE_DIR, file);
  const dest = path.join(TARGET_DIR, file);
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`✅ Copied ${copied} card images to public/cards/`);
console.log('🎉 Build preparation complete!');
